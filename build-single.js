// Build a single-file HTML by inlining three.js (core + module) and app.js
const fs = require('fs');

const core = fs.readFileSync('vendor/three.core.js', 'utf8');
const mod = fs.readFileSync('vendor/three.module.js', 'utf8');
const exporter = fs.readFileSync('fbx-exporter.js', 'utf8');
const modelUps = fs.readFileSync('ronk-ups.js', 'utf8');
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
const used = [...new Set([...[app, modelUps, exporter].join('\n').matchAll(/THREE\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))];

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
const inline = `${coreS}\n${modS}\nconst THREE = { ${threeList} };\n${exporter}\n${modelUps}\n${appBody}`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hikvision Bullet Camera 3D</title>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e9edf1; }
  canvas { display: block; }
  #hint {
    position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
    font: 13px/1.5 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #8a9199; pointer-events: none; user-select: none; white-space: nowrap;
    animation: hintFade 7s ease forwards;
  }
  @keyframes hintFade { 0%, 65% { opacity: .8; } 100% { opacity: 0; } }
  #tools {
    position: fixed; top: 14px; right: 14px; display: flex; gap: 8px; z-index: 10;
    font: 12px/1 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  #tools button, #tools select {
    padding: 9px 12px; border: 1px solid #c6ccd3; border-radius: 8px;
    background: rgba(255, 255, 255, .88); color: #4a5058; cursor: pointer;
  }
  #tools button:hover, #tools select:hover { background: #fff; color: #22262b; border-color: #9aa2ab; }
  #tools select { max-width: 180px; }
</style>
</head>
<body>
<div id="tools">
  <select id="model-select" title="选择模型"></select>
  <button id="btn-shell" title="隐藏/显示外壳,查看内部结构">查看内部</button>
  <button id="btn-fbx" title="导出 model.fbx + 贴图 PNG,可导入 Blender / Unity">导出 FBX</button>
  <button id="btn-glb" title="导出 model.glb(贴图内嵌,单文件)">导出 GLB</button>
</div>
<div id="hint">拖动旋转 · 滚轮缩放</div>
<script type="module">
${inline}
</script>
</body>
</html>
`;

fs.writeFileSync('cam.html', html);
console.log('cam.html written:', (html.length / 1024 / 1024).toFixed(2), 'MB,', used.length, 'THREE names');
