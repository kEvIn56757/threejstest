// model-kit.js — 新模型共享工具（全局 MK 命名空间）
// 所有新增模型通过 MK.* 取用，避免各模型文件在单文件构建时顶层标识符冲突。
const MK = (() => {
  // three r152+ 使用 colorSpace；旧 sRGBEncoding 已移除
  function applyColorSpace(tex, THREE) {
    if (!tex) return tex;
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // 圆角矩形轮廓（XY 平面，中心在原点）
  function roundedRectShape(THREE, w, h, r) {
    const s = new THREE.Shape();
    const hw = w / 2, hh = h / 2;
    const cr = Math.min(r, hw, hh);
    s.moveTo(-hw + cr, -hh);
    s.lineTo(hw - cr, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    s.lineTo(hw, hh - cr);
    s.quadraticCurveTo(hw, hh, hw - cr, hh);
    s.lineTo(-hw + cr, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    s.lineTo(-hw, -hh + cr);
    s.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
    return s;
  }

  // 带挖孔的圆角矩形面板（用于前面板/屏幕边框）
  function roundedRectWithHole(THREE, w, h, r, iw, ih, ir) {
    const outer = roundedRectShape(THREE, w, h, r);
    if (iw && ih) outer.holes.push(roundedRectShape(THREE, iw, ih, ir || r));
    return outer;
  }

  function canvasTexture(THREE, canvas) {
    const t = new THREE.CanvasTexture(canvas);
    return applyColorSpace(t, THREE);
  }

  function tag(mesh, title, desc, geo, mat) {
    mesh.userData = Object.assign(mesh.userData || {}, {
      partTitle: title,
      partDesc: desc,
      geoType: geo,
      matType: mat,
    });
    return mesh;
  }

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return { c, ctx: c.getContext('2d') };
  }

  function label(ctx, str, x, y, opt) {
    const o = opt || {};
    ctx.save();
    ctx.font = (o.weight || 'bold') + ' ' + (o.px || 12) + 'px ' +
      (o.mono === false ? 'Inter, Arial, sans-serif' : '"JetBrains Mono", monospace');
    ctx.fillStyle = o.color || '#cbd5e1';
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'middle';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // 常用材质工厂：统一命名，导出后在 Blender / Unity 里好认
  function mat(THREE, type, name, params) {
    const M = type === 'physical' ? THREE.MeshPhysicalMaterial
      : type === 'basic' ? THREE.MeshBasicMaterial
        : THREE.MeshStandardMaterial;
    const m = new M(params || {});
    m.name = name;
    return m;
  }

  // 给一组网格统一打 shell 标记
  function markShell(group) {
    group.traverse(o => { if (o.isMesh) o.userData.shell = true; });
    return group;
  }

  return { applyColorSpace, roundedRectShape, roundedRectWithHole, canvasTexture, tag, canvas, label, mat, markShell };
})();
