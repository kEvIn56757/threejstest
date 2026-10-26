// Iteratively resolve duplicate top-level identifiers between core/module/app
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// 临时文件放在系统临时目录(/tmp 在 Windows 上会被解析为 D:\tmp 而不存在)
const TMP = path.join(os.tmpdir(), 'threejs-inline.mjs');
const TMP_Q = '"' + TMP + '"';

const renames = JSON.parse(fs.readFileSync('renames.json', 'utf8'));

function build() {
  fs.writeFileSync('renames.json', JSON.stringify(renames, null, 1));
  execSync('node build-single.js', { stdio: 'pipe' });
  const html = fs.readFileSync('cam.html', 'utf8');
  const m = html.match(/<script type="module">([\s\S]*)<\/script>/);
  if (!m) throw new Error('cam.html 里未找到内联模块块,构建可能失败');
  fs.writeFileSync(TMP, m[1]);
}

const FILES = { mod: 'vendor/three.module.js', core: 'vendor/three.core.js', app: 'app.js' };

let pass = 0;
while (pass++ < 800) {
  build();
  let err = '';
  try {
    execSync('node --check ' + TMP_Q + ' 2>&1', { stdio: 'pipe' });
    console.log('SYNTAX_OK after', pass - 1, 'renames');
    process.exit(0);
  } catch (e) {
    err = String(e.stdout || e.message);
  }
  const mm = err.match(/Identifier ['"](.+?)['"] has already been declared|Cannot redeclare block-scoped variable ['"](.+?)['"]/);
  if (!mm) {
    console.error('UNHANDLED ERROR:\n' + err.split('\n').slice(0, 8).join('\n'));
    process.exit(1);
  }
  const name = mm[1] || mm[2];
  if (renames[name]) {
    console.error('already renamed but still failing:', name);
    process.exit(1);
  }
  renames[name] = null;
  // rename in the first file that declares it: module > core > app
  let done = false;
  for (const key of ['mod', 'core', 'app']) {
    const src = fs.readFileSync(FILES[key], 'utf8');
    const re = new RegExp('\\b' + name.replace(/[$]/g, '\\$') + '\\b');
    if (re.test(src)) {
      const suffix = key === 'app' ? '_a' : '_m';
      const newSrc = src.replace(new RegExp('\\b' + name.replace(/[$]/g, '\\$') + '\\b', 'g'), name + suffix);
      fs.writeFileSync(FILES[key], newSrc);
      renames[name] = name + suffix + ' (in ' + key + ')';
      done = true;
      break;
    }
  }
  if (!done) { console.error('name not found anywhere:', name); process.exit(1); }
  if (pass % 25 === 0) console.log('...pass', pass, 'last:', name);
}
console.error('too many passes');
process.exit(1);
