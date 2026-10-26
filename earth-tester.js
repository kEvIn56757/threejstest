// earth-tester.js — 防雷接地检测仪(接地电阻测试仪)程序化模型
// 单位:厘米(cm)。整机约 17.5(宽 Z) × 12.5(高 Y) × 6.9(厚 X) cm,
// 与同类仪表 174.6 × 125.4 × 69 mm 的外形尺寸一致。
// 朝向:前面板朝 +X,左右 ±Z,后面板 −X。THREE 作为参数传入,便于单文件内联。
// 外观参考:黄色外壳 + 黑色前面板 + LCD 显示窗 + 按键组 + 右下角旋转挡位开关 + 底部三接线柱及测试线。
function buildEarthTester(THREE) {
  const group = new THREE.Group();
  group.name = 'earth_tester';

  const W = 17.5, H = 12.5, D = 6.9; // Z、Y、X 方向尺寸
  const HALF = D / 2;
  const FT = HALF + 0.3;             // 前面板外表面基准 X

  // ---------- 材质 ----------
  const mk = (name, color, opts) => {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.5, metalness: 0.05 }, opts || {}));
    m.name = name;
    return m;
  };
  const matBody   = mk('body_yellow', 0xf0a81a, { roughness: 0.46 });
  const matFace   = mk('face_black', 0x1b1c1e, { roughness: 0.6 });
  const matBezel  = mk('lcd_bezel', 0x0c0c0d, { roughness: 0.5 });
  const matBtn    = mk('button_black', 0x24262a, { roughness: 0.55 });
  const matKnob   = mk('dial_black', 0x17181a, { roughness: 0.4, metalness: 0.1 });
  const matRing   = mk('dial_ring_yellow', 0xf0a81a, { roughness: 0.46 });
  const matWhite  = mk('mark_white', 0xf2f2f2, { roughness: 0.4 });
  const matRed    = mk('jack_red', 0xc62828, { roughness: 0.5 });
  const matGreen  = mk('jack_green', 0x2e7d32, { roughness: 0.5 });
  const matJackB  = mk('jack_black', 0x111214, { roughness: 0.5 });
  const matHole   = mk('jack_hole', 0x050505, { roughness: 0.8 });
  const matRubber = mk('rubber_black', 0x101113, { roughness: 0.85 });

  // ---------- 工具函数 ----------
  function addMesh(geo, mat, name, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    group.add(m);
    return m;
  }

  // 圆角矩形轮廓(中心在原点;a 对应 Z 方向,b 对应 Y 方向)
  function rrShape(w, h, r) {
    const s = new THREE.Shape();
    const x0 = -w / 2, y0 = -h / 2;
    s.moveTo(x0 + r, y0);
    s.lineTo(x0 + w - r, y0);
    s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    s.lineTo(x0 + w, y0 + h - r);
    s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    s.lineTo(x0 + r, y0 + h);
    s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }

  // 沿 X 方向拉伸的圆角板:w 沿 Z,h 沿 Y,t 为厚度(X 方向),中心位于 (x, y, z)
  function slabX(w, h, r, t, bevel, mat, name, x, y, z) {
    const geo = new THREE.ExtrudeGeometry(rrShape(w, h, r), {
      depth: t,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geo.translate(0, 0, -t / 2);
    geo.rotateY(Math.PI / 2);
    return addMesh(geo, mat, name, x, y, z);
  }

  // 沿 X 方向的圆柱(轴线与 X 平行),中心位于 (x, y, z)
  function cylX(rTop, rBot, len, mat, name, x, y, z, seg) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, seg || 32);
    geo.rotateZ(-Math.PI / 2);
    return addMesh(geo, mat, name, x, y, z);
  }

  // 生成带文字的 Canvas 贴图
  function canvasTex(w, h, draw, name) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.name = name;
    return t;
  }

  // ---------- 外壳 ----------
  slabX(W, H, 1.2, D, 0.25, matBody, 'case_body', 0, 0, 0);
  // 后盖(背部防滑橡胶底板)
  slabX(W - 2.2, H - 2.2, 0.8, 0.1, 0.03, matRubber, 'back_cover', -HALF - 0.12, 0, 0);
  // 四角橡胶脚
  [[-4.6, -4.4], [4.6, -4.4], [-4.6, 4.4], [4.6, 4.4]].forEach(function (p, i) {
    cylX(0.6, 0.6, 0.2, matRubber, 'rubber_foot_' + i, -HALF - 0.3, p[1], p[0], 16);
  });

  // ---------- 前面板 ----------
  // 黑色面板(略突出于外壳)
  slabX(W - 1.6, H - 1.6, 0.7, 0.12, 0.04, matFace, 'front_face', FT - 0.14, 0, 0);

  // LCD 显示窗:外框 + 屏幕(带发光贴图)
  const LCD_Y = 3.0, LCD_Z = -3.5;
  slabX(8.4, 5.0, 0.4, 0.2, 0.05, matBezel, 'lcd_bezel', FT + 0.02, LCD_Y, LCD_Z);
  // 液晶屏:黑色屏面,不显示任何数据
  const matLcd = new THREE.MeshStandardMaterial({ color: 0x080909, roughness: 0.25, metalness: 0.0 });
  matLcd.name = 'lcd_screen';
  const lcdGeo = new THREE.PlaneGeometry(7.6, 4.2);
  lcdGeo.rotateY(Math.PI / 2);
  addMesh(lcdGeo, matLcd, 'lcd_screen', FT + 0.23, LCD_Y, LCD_Z);
  // 玻璃盖板(半透明高光层)
  const matGlass = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.0, depthWrite: false });
  matGlass.name = 'lcd_glass';
  const glassGeo = new THREE.PlaneGeometry(7.6, 4.2);
  glassGeo.rotateY(Math.PI / 2);
  addMesh(glassGeo, matGlass, 'lcd_glass', FT + 0.27, LCD_Y, LCD_Z);

  // 品名标签(黄底黑字)
  const labelTex = canvasTex(512, 128, function (ctx, w, h) {
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText('防雷接地检测仪', w / 2, h * 0.42);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('EARTH RESISTANCE TESTER', w / 2, h * 0.82);
  }, 'label_texture');
  const matLabel = new THREE.MeshStandardMaterial({ color: 0xffffff, map: labelTex, roughness: 0.5 });
  matLabel.name = 'label_print';
  const labelGeo = new THREE.PlaneGeometry(6.4, 1.6);
  labelGeo.rotateY(Math.PI / 2);
  addMesh(labelGeo, matLabel, 'label_plate', FT + 0.02, -1.2, -3.5);

  // 按键组:2 列 × 3 行圆形按键
  const btnCols = [4.5, 6.9];
  const btnRows = [4.2, 2.2, 0.2];
  let bi = 0;
  btnRows.forEach(function (y) {
    btnCols.forEach(function (z) {
      bi++;
      cylX(0.5, 0.55, 0.35, matBtn, 'button_' + bi, FT + 0.175, y, z, 32);
    });
  });

  // 旋转挡位开关(右下):尺寸收小,整体落在黑色面板之内
  const DIAL_Y = -2.7, DIAL_Z = 4.9;
  cylX(1.85, 1.85, 0.3, matRing, 'dial_ring', FT + 0.15, DIAL_Y, DIAL_Z, 56);
  cylX(1.4, 1.5, 0.7, matKnob, 'dial_knob', FT + 0.65, DIAL_Y, DIAL_Z, 48);
  // 挡位刻度(圆周 12 点),位于旋钮外圈
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const ty = DIAL_Y + Math.cos(a) * 2.15;
    const tz = DIAL_Z + Math.sin(a) * 2.15;
    addMesh(new THREE.BoxGeometry(0.2, 0.18, 0.18), matWhite, 'dial_tick_' + i, FT + 0.1, ty, tz);
  }
  // 白色指针(旋钮顶部)
  addMesh(new THREE.BoxGeometry(0.08, 0.8, 0.16), matWhite, 'dial_pointer', FT + 1.04, DIAL_Y + 0.7, DIAL_Z);

  // ---------- 底部三接线柱 + 测试线 ----------
  const jackY = -4.6;
  const jacks = [
    { z: -6.6, cap: matRed, name: 'red' },
    { z: -4.6, cap: matGreen, name: 'green' },
    { z: -2.6, cap: matJackB, name: 'black' },
  ];
  jacks.forEach(function (j, i) {
    cylX(0.55, 0.55, 0.3, j.cap, 'jack_' + j.name, FT + 0.15, jackY, j.z, 32);
    cylX(0.3, 0.3, 0.12, matHole, 'jack_hole_' + j.name, FT + 0.33, jackY, j.z, 24);

  });

  return group;
}
