// Build a single-file HTML by inlining three.js (core + module) and app.js
const fs = require('fs');

const core = fs.readFileSync('vendor/three.core.js', 'utf8');
const mod = fs.readFileSync('vendor/three.module.js', 'utf8');
const zipLib = fs.readFileSync('zip.js', 'utf8');
const exporter = fs.readFileSync('fbx-exporter.js', 'utf8');
const modelUps = fs.readFileSync('ronk-ups.js', 'utf8') + '\n' + fs.readFileSync('earth-tester.js', 'utf8') + '\n' + fs.readFileSync('multimeter.js', 'utf8');
const modelThermal = fs.readFileSync('thermal-imager.js', 'utf8');
const modelRugged = fs.readFileSync('rugged-phone.js', 'utf8');
const modelClamp = fs.readFileSync('clamp-meter.js', 'utf8');
const importerSrc = fs.readFileSync('importer.js', 'utf8');
// 导入功能依赖 three 的 addons(FBXLoader 及其 NURBS/fflate 依赖),先摊平再内联
const addonLoader = fs.readFileSync('vendor/addons/FBXLoader.js', 'utf8');
const addonNurbsCurve = fs.readFileSync('vendor/addons/NURBSCurve.js', 'utf8');
const addonNurbsUtils = fs.readFileSync('vendor/addons/NURBSUtils.js', 'utf8');
const addonFflate = fs.readFileSync('vendor/addons/fflate.module.js', 'utf8');
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

// collect THREE.<name> used by app + model builders + exporter + importer
const used = [...new Set([...[app, modelUps, modelClamp, modelThermal, modelRugged, exporter, importerSrc].join('\n').matchAll(/THREE\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))];

// verify each used name is declared somewhere in the three sources
const declRe = name => new RegExp('(?:function|class|const|let|var)\\s+' + name + '\\b');
const missing = used.filter(n => !(declRe(n).test(coreS) || declRe(n).test(modS)));
if (missing.length) {
  console.error('MISSING declarations:', missing.join(', '));
  process.exit(1);
}

// strip app's dynamic import lines(THREE 与 importer 都由内联包提供)
let appBody = app.replace(/^const THREE = await import\([^)]*\);[ \t]*$/m, '');
appBody = appBody.replace(/^const \{ importModelFiles \} = await import\([^)]*\);[ \t]*$/m, '');
// 注意用正则判「动态 import(」:await importModelFiles(...) 这类普通调用不该误判
if (/await\s+import\s*\(/.test(appBody)) {
  console.error('app import line not removed');
  process.exit(1);
}

// addons(fflate + NURBS + FBXLoader)整体裹进 IIFE,只放出 FBXLoader 一个名字。
// 原因:addons 是第三方代码,顶层声明(dataArray / tempEuler / ...)与 three 内部实现
// 撞名时会让内联包直接语法报错;包一层作用域就彻底隔离,也不必去改 three 源码。
const fflateIIFE = 'const unzlibSync = (function () {\n'
  + stripModuleSyntax(addonFflate, 'fflate')
  + '\nreturn unzlibSync;\n})();\n';
const addonsInline = 'const __addons = (function () {\n'
  + fflateIIFE
  + stripModuleSyntax(addonNurbsUtils, 'nurbs-utils') + '\n'
  + stripModuleSyntax(addonNurbsCurve, 'nurbs-curve') + '\n'
  + stripModuleSyntax(addonLoader, 'fbx-loader') + '\n'
  + 'return { FBXLoader };\n})();\nconst FBXLoader = __addons.FBXLoader;\n';
const importerInline = stripModuleSyntax(importerSrc, 'importer');

const threeList = used.sort().join(', ');
const inline = `${coreS}\n${modS}\nconst THREE = { ${threeList} };\n${zipLib}\n${exporter}\n${modelUps}\n${modelClamp}\n${modelThermal}\n${modelRugged}\n${addonsInline}\n${importerInline}\n${appBody}`;

// 以 index.html 为唯一模板:把外部 <script src> 换成内联包,避免两处 HTML 各自维护导致走样
let html = fs.readFileSync('index.html', 'utf8');

let removed = 0;
html = html.replace(/[ \t]*<script src="\.\/(?:zip|fbx-exporter|ronk-ups|clamp-meter|earth-tester|multimeter|thermal-imager|rugged-phone)\.js"><\/script>\r?\n?/g, () => {
  removed++;
  return '';
});
if (removed !== 8) {
  console.error('index.html 里的外部脚本标签数量异常(期望 8 个,实际 ' + removed + ' 个)');
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
