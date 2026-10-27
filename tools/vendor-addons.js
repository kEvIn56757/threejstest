// tools/vendor-addons.js — 把 three 的 addons(FBXLoader 及其依赖)摊平到 vendor/addons/
//
// 目的:项目是纯静态站点,不打包、不依赖 CDN,浏览器只认相对路径。
// 这里从 node_modules 复制源文件并把裸模块 'three' 改成相对路径。
//
//   node tools/vendor-addons.js          # 依赖升级后重跑
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'node_modules/three/examples/jsm');
const OUT = path.join(ROOT, 'vendor/addons');

const FILES = [
  ['loaders/FBXLoader.js', 'FBXLoader.js'],
  ['curves/NURBSCurve.js', 'NURBSCurve.js'],
  ['curves/NURBSUtils.js', 'NURBSUtils.js'],
  ['libs/fflate.module.js', 'fflate.module.js'],
];

// 模块说明符 → 相对 vendor/addons/ 的路径
const REWRITE = {
  "'three'": "'../three.module.js'",
  "'../libs/fflate.module.js'": "'./fflate.module.js'",
  "'../curves/NURBSCurve.js'": "'./NURBSCurve.js'",
  "'../curves/NURBSUtils.js'": "'./NURBSUtils.js'",
};

fs.mkdirSync(OUT, { recursive: true });

let total = 0;
for (const [src, dst] of FILES) {
  const srcPath = path.join(SRC, src);
  let code = fs.readFileSync(srcPath, 'utf8');
  const before = code;
  for (const [from, to] of Object.entries(REWRITE)) code = code.split(from).join(to);
  if (code === before) console.warn('  ! 没有发生改写,检查 import 写法:', src);
  fs.writeFileSync(path.join(OUT, dst), code);
  total += code.length;
  console.log('  ' + dst.padEnd(20) + (code.length / 1024).toFixed(1) + ' KB');
}

// 版本记录,方便日后核对与 node_modules 是否一致
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/three/package.json'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'VERSION.txt'),
  'three ' + pkg.version + '\n来源: node_modules/three/examples/jsm\n生成脚本: tools/vendor-addons.js\n');
console.log('vendor/addons 就绪,共', (total / 1024).toFixed(1), 'KB, three', pkg.version);
