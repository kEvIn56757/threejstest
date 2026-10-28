// Build a single-file HTML by inlining three.js (core + module) and app.js
const fs = require('fs');

const core = fs.readFileSync('vendor/three.core.js', 'utf8');
const mod = fs.readFileSync('vendor/three.module.js', 'utf8');
const zipLib = fs.readFileSync('zip.js', 'utf8');
const exporter = fs.readFileSync('fbx-exporter.js', 'utf8');
const modelSources = [
  'ronk-ups.js',
  'earth-tester.js',
  'multimeter.js',
  'multimeter-2.js',
  'air-detector.js',
  'kindergarten-frame.js',
  'hikvision-column-speaker.js',
].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const app = fs.readFileSync('app.js', 'utf8');

function stripModuleSyntax(src, label) {
  let s = src;
  // import statements (single & multi-line, side-effect & named)
  s = s.replace(/^import\s+(?:[\s\S]*?)?\s*from\s*['"][^'"]+['"];?[ \t]*$/gm, '');
  s = s.replace(/^import\s*['"][^'"]+['"];?[ \t]*$/gm, '');
  // export * from
  s = s.replace(/^export\s*\*\s*from\s*['"][^'"]+['"];?[ \t]*$/gm, '');
  // re-export lists: export { A, B as C, ... } [from '...'];
  s = s.replace(/export\s*\{[\s\S]*?\}\s*(?:from\s*['"][^'"]+['"])?\s*;?/g, '');
  // inline exports (if any)
  s = s.replace(/\bexport\s+default\s+/g, '');
  s = s.replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, '');
  return s;
}

const coreS = stripModuleSyntax(core, 'core');
const modS = stripModuleSyntax(mod, 'module');

// collect THREE.<name> used by app + model builders + exporter
const used = [...new Set([...[app, modelSources, exporter].join('\n').matchAll(/THREE\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))];

// verify each used name is declared somewhere in the three sources
const declRe = name => new RegExp('(?:function|class|const|let|var)\\s+' + name + '\\b');
const missing = used.filter(n => !(declRe(n).test(coreS) || declRe(n).test(modS)));
if (missing.length) {
  console.error('MISSING declarations:', missing.join(', '));
  process.exit(1);
}

// strip app's dynamic import line
const appBody = app.replace(/^const THREE = await import\([^)]*\);[ \t]*$/m, '');
if (appBody.includes('await import')) {
  console.error('app import line not removed');
  process.exit(1);
}

const threeList = used.sort().join(', ');
const inline = `${coreS}\n${modS}\nconst THREE = { ${threeList} };\n${zipLib}\n${exporter}\n${modelSources}\n${appBody}`;

// 以 index.html 为唯一模板:把外部 <script src> 换成内联包,避免两处 HTML 各自维护导致走样
let html = fs.readFileSync('index.html', 'utf8');

let removed = 0;
html = html.replace(/[ \t]*<script src="\.\/(?:zip|fbx-exporter|ronk-ups|earth-tester|multimeter|multimeter-2|air-detector|kindergarten-frame|hikvision-column-speaker)\.js"><\/script>\r?\n?/g, () => {
  removed++;
  return '';
});
if (removed !== 9) {
  console.error('index.html 里的外部脚本标签数量异常(期望 9 个,实际 ' + removed + ' 个)');
  process.exit(1);
}

const moduleTag = /<script type="module" src="\.\/app\.js"><\/script>/;
if (!moduleTag.test(html)) {
  console.error('index.html 里找不到 app.js 模块标签');
  process.exit(1);
}
// 用函数式替换,避免 inline 内容里的 $& / $1 被当作替换模式解析
html = html.replace(moduleTag, () => '<script type="module">\n' + inline + '\n</script>');

fs.writeFileSync('cam.html', html);
console.log('cam.html written:', (html.length / 1024 / 1024).toFixed(2), 'MB,', used.length, 'THREE names');
