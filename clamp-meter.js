// clamp-meter.js — DT201D 数字钳形表 (AC/DC TRUE RMS CLAMP METER)
// 单位:厘米(cm)。整机约 6.4(宽, 含扳机) × 21.0(高) × 2.9(厚), 钳口内径 42 mm。
// 朝向:正面朝 +Z,顶部为可张开的钳口,左侧为红色扳机(JAW TRIGGER)。
// 结构:钳口(左右两半独立,顶端留缝)→ 黑色表体(变宽轮廓放样)→ 旋钮/按键/LCD/表笔插孔。
// 涂装:表体哑光炭黑 + 钳口/扳机亮红;印字用 Canvas 贴图,刻度环随旋钮绘制。
// THREE 作为参数传入,便于 build-single.js 内联成单文件。
function buildClampMeter(THREE) {
  const group = new THREE.Group();
  group.name = 'dt201d_clamp_meter';

  // ============================================================
  //  尺寸常量(cm)
  // ============================================================
  const T = 2.90;                 // 表体总厚度
  const BEV = 0.28;               // 表体倒角(正面边缘圆润过渡)
  const FZ = T / 2;               // 正面平面 z = 1.45
  const BODY_TOP = 15.60;         // 表体顶面高度
  const JAW_YC = 17.45;           // 钳口圆心高度
  const JAW_RC = 2.90;            // 钳口中心线半径(内径≈42mm)
  const DIAL_Y = 10.60;           // 旋钮中心高度
  const DIAL_R = 1.56;            // 旋钮半径
  const LCD_Y = 4.62;             // LCD 中心高度
  const JACK_Y = 1.48;            // 插孔高度

  // ============================================================
  //  材质
  // ============================================================
  const matRed = new THREE.MeshStandardMaterial({ color: 0xc42a2c, roughness: 0.44, metalness: 0.03 });
  matRed.name = 'jaw_red';
  const matRedDark = new THREE.MeshStandardMaterial({ color: 0x9d1f21, roughness: 0.52, metalness: 0.03 });
  matRedDark.name = 'trigger_red';
  const matBody = new THREE.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.62, metalness: 0.10 });
  matBody.name = 'body_dark_gray';
  const matBodySoft = new THREE.MeshStandardMaterial({ color: 0x43474d, roughness: 0.58, metalness: 0.08 });
  matBodySoft.name = 'body_panel';
  const matBodyDeep = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.70, metalness: 0.06 });
  matBodyDeep.name = 'body_inner';
  const matBezel = new THREE.MeshStandardMaterial({ color: 0x191b1e, roughness: 0.48, metalness: 0.12 });
  matBezel.name = 'lcd_bezel';
  const matButton = new THREE.MeshStandardMaterial({ color: 0x5c626a, roughness: 0.34, metalness: 0.10 });
  matButton.name = 'key_button';
  const matDial = new THREE.MeshStandardMaterial({ color: 0x484c53, roughness: 0.46, metalness: 0.12 });
  matDial.name = 'rotary_knob';
  const matDialTop = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.52, metalness: 0.10 });
  matDialTop.name = 'rotary_knob_top';
  const matPointer = new THREE.MeshStandardMaterial({ color: 0xd8dce0, roughness: 0.42 });
  matPointer.name = 'rotary_pointer';
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x9a9fa5, roughness: 0.34, metalness: 0.85 });
  matMetal.name = 'jack_ring';
  const matHole = new THREE.MeshStandardMaterial({ color: 0x0a0b0c, roughness: 0.85 });
  matHole.name = 'jack_hole';
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.10, metalness: 0.25 });
  matGlass.name = 'jaw_glass_window';
  const matRubber = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.92 });
  matRubber.name = 'rubber_grip';

  // 贴图工具
  function makeCanvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  // ============================================================
  //  几何工具:多边形挤出 / 等宽条带
  // ============================================================
  function polyShape(pts) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
    }
    const p = area < 0 ? pts.slice().reverse() : pts;
    const s = new THREE.Shape();
    s.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) s.lineTo(p[i].x, p[i].y);
    s.closePath();
    return s;
  }

  // 沿 Z 挤出并在 Z 方向居中
  function extrude(shape, depth, bevel, mat) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
      bevelSegments: 3, curveSegments: 20, steps: 1,
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    return m;
  }

  // 变宽度条带:path 为中心线, hw 为各点半宽 → 闭合多边形
  function stripPolygon(path, hw) {
    const N = path.length;
    const A = [], B = [];
    for (let i = 0; i < N; i++) {
      const p = path[i];
      const p0 = path[Math.max(0, i - 1)], p1 = path[Math.min(N - 1, i + 1)];
      let tx = p1.x - p0.x, ty = p1.y - p0.y;
      const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
      const nx = -ty, ny = tx, h = hw[i];
      A.push({ x: p.x + nx * h, y: p.y + ny * h });
      B.push({ x: p.x - nx * h, y: p.y - ny * h });
    }
    return A.concat(B.reverse());
  }

  // 线性插值剖面 [[y, w], ...] → w(y)
  function profileW(table, y) {
    if (y <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) {
      const [y1, w1] = table[i];
      if (y <= y1) {
        const [y0, w0] = table[i - 1];
        const t = (y - y0) / (y1 - y0 || 1);
        return w0 + (w1 - w0) * t;
      }
    }
    return table[table.length - 1][1];
  }

  // ============================================================
  //  1. 表体(变宽轮廓挤出)
  // ============================================================
  // 半宽剖面:底部收窄 → 中段略鼓(旋钮区最宽) → 肩部收 → 顶部铰座外扩
  const BODY_PROF = [
    [0.00, 1.86], [0.16, 2.16], [0.40, 2.33], [0.75, 2.42], [1.60, 2.46],
    [3.00, 2.50], [5.00, 2.53], [6.60, 2.56], [7.40, 2.60], [8.60, 2.63],
    [10.80, 2.64], [12.00, 2.62], [12.90, 2.56], [13.70, 2.50], [14.30, 2.58],
    [14.90, 2.72], [15.30, 2.76], [15.60, 2.70],
  ];
  {
    const pts = [];
    // 右侧自下而上
    for (let y = 0; y <= BODY_TOP + 1e-6; y += 0.15) {
      pts.push({ x: profileW(BODY_PROF, y), y: Math.min(y, BODY_TOP) });
    }
    // 顶面(略微内凹的一道弧)
    const wTop = profileW(BODY_PROF, BODY_TOP);
    for (let i = 1; i <= 8; i++) {
      const t = i / 9;
      const x = wTop - 2 * wTop * t;
      pts.push({ x, y: BODY_TOP + 0.07 * Math.sin(Math.PI * t) });
    }
    // 左侧自上而下
    for (let y = BODY_TOP; y >= 0; y -= 0.15) {
      pts.push({ x: -profileW(BODY_PROF, y), y });
    }
    const body = extrude(polyShape(pts), T - 2 * BEV, BEV, matBody);
    body.name = 'body_shell';
    body.userData.shell = true;
    group.add(body);
  }

  // 顶面铰座两侧的圆形凸台
  [-1, 1].forEach(s => {
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.30, 28), matBodySoft);
    boss.rotation.x = Math.PI / 2;
    boss.position.set(s * 2.62, 14.62, 0);
    boss.castShadow = true;
    boss.userData.shell = true;
    group.add(boss);
  });

  // ============================================================
  //  2. 钳口(左右两半,顶端留缝)
  // ============================================================
  function jawHalf(sign) {
    const path = [], hw = [];
    const a0 = 88 * Math.PI / 180, a1 = -14 * Math.PI / 180, NA = 30;
    for (let i = 0; i <= NA; i++) {
      const a = a0 + (a1 - a0) * (i / NA);
      path.push({ x: sign * JAW_RC * Math.cos(a), y: JAW_YC + JAW_RC * Math.sin(a) });
    }
    const end = path[path.length - 1];
    const bot = { x: sign * 2.36, y: 14.02 };
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      path.push({ x: end.x + (bot.x - end.x) * t, y: end.y + (bot.y - end.y) * t });
    }
    const N = path.length;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      // 钳尖细 → 环部中 → 根部粗
      const s = t < 0.62 ? 0.50 + 0.16 * (t / 0.62) : 0.66 + 0.14 * ((t - 0.62) / 0.38);
      hw.push(s);
    }
    const poly = stripPolygon(path, hw);
    const m = extrude(polyShape(poly), 1.80 - 2 * 0.12, 0.12, matRed);
    m.name = 'jaw_' + (sign > 0 ? 'right' : 'left');
    return m;
  }
  group.add(jawHalf(1), jawHalf(-1));

  // 钳口根部黑色包边(正面,右半带铭牌)
  {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.18, 0.14), matBezel);
    plate.position.set(2.34, 15.02, 0.90);
    plate.rotation.z = -0.13;
    group.add(plate);
    const plateL = plate.clone();
    plateL.position.x = -2.34;
    plateL.rotation.z = 0.13;
    group.add(plateL);
    const texPlate = makeCanvasTex(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#d6dade'; g.textAlign = 'center';
      g.font = 'bold 46px Arial, Helvetica, sans-serif';
      g.fillText('DT201', 128, 108);
      g.font = 'bold 34px Arial, Helvetica, sans-serif';
      g.fillText('CLAMP METER', 128, 158);
      g.fillStyle = '#8d9298';
      g.font = '22px Arial, Helvetica, sans-serif';
      g.fillText('TRUE RMS', 128, 196);
    });
    const matPlate = new THREE.MeshStandardMaterial({ map: texPlate, transparent: true, roughness: 0.55, depthWrite: false });
    matPlate.name = 'jaw_nameplate';
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.04), matPlate);
    lab.position.set(2.34, 15.02, 0.975);
    lab.rotation.z = -0.13;
    group.add(lab);
  }

  // 钳口内腔的黑色衬垫(靠上,模拟软磁芯护罩)
  {
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 1.30, 40, 1, true, -0.5, Math.PI + 1.0), matBodyDeep);
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(0, JAW_YC, 0);
    // 只保留上半,靠旋转遮挡下半
    shroud.scale.set(1, 1, 1);
    shroud.visible = false; // 造型上不需要时保持关闭
    group.add(shroud);
  }

  // ============================================================
  //  3. 红色扳机(JAW TRIGGER)
  // ============================================================
  {
    const path = [
      { x: -2.52, y: 14.30 }, { x: -2.84, y: 13.96 }, { x: -3.00, y: 13.05 },
      { x: -3.07, y: 11.80 }, { x: -3.02, y: 10.55 }, { x: -2.88, y: 9.55 },
      { x: -2.64, y: 8.92 }, { x: -2.46, y: 8.62 },
    ];
    const hw = [0.34, 0.44, 0.52, 0.56, 0.55, 0.50, 0.42, 0.30];
    const trig = extrude(polyShape(stripPolygon(path, hw)), 1.76 - 2 * 0.14, 0.14, matRedDark);
    trig.name = 'jaw_trigger';
    group.add(trig);
    // 防滑横棱
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const y = 9.30 + t * 3.85;
      const x = -2.66 - 0.36 * Math.sin(Math.PI * (0.15 + 0.8 * t)) - 0.30;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 1.62), matRedDark);
      rib.position.set(x + 0.06, y, 0);
      rib.rotation.z = -0.12;
      group.add(rib);
    }
  }

  // ============================================================
  //  4. 正面印字贴图(DT201D / CE / 刻度环 / 按键与插孔标注)
  // ============================================================
  const PW = 5.24, PH = BODY_TOP;                 // 印字面覆盖范围(cm)
  const PPC = 148;                                // px / cm
  const texFront = makeCanvasTex(Math.round(PW * PPC), Math.round(PH * PPC), (g) => {
    const X = (x) => (x + PW / 2) * PPC;
    const Y = (y) => (PH - y) * PPC;
    const txt = (str, x, y, size, opt = {}) => {
      g.save();
      g.translate(X(x), Y(y));
      if (opt.rot) g.rotate(opt.rot);
      g.fillStyle = opt.color || '#cfd5db';
      g.textAlign = opt.align || 'center';
      g.textBaseline = 'middle';
      g.font = `${opt.weight || 'bold'} ${Math.round(size * PPC)}px ${opt.font || 'Arial, Helvetica, sans-serif'}`;
      if (opt.spacing) { try { g.letterSpacing = opt.spacing + 'px'; } catch (_) {} }
      g.fillText(str, 0, 0);
      g.restore();
    };
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);

    // ---- 品牌与认证(旋钮上方) ----
    txt('DT201D', -1.02, 13.82, 0.40);
    txt('TRUE RMS', -1.00, 13.38, 0.21);
    // CE 标志
    g.save();
    g.strokeStyle = '#cfd5db'; g.lineWidth = 0.055 * PPC;
    g.beginPath();
    g.arc(X(-1.94), Y(12.58), 0.24 * PPC, Math.PI * 0.62, Math.PI * 1.38);
    g.stroke();
    g.beginPath();
    g.arc(X(-1.94), Y(12.58), 0.15 * PPC, Math.PI * 0.62, Math.PI * 1.38);
    g.stroke();
    g.restore();
    txt('EN 61010-1', -1.94, 12.16, 0.16);
    txt('CAT III 600V', -1.94, 11.96, 0.16);
    txt('CAT II 1000V', -1.94, 11.76, 0.16);
    txt('V~=', -1.94, 11.56, 0.16);
    // 背光/保持 按钮左侧图标(H + 小太阳)
    g.save();
    g.strokeStyle = '#cfd5db'; g.lineWidth = 0.05 * PPC;
    g.strokeRect(X(0.26) - 0.17 * PPC, Y(13.88) - 0.15 * PPC, 0.34 * PPC, 0.30 * PPC);
    const sx = X(0.70), sy = Y(13.88);
    g.beginPath(); g.arc(sx, sy, 0.11 * PPC, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.beginPath();
      g.moveTo(sx + Math.cos(a) * 0.16 * PPC, sy + Math.sin(a) * 0.16 * PPC);
      g.lineTo(sx + Math.cos(a) * 0.23 * PPC, sy + Math.sin(a) * 0.23 * PPC);
      g.stroke();
    }
    g.restore();
    txt('H', 0.26, 13.88, 0.22);

    // ---- 旋钮刻度环 ----
    const cx = 0, cy = DIAL_Y;
    g.save();
    g.strokeStyle = '#c3c9cf';
    for (let i = 0; i < 60; i++) {
      const a = -Math.PI / 2 + (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      const r0 = (major ? 1.72 : 1.78) * PPC, r1 = 1.90 * PPC;
      g.lineWidth = (major ? 0.032 : 0.020) * PPC;
      g.beginPath();
      g.moveTo(X(cx) + Math.cos(a) * r0, Y(cy) - Math.sin(a) * r0);
      g.lineTo(X(cx) + Math.cos(a) * r1, Y(cy) - Math.sin(a) * r1);
      g.stroke();
    }
    g.restore();
    // 档位标注(极坐标定位,与旋钮档位一一对应)
    const at = (deg, r, str, size, color) => {
      const a = deg * Math.PI / 180;
      txt(str, cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, { color });
    };
    at(100, 2.36, '1000A', 0.21);
    at(78, 2.44, '~', 0.19);
    at(128, 2.22, '600A', 0.20);
    at(160, 2.16, '60A', 0.20);
    at(147, 2.40, '~', 0.18);
    at(56, 2.38, 'OFF', 0.24);
    at(197, 2.14, 'mV', 0.20);
    at(197, 2.38, '=', 0.19);
    // 下半圈功能符号
    txt('Ω', -1.22, 8.90, 0.26);
    txt(')', -0.88, 8.72, 0.24);
    txt('⊣', -0.60, 8.58, 0.22);
    txt('+', -0.34, 8.46, 0.20);
    txt('Hz', 0.52, 8.72, 0.20);
    txt('Duty', 0.52, 8.48, 0.17);
    txt('TEMP', 0.52, 8.22, 0.17);
    txt('°C °F', 0.52, 7.98, 0.16);

    // ---- 按键排标注 ----
    txt('Hz/Duty', -1.62, 7.58, 0.20);
    txt('Range', -0.16, 7.58, 0.20);
    txt('OFF', 0.64, 7.58, 0.20);
    txt('Select', 1.42, 7.58, 0.20);

    // ---- 插孔标注 ----
    txt('V', -1.56, 2.46, 0.34);
    txt('COM', 0.00, 2.46, 0.28);
    txt('°C °F Ω', 1.52, 2.62, 0.16);
    txt('Hz ⊣ +', 1.52, 2.36, 0.16);
    txt('MAX', 0.02, 0.92, 0.18);
    txt('1000V', 0.02, 0.66, 0.18);
    // 两个黄色警示三角
    const warn = (x) => {
      g.save();
      g.strokeStyle = '#e8c33c'; g.fillStyle = '#e8c33c';
      g.lineWidth = 0.05 * PPC;
      g.beginPath();
      g.moveTo(X(x), Y(1.92) - 0.30 * PPC);
      g.lineTo(X(x) + 0.30 * PPC, Y(1.92) + 0.16 * PPC);
      g.lineTo(X(x) - 0.30 * PPC, Y(1.92) + 0.16 * PPC);
      g.closePath(); g.stroke();
      g.fillStyle = '#3b3e44';
      g.font = `bold ${Math.round(0.26 * PPC)}px Arial`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('!', X(x), Y(1.92) + 0.02 * PPC);
      g.restore();
    };
    warn(-0.78); warn(0.78);
  });
  const matFront = new THREE.MeshStandardMaterial({
    map: texFront, transparent: true, roughness: 0.62, metalness: 0.08,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  matFront.name = 'front_silkscreen';
  {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), matFront);
    plane.position.set(0, PH / 2, FZ + 0.03);
    plane.userData.shell = true;
    plane.name = 'front_silkscreen';
    group.add(plane);
  }

  // ============================================================
  //  5. 旋钮(FUNCTION SWITCH)
  // ============================================================
  {
    const dial = new THREE.Group();
    dial.name = 'function_switch';
    // 底盘
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.74, 1.78, 0.20, 48), matDialTop);
    base.rotation.x = Math.PI / 2;
    base.position.z = FZ + 0.05;
    base.castShadow = true;
    base.userData.shell = true;
    dial.add(base);
    // 滚花环
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R, DIAL_R, 0.40, 48), matDial);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = FZ + 0.32;
    ring.castShadow = true;
    dial.add(ring);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.30), matDialTop);
      k.position.set(Math.cos(a) * (DIAL_R + 0.01), Math.sin(a) * (DIAL_R + 0.01), FZ + 0.32);
      k.rotation.z = a;
      dial.add(k);
    }
    // 端面
    const face = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R - 0.03, DIAL_R - 0.03, 0.10, 48), matDialTop);
    face.rotation.x = Math.PI / 2;
    face.position.z = FZ + 0.54;
    dial.add(face);
    // 中央握把(横向凸脊)
    [-0.30, 0.30].forEach(off => {
      const grip = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.26, 0.16), matDial);
      grip.position.set(0, off, FZ + 0.61);
      grip.castShadow = true;
      dial.add(grip);
    });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 24), matDialTop);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = FZ + 0.62;
    dial.add(hub);
    // 指针(当前档位:指向 1000A)
    const ptr = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.34, 0.06), matPointer);
    ptr.position.set(0, 0.86, FZ + 0.585);
    dial.add(ptr);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.24, 12), matPointer);
    tip.position.set(0, 1.56, FZ + 0.585);
    dial.add(tip);
    dial.position.set(0, DIAL_Y, 0);
    group.add(dial);
  }

  // ============================================================
  //  6. 三个按键(Hz/Duty · Range · Select)
  // ============================================================
  [[-1.62, 6.92, 1.00, 0.54], [-0.16, 6.86, 0.72, 0.46], [1.42, 6.92, 1.00, 0.54]].forEach(([x, y, w, h]) => {
    const key = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.20), matButton);
    body.position.z = FZ + 0.06;
    body.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.10, 28), matButton);
    cap.scale.set(w / 2, 1, h / 2);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = FZ + 0.18;
    key.add(body, cap);
    key.position.set(x, y, 0);
    group.add(key);
  });

  // 背光/保持 按钮(右上)
  {
    const b = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.10, 26), matBodyDeep);
    seat.rotation.x = Math.PI / 2;
    seat.position.z = FZ + 0.03;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.22, 26), matButton);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = FZ + 0.12;
    cap.castShadow = true;
    b.add(seat, cap);
    b.position.set(1.62, 13.86, 0);
    group.add(b);
  }

  // ============================================================
  //  7. LCD
  // ============================================================
  {
    // LCD 屏幕:纯黑,无任何显示内容(关机状态)
    const texLCD = makeCanvasTex(512, 244, (g, w, h) => {
      g.fillStyle = '#050607';
      g.fillRect(0, 0, w, h);
    });
    const matScreen = new THREE.MeshStandardMaterial({
      map: texLCD, roughness: 0.14, metalness: 0.10,
    });
    matScreen.name = 'lcd_screen';
    // 边框
    const frame = extrude(polyShape(roundedPts(3.86, 2.20, 0.20, 6)), 0.05, 0.02, matBezel);
    frame.position.set(0, LCD_Y, FZ + 0.015);
    frame.userData.shell = true;
    group.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.48, 1.82), matScreen);
    glass.position.set(0, LCD_Y, FZ + 0.062);
    glass.name = 'lcd_glass';
    group.add(glass);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(3.48, 1.82),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transparent: true, opacity: 0.10, roughness: 0.05,
        metalness: 0, depthWrite: false,
      }));
    pane.position.set(0, LCD_Y, FZ + 0.072);
    group.add(pane);
  }

  function roundedPts(w, h, r, n) {
    const pts = [];
    const ar = (cx, cy, a0) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (Math.PI / 2) * (i / n);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
    };
    ar(w / 2 - r, -h / 2 + r, -Math.PI / 2);   // 右下
    ar(w / 2 - r, h / 2 - r, 0);               // 右上
    ar(-w / 2 + r, h / 2 - r, Math.PI / 2);    // 左上
    ar(-w / 2 + r, -h / 2 + r, Math.PI);       // 左下
    return pts;
  }

  // ============================================================
  //  8. 表笔插孔(V / COM / Ω)
  // ============================================================
  [-1.56, 0, 1.56].forEach((x) => {
    const g1 = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 30), matMetal);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = FZ + 0.05;
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.16, 26), matHole);
    inner.rotation.x = Math.PI / 2;
    inner.position.z = FZ + 0.09;
    g1.add(ring, inner);
    g1.position.set(x, JACK_Y, 0);
    g1.userData.shell = false;
    group.add(g1);
  });

  // ============================================================
  //  9. 背面(电池仓盖 + 支撑筋 + 螺钉)
  // ============================================================
  {
    const back = new THREE.Group();
    back.name = 'back_cover';
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.10, 4.30, 0.10), matBodySoft);
    door.position.set(0, 5.20, -FZ - 0.03);
    back.add(door);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20), matMetal);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(0, 3.35, -FZ - 0.09);
    back.add(screw);
    // 两条竖向支撑筋
    [-1.78, 1.78].forEach(x => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.34, 6.6, 0.10), matBodySoft);
      rib.position.set(x, 10.10, -FZ - 0.03);
      back.add(rib);
    });
    // 背面铭牌
    const texBack = makeCanvasTex(384, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#cfd5db'; g.textAlign = 'center';
      g.font = 'bold 34px Arial, Helvetica, sans-serif';
      g.fillText('DT201D', 192, 96);
      g.font = 'bold 20px Arial, Helvetica, sans-serif';
      g.fillText('DIGITAL CLAMP METER', 192, 132);
      g.font = '18px Arial, Helvetica, sans-serif';
      g.fillText('CAT III 600V  ·  TRUE RMS', 192, 168);
    });
    const matBack = new THREE.MeshStandardMaterial({ map: texBack, transparent: true, roughness: 0.6, depthWrite: false });
    matBack.name = 'back_nameplate';
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.74), matBack);
    lab.position.set(0, 8.60, -FZ - 0.09);
    lab.rotation.y = Math.PI;
    back.add(lab);
    group.add(back);
  }

  // ============================================================
  //  10. 内部结构(「查看内部」时可见:主板 / 电池 / 旋钮触片 / 钳口轴)
  // ============================================================
  {
    const inner = new THREE.Group();
    inner.name = 'interior';
    const matPCB = new THREE.MeshStandardMaterial({ color: 0x1f6b45, roughness: 0.68 });
    matPCB.name = 'pcb_green';
    const matChip = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.55 });
    matChip.name = 'pcb_chip';
    const matCopper = new THREE.MeshStandardMaterial({ color: 0xb08d5a, roughness: 0.36, metalness: 0.85 });
    matCopper.name = 'contact_copper';
    const matBatt = new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.6 });
    matBatt.name = 'battery_9v';

    const pcb = new THREE.Mesh(new THREE.BoxGeometry(3.5, 6.6, 0.14), matPCB);
    pcb.position.set(0, 6.4, 0);
    inner.add(pcb);
    [[0.9, 7.6, 0.8], [-1.1, 6.2, 0.6], [0.2, 4.6, 1.0]].forEach(([x, y, w]) => {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.55, 0.12), matChip);
      chip.position.set(x, y, 0.13);
      inner.add(chip);
    });
    // 旋钮触片圆盘
    const wafer = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.16, 32), matChip);
    wafer.rotation.x = Math.PI / 2;
    wafer.position.set(0, DIAL_Y, 0.16);
    inner.add(wafer);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.06), matCopper);
      pad.position.set(Math.cos(a) * 1.28, DIAL_Y + Math.sin(a) * 1.28, 0.26);
      inner.add(pad);
    }
    // 9V 电池
    const bat = new THREE.Mesh(new THREE.BoxGeometry(1.70, 2.65, 1.40), matBatt);
    bat.position.set(0, 2.25, 0);
    inner.add(bat);
    [-0.45, 0.45].forEach((x, i) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.14, 16), i ? matCopper : matChip);
      t.position.set(x, 3.66, 0);
      inner.add(t);
    });
    // 钳口转轴 + 复位弹簧
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 2.2, 20), matMetal);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 15.05, 0);
    inner.add(shaft);
    const spring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 10, 22), matMetal);
    spring.position.set(0, 14.35, 0);
    inner.add(spring);
    inner.traverse(o => { if (o.isMesh) o.castShadow = true; });
    group.add(inner);
  }

  // ============================================================
  //  11. 「查看内部」:外壳变半透明(X 光),内部结构保持原位
  // ============================================================
  const ghostable = [matBody, matBodySoft, matBodyDeep, matFront, matBezel, matButton, matMetal, matBodySoft];
  group.userData.onShellToggle = (shellOn) => {
    ghostable.forEach(m => {
      if (shellOn) {
        m.transparent = m.userData.baseTransparent === true;
        m.opacity = m.userData.baseOpacity;
        m.depthWrite = m.userData.baseDepthWrite;
      } else {
        m.transparent = true;
        m.opacity = m === matFront ? 0.03 : 0.15;
        m.depthWrite = false;
      }
      m.needsUpdate = true;
    });
  };
  ghostable.forEach(m => {
    m.userData.baseTransparent = m.transparent === true;
    m.userData.baseOpacity = m.opacity;
    m.userData.baseDepthWrite = m.depthWrite;
  });

  return group;
}
