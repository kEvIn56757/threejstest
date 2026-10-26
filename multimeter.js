// multimeter.js — 数字万用表程序化模型(参考 MILESEEY MC616 样式)
// 外形:青色包胶外壳 + 黑色面板 + 顶部液晶 + 橙色功能键 + 大旋钮(外圈彩色档位环) + 底部三插孔
// 尺寸依据资料:约 150 × 74 × 50 mm(高 × 宽 × 厚),约 330 g。
// 单位:厘米(cm)。朝向:前面板朝 +X,左右 ±Z,后面板 −X。THREE 作为参数传入,便于单文件内联。
function buildMultimeter(THREE) {
  const group = new THREE.Group();
  group.name = 'multimeter';

  const D = 1.8;                 // 厚度 X(收薄,约 18 mm)
  const HALF = D / 2;
  const FT = HALF + 0.4;         // 包胶前表面基准 X(倒角厚度 0.4)

  // ---------- 材质 ----------
  const mk = (name, color, opts) => {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.55, metalness: 0.05 }, opts || {}));
    m.name = name;
    return m;
  };
  const matTeal   = mk('holster_teal', 0x21b1ab, { roughness: 0.6 });
  const matFace   = mk('face_black', 0x17181b, { roughness: 0.55 });
  const matBezel  = mk('lcd_bezel', 0x070708, { roughness: 0.5 });
  const matOrange = mk('button_orange', 0xf27a1e, { roughness: 0.45 });
  const matKnob   = mk('knob_black', 0x1c1d20, { roughness: 0.5 });
  const matKnobR  = mk('knob_ridge', 0x2a2c30, { roughness: 0.6 });
  const matRed    = mk('jack_red', 0xc62828, { roughness: 0.5 });
  const matBlack  = mk('jack_black', 0x111214, { roughness: 0.5 });
  const matHole   = mk('jack_hole', 0x050505, { roughness: 0.8 });
  const matRecess = mk('jack_recess', 0x0c0d0f, { roughness: 0.7 });
  const matRubber = mk('back_black', 0x101113, { roughness: 0.85 });

  // ---------- 工具函数 ----------
  function addMesh(geo, mat, name, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    group.add(m);
    return m;
  }
  // 外轮廓(a=Z 宽度方向,b=Y 高度方向):上下圆角、侧边略收腰
  function bodyShape(s) {
    const SX = 1.0, SY = 1.0;
    const p = function (x, y) { return [x * s * SX, y * s * SY]; };
    const sh = new THREE.Shape();
    sh.moveTo(...p(-3.1, 7.2));
    sh.quadraticCurveTo(...p(0, 7.55), ...p(3.1, 7.2));
    sh.quadraticCurveTo(...p(3.75, 6.9), ...p(3.7, 6.0));
    sh.bezierCurveTo(...p(3.55, 3.0), ...p(3.55, -3.0), ...p(3.7, -6.0));
    sh.quadraticCurveTo(...p(3.75, -6.9), ...p(3.1, -7.25));
    sh.quadraticCurveTo(...p(0, -7.6), ...p(-3.1, -7.25));
    sh.quadraticCurveTo(...p(-3.75, -6.9), ...p(-3.7, -6.0));
    sh.bezierCurveTo(...p(-3.55, -3.0), ...p(-3.55, 3.0), ...p(-3.7, 6.0));
    sh.quadraticCurveTo(...p(-3.75, 6.9), ...p(-3.1, 7.2));
    return sh;
  }
  function slabX(shape, t, bevel, mat, name, x, y, z) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: t,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 14,
    });
    geo.translate(0, 0, -t / 2);
    geo.rotateY(Math.PI / 2);
    return addMesh(geo, mat, name, x, y, z);
  }
  function roundRect(w, h, r) {
    const s = new THREE.Shape();
    const x0 = -w / 2, y0 = -h / 2;
    s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    s.lineTo(x0 + w, y0 + h - r); s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }
  function cylX(rTop, rBot, len, mat, name, x, y, z, seg) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, seg || 32);
    geo.rotateZ(-Math.PI / 2);
    return addMesh(geo, mat, name, x, y, z);
  }
  // 面向 +X 的圆盘贴图(用于档位环)
  function discTex(draw, name) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    const ctx = c.getContext('2d');
    draw(ctx);
    const t = new THREE.CanvasTexture(c);
    t.name = name;
    return t;
  }

  // ---------- 青色包胶外壳 ----------
  slabX(bodyShape(1.0), D, 0.4, matTeal, 'holster_body', 0, 0, 0);
  // 背面黑色电池盖
  slabX(bodyShape(0.78), 0.12, 0.05, matRubber, 'battery_cover', -HALF - 0.1, 0, 0);

  // ---------- 黑色前面板(四周露出青色包胶边) ----------
  slabX(bodyShape(0.9), 0.12, 0.04, matFace, 'front_face', FT + 0.02, 0, 0);

  // ---------- 液晶屏(黑色,不显示数据) ----------
  const LCD_Y = 4.9;
  slabX(roundRect(5.4, 2.9, 0.35), 0.12, 0.04, matBezel, 'lcd_bezel', FT + 0.12, LCD_Y, 0);
  const matLcd = new THREE.MeshStandardMaterial({ color: 0x080909, roughness: 0.25, metalness: 0.0 });
  matLcd.name = 'lcd_screen';
  const lcdGeo = new THREE.PlaneGeometry(5.0, 2.5);
  lcdGeo.rotateY(Math.PI / 2);
  addMesh(lcdGeo, matLcd, 'lcd_screen', FT + 0.2, LCD_Y, 0);
  const matGlass = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, roughness: 0.05, depthWrite: false });
  matGlass.name = 'lcd_glass';
  const glassGeo = new THREE.PlaneGeometry(5.0, 2.5);
  glassGeo.rotateY(Math.PI / 2);
  addMesh(glassGeo, matGlass, 'lcd_glass', FT + 0.24, LCD_Y, 0);

  // ---------- 液晶下方一条字样 ----------
  const labelTex = (function () {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 100;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#17181b';
    ctx.fillRect(0, 0, 1024, 100);
    ctx.fillStyle = '#e6e8eb';
    ctx.font = 'bold 66px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DIGITAL MULTI METER', 512, 52);
    const t = new THREE.CanvasTexture(c);
    t.name = 'label_texture';
    return t;
  })();
  const matLabel = new THREE.MeshStandardMaterial({ color: 0xffffff, map: labelTex, roughness: 0.5 });
  matLabel.name = 'label_print';
  const labelGeo = new THREE.PlaneGeometry(5.0, 0.49);
  labelGeo.rotateY(Math.PI / 2);
  addMesh(labelGeo, matLabel, 'label_plate', FT + 0.2, 2.95, 0);

  // ---------- 橙色功能键:Wake / 灯 / 手电 / HOLD ----------
  const BTN_Y = 2.1;
  [-2.4, -0.8, 0.8, 2.4].forEach(function (z, i) {
    slabX(roundRect(1.35, 0.7, 0.25), 0.2, 0.05, matOrange, 'func_button_' + i, FT + 0.12, BTN_Y, z);
  });

  // ---------- 大旋钮:外圈彩色档位环 + 黑色旋钮 ----------
  const DIAL_Y = -1.2, RING_R = 2.7;
  const ringTex = discTex(function (ctx) {
    ctx.fillStyle = '#17181b';
    ctx.fillRect(0, 0, 1024, 1024);
    const N = 16;
    const cols = ['#2e7fc4', '#8e979f'];
    const labels = ['V', '200m', '2k', '20m', 'A', '2V', 'Ω', '2M', 'V', '200μ', 'A', '10A', 'OFF', '600', '200', '20'];
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2 - Math.PI / 2 - Math.PI / N * 0.9;
      const a1 = a0 + (Math.PI * 2 / N) * 0.9;
      ctx.beginPath();
      ctx.moveTo(512, 512);
      ctx.arc(512, 512, 510, a0, a1);
      ctx.closePath();
      ctx.fillStyle = cols[i % 2];
      ctx.fill();
    }
    // 中间留出黑色圆盘,文字放在彩色段上
    ctx.fillStyle = '#17181b';
    ctx.beginPath(); ctx.arc(512, 512, 370, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.translate(512 + Math.cos(a) * 430, 512 + Math.sin(a) * 430);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(labels[i], 0, 0);
      ctx.restore();
    }
  }, 'dial_ring_texture');
  const matRing = new THREE.MeshStandardMaterial({ color: 0xffffff, map: ringTex, roughness: 0.45 });
  matRing.name = 'dial_ring';
  const ringGeo = new THREE.CircleGeometry(RING_R, 96);
  ringGeo.rotateY(Math.PI / 2);
  addMesh(ringGeo, matRing, 'dial_ring', FT + 0.18, DIAL_Y, 0);
  // 旋钮(黑色,带棱纹)
  cylX(1.8, 1.9, 0.75, matKnob, 'dial_knob', FT + 0.45, DIAL_Y, 0, 64);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    addMesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), matKnobR, 'knob_ridge_' + i, FT + 0.45, DIAL_Y + Math.cos(a) * 1.85, DIAL_Z_OFFSET(a));
  }
  function DIAL_Z_OFFSET(a) { return Math.sin(a) * 1.85; }
  // 指示凹槽(旋钮顶部斜向白线)
  addMesh(new THREE.BoxGeometry(0.06, 1.0, 0.2), new THREE.MeshStandardMaterial({ color: 0xe6e8eb, roughness: 0.4 }), 'dial_pointer', FT + 0.84, DIAL_Y + 0.6, 0);

  // ---------- 底部区域:单位文字 + 三个插孔 ----------
  const jackY = -5.7;
  [
    { z: 2.3, cap: matRed, name: '10A' },
    { z: 0.0, cap: matBlack, name: 'COM' },
    { z: -2.3, cap: matRed, name: 'VmA' },
  ].forEach(function (j) {
    cylX(0.58, 0.58, 0.12, matRecess, 'jack_recess_' + j.name, FT + 0.08, jackY, j.z, 28);
    cylX(0.42, 0.42, 0.22, j.cap, 'jack_' + j.name, FT + 0.2, jackY, j.z, 28);
    cylX(0.2, 0.2, 0.08, matHole, 'jack_hole_' + j.name, FT + 0.32, jackY, j.z, 20);
  });

  return group;
}
