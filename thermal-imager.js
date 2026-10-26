// thermal-imager.js — HIKVISION / HIKMICRO HM-TPH11-3AXF (H11) 手持热成像仪
// 单位:厘米(cm)。整机 221.7 × 73.5 × 80.5 mm(高 × 宽 × 深),含电池 <360 g。
// 朝向:屏幕面朝 +X(参考图所见的那一面),镜头面朝 −X,左右 ±Z,上 +Y。
//   ↳ 热像仪是"枪型":屏幕在后、红外镜头在前,红扳机在握把前方(食指位),
//     所以参考图里红扳机只从握把左侧露出一角、镜头完全不可见。
// 垂直分配(按侧视实拍反推,头部约占整机高度 51%):
//   头顶 11.09 / 头部下沿 −0.20 / 握把底 −8.02 / 电池底 −11.06  合计 22.15 cm
// 结构:屏幕头(切角放样壳)·前脸副面板 · logo 条 · LCD · 九键键盘
//       左右内嵌侧板 + 丝印 · 顶部腕带弓形环 · 前面红外镜头组 · 握把(渐变截面+棱纹橡胶)
//       电池仓(银色分界环+电芯盖+卡扣) · 内部(主控板/探测器/电池组/镜筒)
// THREE 作为参数传入,便于 build-single.js 内联成单文件。
function buildThermalImager(THREE) {
  const group = new THREE.Group();
  group.name = 'thermal_imager_h11';

  // ============================================================
  //  关键尺寸(cm)
  // ============================================================
  const X_LENS = -3.20;            // 镜头面
  const X_BACK = 3.20;             // 屏幕面
  const ZH = 3.675;                // 头部半宽(Z)
  const Y_TOP = 11.09;
  const Y_HEAD_BOT = -0.20;
  const Y_CAP_TOP = -8.02;         // 握把 / 电池盖分界(银色环)
  const Y_BOT = -11.06;
  const KH = (Y_TOP - Y_HEAD_BOT) / 2;    // 5.645
  const KC = (Y_TOP + Y_HEAD_BOT) / 2;    // 5.445

  // ============================================================
  //  材质
  // ============================================================
  const mk = (name, color, opts) => {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.7, metalness: 0.06 }, opts || {}));
    m.name = name;
    return m;
  };
  const matShell    = mk('shell_charcoal', 0x35393f, { roughness: 0.76, metalness: 0.05 });
  const matShellDk  = mk('shell_dark',     0x22252a, { roughness: 0.80, metalness: 0.04 });
  const matFace     = mk('face_panel',     0x3b4046, { roughness: 0.70, metalness: 0.06 });
  const matPanelIn  = mk('side_panel_inner', 0x191b1f, { roughness: 0.76 });
  const matKeyPanel = mk('keypad_panel',   0x1c1e22, { roughness: 0.82 });
  const matButton   = mk('key_button',     0x4a4f57, { roughness: 0.44, metalness: 0.14 });
  const matButtonHi = mk('key_button_top', 0x585e67, { roughness: 0.36, metalness: 0.16 });
  const matFrame    = mk('lcd_frame',      0x121316, { roughness: 0.40, metalness: 0.20 });
  const matRubber   = mk('rubber_grip',    0x2a2d33, { roughness: 0.92 });
  const matRed      = mk('trigger_red',    0xb32c23, { roughness: 0.44, metalness: 0.05 });
  const matRedDk    = mk('trigger_red_dark', 0x8c1f19, { roughness: 0.55 });
  const matSilver   = mk('trim_silver',    0xaaaeb4, { roughness: 0.18, metalness: 0.94 });
  const matMetalDk  = mk('metal_barrel',   0x17191c, { roughness: 0.34, metalness: 0.80 });
  const matScrew    = mk('screw_black',    0x121417, { roughness: 0.42, metalness: 0.60 });
  const matLed      = mk('led_indicator',  0xdadee2, { roughness: 0.3, emissive: 0x9aa0a6, emissiveIntensity: 0.30 });
  const matGlass    = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.04, metalness: 0.0,
    transparent: true, opacity: 0.07, depthWrite: false, clearcoat: 1
  });
  matGlass.name = 'lcd_glass';

  const matPcb      = mk('inner_pcb',      0x1d5c3a, { roughness: 0.78 });
  const matChip     = mk('inner_chip',     0x14161a, { roughness: 0.5, metalness: 0.25 });
  const matBat      = mk('inner_battery',  0x23262b, { roughness: 0.6, metalness: 0.15 });
  const matBatWrap  = mk('inner_battery_wrap', 0x2b4a86, { roughness: 0.7 });
  const matWire     = mk('inner_cable',    0x6b6f76, { roughness: 0.85 });

  // ============================================================
  //  基础工具(全部在函数作用域内,避免单文件内联顶层重名)
  // ============================================================
  const shells = [];
  function add(geo, mat, name, x, y, z, isShell) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    if (x !== undefined) m.position.set(x, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = false;
    if (isShell) { m.userData.shell = true; shells.push(m); }
    group.add(m);
    return m;
  }
  function cylX(rTop, rBot, len, mat, name, x, y, z, seg, isShell) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, seg || 40);
    geo.rotateZ(-Math.PI / 2);
    return add(geo, mat, name, x, y, z, isShell);
  }
  function cylZ(rTop, rBot, len, mat, name, x, y, z, seg, isShell) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, seg || 40);
    geo.rotateX(Math.PI / 2);
    return add(geo, mat, name, x, y, z, isShell);
  }
  // 空心圆柱(无端盖) + 双面材质,用于镜筒/遮光罩
  function cylXOpen(rTop, rBot, len, mat, name, x, y, z, seg, isShell) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, seg || 40, 1, true);
    geo.rotateZ(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.material.side = THREE.DoubleSide;
    m.name = name;
    m.position.set(x, y, z);
    m.castShadow = true;
    if (isShell) { m.userData.shell = true; shells.push(m); }
    group.add(m);
    return m;
  }

  // 有符号体积 → 闭合体定向;开放面片按"背离参考轴"定向
  function orientClosed(geo) {
    const p = geo.attributes.position.array, idx = geo.index.array;
    let v = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
         - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c])
         + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
    }
    if (v < 0) flipIndex(geo);
  }
  function flipIndex(geo) {
    const idx = geo.index.array;
    for (let t = 0; t < idx.length; t += 3) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
  }
  function orientAway(geo, fromX) {
    const p = geo.attributes.position.array, idx = geo.index.array;
    let nx = 0, cx = 0, w = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
      const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
      nx += uy * vz - uz * vy;
      cx += (p[a] + p[b] + p[c]) / 3; w += 1;
    }
    if (Math.sign(nx) !== Math.sign(cx / w - fromX)) flipIndex(geo);
  }

  // 环形拼接(管壁绕序朝外;封盖按反向闭合)
  function stitch(rings, opts) {
    opts = opts || {};
    const closed = opts.closed !== false;
    const N = rings.length, M = rings[0].length;
    const pos = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
      const p = rings[i][j];
      pos.push(p[0], p[1], p[2]);
    }
    const idx = [];
    const segs = closed ? M : M - 1;
    for (let i = 0; i < N - 1; i++) {
      for (let j = 0; j < segs; j++) {
        const j1 = (j + 1) % M;
        const a = i * M + j, b = (i + 1) * M + j, c = (i + 1) * M + j1, d = i * M + j1;
        idx.push(a, b, c, a, c, d);
      }
    }
    if (opts.capStart) {
      let cx = 0, cy = 0, cz = 0;
      for (const p of rings[0]) { cx += p[0]; cy += p[1]; cz += p[2]; }
      const ci = pos.length / 3;
      pos.push(cx / M, cy / M, cz / M);
      for (let j = 0; j < M; j++) { const j1 = (j + 1) % M; idx.push(ci, j, j1); }
    }
    if (opts.capEnd) {
      const base = (N - 1) * M;
      let cx = 0, cy = 0, cz = 0;
      for (const p of rings[N - 1]) { cx += p[0]; cy += p[1]; cz += p[2]; }
      const ci = pos.length / 3;
      pos.push(cx / M, cy / M, cz / M);
      for (let j = 0; j < M; j++) { const j1 = (j + 1) % M; idx.push(ci, base + j1, base + j); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    if (closed) orientClosed(geo);
    geo.computeVertexNormals();
    return geo;
  }

  // (z,y) 圆角矩形轮廓,固定采样点数
  function rrOutline(halfZ, halfY, r, arcN, flatN) {
    r = Math.max(0.001, Math.min(r, Math.min(halfZ, halfY) * 0.999));
    arcN = arcN || 8; flatN = flatN || 3;
    const pts = [];
    const a = halfZ - r, b = halfY - r;
    const arc = (cz, cy, a0, a1) => {
      for (let i = 0; i <= arcN; i++) {
        const t = a0 + (a1 - a0) * (i / arcN);
        pts.push({ z: cz + r * Math.cos(t), y: cy + r * Math.sin(t) });
      }
    };
    const line = (z0, y0, z1, y1) => {
      for (let i = 1; i <= flatN; i++) {
        const t = i / (flatN + 1);
        pts.push({ z: z0 + (z1 - z0) * t, y: y0 + (y1 - y0) * t });
      }
    };
    arc(a, -b, Math.PI * 1.5, Math.PI * 2);
    line(halfZ, -b, halfZ, b);
    arc(a, b, 0, Math.PI * 0.5);
    line(a, halfY, -a, halfY);
    arc(-a, b, Math.PI * 0.5, Math.PI);
    line(-halfZ, b, -halfZ, -b);
    arc(-a, -b, Math.PI, Math.PI * 1.5);
    line(-a, -halfY, a, -halfY);
    return pts;
  }

  // 切角圆角矩形轮廓:四条直边 + 四个 45° 切角(点数为 4*(SEG+CH))
  function chamferOutline(halfZ, halfY, chZ, chY, seg, chSeg) {
    seg = seg || 8; chSeg = chSeg || 5;
    const pts = [];
    const line = (z0, y0, z1, y1, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / n;
        pts.push({ z: z0 + (z1 - z0) * t, y: y0 + (y1 - y0) * t });
      }
    };
    // 逆时针:右 → 右上切角 → 上 → 左上切角 → 左 → 左下切角 → 下 → 右下切角
    line(halfZ, -halfY + chY, halfZ, halfY - chY, seg);
    line(halfZ, halfY - chY, halfZ - chZ, halfY, chSeg);
    line(halfZ - chZ, halfY, -halfZ + chZ, halfY, seg);
    line(-halfZ + chZ, halfY, -halfZ, halfY - chY, chSeg);
    line(-halfZ, halfY - chY, -halfZ, -halfY + chY, seg);
    line(-halfZ, -halfY + chY, -halfZ + chZ, -halfY, chSeg);
    line(-halfZ + chZ, -halfY, halfZ - chZ, -halfY, seg);
    line(halfZ - chZ, -halfY, halfZ, -halfY + chY, chSeg);
    return pts;
  }

  // 沿 X 放样
  function loftX(stations, outline, opts) {
    const rings = stations.map(st => {
      const s = st.s === undefined ? 1 : st.s;
      return outline.map(p => [
        st.x + (st.xOf ? st.xOf(p) : 0),
        (st.yc || 0) + p.y * s * (st.sy || 1) + (st.yOf || 0),
        p.z * s * (st.sz || 1) + (st.zOf || 0)
      ]);
    });
    return stitch(rings, opts);
  }
  // 沿 Y 放样(截面:半深 dx / 半宽 dz / 圆角 r)
  function loftY(stations, opts) {
    opts = opts || {};
    const M = opts.M || 48;
    const seg = Math.max(2, Math.round(M / 8));
    const rings = stations.map(st => {
      const pts = [];
      const dx = st.dx, dz = st.dz;
      const r = Math.max(0.001, Math.min(st.r, Math.min(dx, dz) * 0.99));
      const ax = dx - r, az = dz - r;
      const push = (x, z) => pts.push([(st.xc || 0) + x, st.y, (st.zc || 0) + z]);
      const arc = (cx, cz, a0, a1) => {
        for (let i = 0; i <= seg; i++) {
          const t = a0 + (a1 - a0) * (i / seg);
          push(cx + r * Math.cos(t), cz + r * Math.sin(t));
        }
      };
      const line = (x0, z0, x1, z1) => {
        for (let i = 1; i <= seg; i++) {
          const t = i / (seg + 1);
          push(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
        }
      };
      arc(ax, az, 0, Math.PI * 0.5);
      line(ax, dz, -ax, dz);
      arc(-ax, az, Math.PI * 0.5, Math.PI);
      line(-dx, az, -dx, -az);
      arc(-ax, -az, Math.PI, Math.PI * 1.5);
      line(-ax, -dz, ax, -dz);
      arc(ax, -az, Math.PI * 1.5, Math.PI * 2);
      line(dx, -az, dx, az);
      return pts;
    });
    return stitch(rings, opts);
  }

  // 面片
  function quadX(w, h, cell) {
    const geo = new THREE.BufferGeometry();
    const hw = w / 2, hh = h / 2;
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, hh, -hw, 0, hh, hw, 0, -hh, hw, 0, -hh, -hw
    ], 3));
    let u0 = 0, v0 = 0, uw = 1, vh = 1;
    if (cell) { u0 = cell[0]; v0 = cell[1]; uw = cell[2]; vh = cell[3]; }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([
      u0 + uw, v0 + vh, u0, v0 + vh, u0, v0, u0 + uw, v0
    ], 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    return geo;
  }
  function quadZ(w, h, dir, cell) {
    const geo = new THREE.BufferGeometry();
    const hw = w / 2, hh = h / 2, s = dir >= 0 ? 1 : -1;
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      -hw * s, hh, 0, hw * s, hh, 0, hw * s, -hh, 0, -hw * s, -hh, 0
    ], 3));
    let u0 = 0, v0 = 0, uw = 1, vh = 1;
    if (cell) { u0 = cell[0]; v0 = cell[1]; uw = cell[2]; vh = cell[3]; }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([
      u0, v0 + vh, u0 + uw, v0 + vh, u0 + uw, v0, u0, v0
    ], 2));
    geo.setIndex(s > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
    geo.computeVertexNormals();
    return geo;
  }

  // 圆角矩形 Shape
  function rrShape(halfU, halfV, r) {
    const s = new THREE.Shape();
    r = Math.max(0.001, Math.min(r, Math.min(halfU, halfV) * 0.999));
    s.moveTo(-halfU + r, -halfV);
    s.lineTo(halfU - r, -halfV);
    s.absarc(halfU - r, -halfV + r, r, -Math.PI / 2, 0, false);
    s.lineTo(halfU, halfV - r);
    s.absarc(halfU - r, halfV - r, r, 0, Math.PI / 2, false);
    s.lineTo(-halfU + r, halfV);
    s.absarc(-halfU + r, halfV - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-halfU, -halfV + r);
    s.absarc(-halfU + r, -halfV + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  const rrShapeSimple = rrShape;

  // 多边形点列 → 带小圆角过渡的 Shape(用于切角面板)
  function polyShapeSoft(pts, r) {
    const sh = new THREE.Shape();
    const n = pts.length;
    const off = (a, b, d) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      return [a[0] + dx / L * d, a[1] + dy / L * d];
    };
    const p0 = off(pts[0], pts[1], r);
    const pLast = off(pts[n - 1], pts[0], r);
    sh.moveTo(pLast[0], pLast[1]);
    for (let i = 0; i < n; i++) {
      const cur = pts[i];
      const prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
      const a = off(cur, prev, r), b = off(cur, next, r);
      sh.lineTo(a[0], a[1]);
      sh.quadraticCurveTo(cur[0], cur[1], b[0], b[1]);
    }
    return sh;
  }
  // 切角矩形多边形点列(与 chamferOutline 同形)
  function chamferPoints(halfU, halfV, ch, steps) {
    const st = steps || 1;
    const P = [];
    const seg = (a, b) => { for (let i = 0; i <= st; i++) P.push([a[0] + (b[0]-a[0])*i/st, a[1] + (b[1]-a[1])*i/st]); };
    seg([halfU, -halfV + ch], [halfU, halfV - ch]);
    seg([halfU, halfV - ch], [halfU - ch, halfV]);
    seg([halfU - ch, halfV], [-halfU + ch, halfV]);
    seg([-halfU + ch, halfV], [-halfU, halfV - ch]);
    seg([-halfU, halfV - ch], [-halfU, -halfV + ch]);
    seg([-halfU, -halfV + ch], [-halfU + ch, -halfV]);
    seg([-halfU + ch, -halfV], [halfU - ch, -halfV]);
    seg([halfU - ch, -halfV], [halfU, -halfV + ch]);
    return P;
  }

  // 沿 X 挤出的板:正面落在 faceX(朝 +X)
  function plateX(shape, t, bevel, mat, name, faceX, cy, cz, isShell) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: t, bevelEnabled: bevel > 0,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 12
    });
    geo.rotateY(-Math.PI / 2);          // 形状 u → +Z,v → +Y,挤出方向 → −X
    geo.translate(faceX, cy, cz);       // 挤出后 x' ∈ [−t, 0]
    return add(geo, mat, name, 0, 0, 0, isShell);
  }
  // 沿 Z 挤出的板:正面落在 faceZ(朝 +Z)
  function plateZ(shape, t, bevel, mat, name, faceZ, cx, cy, isShell) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: t, bevelEnabled: bevel > 0,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 12
    });
    geo.translate(0, 0, faceZ - t);
    return add(geo, mat, name, cx, cy, 0, isShell);
  }

  function canvasTex(w, h, draw, name) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g2 = c.getContext('2d');
    draw(g2, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.name = name || 'tex';
    return t;
  }

  // ============================================================
  //  1. 屏幕头壳体(切角放样)
  // ============================================================
  const headOutline = chamferOutline(ZH, KH, 1.18, 1.18, 9, 5);
  const headStations = [
    { x: X_LENS,        s: 0.885 },
    { x: X_LENS + 0.16, s: 0.975 },
    { x: X_LENS + 0.46, s: 1.000 },
    { x: 0.55,          s: 1.000 },
    { x: 1.85,          s: 0.996 },
    { x: 2.62,          s: 0.974 },
    { x: 3.02,          s: 0.942 },
    { x: X_BACK,        s: 0.920 },
  ];
  headStations.forEach(st => { st.yc = KC; });
  add(loftX(headStations, headOutline, { closed: true, capStart: true, capEnd: true }),
      matShell, 'head_shell', 0, 0, 0, true);

  // 头部下沿的收口环(藏在头部轮廓内,只露出一圈圆弧过渡)
  add(loftY([
    { y: 0.62, xc: 0.16, dx: 2.10, dz: 2.02, r: 1.06 },
    { y: 0.05, xc: 0.20, dx: 2.12, dz: 1.90, r: 1.04 },
  ], { closed: true, capStart: true, capEnd: true, M: 48 }),
      matShellDk, 'head_collar', 0, 0, 0, true);

  // ============================================================
  //  2. 前脸副面板 + logo 条 + 螺钉
  // ============================================================
  const BEZEL_X = X_BACK + 0.02;
  plateX(polyShapeSoft(chamferPoints(3.14, 5.02, 1.10), 0.20), 0.22, 0.05, matFace,
         'front_bezel', BEZEL_X + 0.22, KC, 0, true);
  const BEZEL_TOP = BEZEL_X + 0.22;

  // logo 条
  plateX(rrShapeSimple(2.36, 0.32, 0.15), 0.07, 0.02, matShellDk,
         'logo_bar', BEZEL_TOP + 0.06, 9.80, 0, true);

  // logo 贴图
  const logoTex = canvasTex(1024, 192, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    c.transform(1, 0, -0.20, 1, 0, 0);
    c.fillStyle = '#eef1f4';
    c.font = '700 116px "Arial Black", Arial, Helvetica, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('HIKVISION', 0, 6);
    c.restore();
  }, 'logo_hikvision');
  const matLogo = new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: 0.5 });
  matLogo.name = 'logo_hikvision';
  {
    const m = add(quadX(2.24, 0.42), matLogo, 'logo_hikvision', BEZEL_TOP + 0.082, 9.80, 0, true);
    m.castShadow = false;
  }
  // 指示点 + 拾音槽
  cylX(0.070, 0.070, 0.05, matLed, 'ind_dot_1', BEZEL_TOP + 0.06, 9.82, -2.16, 14, true);
  cylX(0.070, 0.070, 0.05, matLed, 'ind_dot_2', BEZEL_TOP + 0.06, 9.82, -1.92, 14, true);
  add(new THREE.BoxGeometry(0.06, 0.10, 0.42), matShellDk, 'mic_slot', BEZEL_TOP + 0.04, 9.74, 1.98, true);

  // 四角螺钉
  [[-2.62, 1.55], [2.62, 1.55], [-2.62, 9.30], [2.62, 9.30]].forEach((p, i) => {
    cylX(0.125, 0.125, 0.09, matScrew, 'screw_' + (i + 1), BEZEL_TOP + 0.03, p[1], p[0], 16, true);
    cylX(0.050, 0.050, 0.12, matShellDk, 'screw_slot_' + (i + 1), BEZEL_TOP + 0.04, p[1], p[0], 12, true);
  });

  // ============================================================
  //  3. 屏幕(4.7 × 6.3 cm,3.2" 4:3)
  // ============================================================
  const SCR_CY = 5.62;
  plateX(rrShapeSimple(2.58, 3.42, 0.32), 0.15, 0.04, matFrame,
         'lcd_bezel', BEZEL_TOP + 0.15, SCR_CY, 0, true);
  const SCR_X = BEZEL_TOP + 0.15;

  const lcdTex = canvasTex(512, 640, (c, w, h) => {
    const grd = c.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#3a4048');
    grd.addColorStop(0.45, '#171a1f');
    grd.addColorStop(1, '#20262e');
    c.fillStyle = grd; c.fillRect(0, 0, w, h);
    const g2 = c.createLinearGradient(0, 0, w * 0.85, h * 0.55);
    g2.addColorStop(0, 'rgba(196,212,230,0.22)');
    g2.addColorStop(0.4, 'rgba(130,150,175,0.06)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g2; c.fillRect(0, 0, w, h);
  }, 'lcd_face');
  const matLcd = new THREE.MeshStandardMaterial({ map: lcdTex, roughness: 0.14, metalness: 0.34 });
  matLcd.name = 'lcd_face';
  {
    const m = add(quadX(4.62, 6.20), matLcd, 'lcd_face', SCR_X + 0.016, SCR_CY, 0, true);
    m.castShadow = false;
  }
  {
    const m = add(quadX(4.62, 6.20), matGlass, 'lcd_glass', SCR_X + 0.05, SCR_CY, 0, true);
    m.castShadow = false;
  }

  // ============================================================
  //  4. 键盘(九键)
  // ============================================================
  // 键盘整体缩放并放在 LCD 外框(y=2.20)与前面板下沿(y≈0.43)之间,避免超出界面
  const KS = 0.78;
  const KP_CY = 1.33;
  {
    const sh = new THREE.Shape();
    const tw = 2.80 * KS, bw = 2.24 * KS, hh = 1.00 * KS, r = 0.22 * KS;
    sh.moveTo(-bw + r, -hh);
    sh.lineTo(bw - r, -hh);
    sh.quadraticCurveTo(bw, -hh, bw, -hh + r);
    sh.lineTo(tw, hh - r);
    sh.quadraticCurveTo(tw, hh, tw - r, hh);
    sh.lineTo(-tw + r, hh);
    sh.quadraticCurveTo(-tw, hh, -tw, hh - r);
    sh.lineTo(-bw, -hh + r);
    sh.quadraticCurveTo(-bw, -hh, -bw + r, -hh);
    plateX(sh, 0.10, 0.03, matKeyPanel, 'keypad_panel', BEZEL_TOP + 0.10, KP_CY, 0, true);
  }
  const KP_X = BEZEL_TOP + 0.10;

  // 图标图集(5 列 × 2 行)
  const ICON_COLS = 5, ICON_ROWS = 2;
  const iconTex = canvasTex(ICON_COLS * 256, ICON_ROWS * 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const CW = 256, CH = 256;
    const cell = (i, j) => [i * CW, j * CH];
    const ink = '#e2e6ea';
    c.strokeStyle = ink; c.fillStyle = ink;
    c.lineWidth = 15; c.lineCap = 'round'; c.lineJoin = 'round';

    let [x, y] = cell(0, 0);
    c.save(); c.translate(x + CW / 2, y + CH / 2);
    c.beginPath(); c.arc(0, 8, 60, Math.PI * 0.75, Math.PI * 2.25, false); c.stroke();
    c.beginPath(); c.moveTo(0, -74); c.lineTo(0, 8); c.stroke(); c.restore();

    [x, y] = cell(1, 0);
    c.save(); c.translate(x + CW / 2, y + CH / 2);
    c.beginPath(); c.moveTo(-36, -60); c.lineTo(36, -60); c.lineTo(36, 66); c.lineTo(0, 32); c.lineTo(-36, 66);
    c.closePath(); c.stroke(); c.restore();

    [x, y] = cell(2, 0);
    c.save(); c.translate(x + CW / 2, y + CH / 2);
    c.beginPath(); c.arc(0, 0, 56, Math.PI * 0.30, Math.PI * 1.70, false); c.stroke();
    c.beginPath(); c.moveTo(44, -56); c.lineTo(66, -18); c.lineTo(20, -14); c.closePath(); c.fill(); c.restore();

    [x, y] = cell(3, 0);
    c.save(); c.translate(x + CW / 2, y + CH / 2);
    c.beginPath(); c.moveTo(50, 8); c.lineTo(-40, 8); c.stroke();
    c.beginPath(); c.moveTo(-14, -30); c.lineTo(-56, 8); c.lineTo(-14, 46); c.stroke(); c.restore();

    [x, y] = cell(4, 0);
    c.save(); c.translate(x + CW / 2, y + CH / 2);
    c.font = '700 92px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('OK', 0, 0); c.restore();

    const tri = (i, j, ang) => {
      const [cx, cy] = cell(i, j);
      c.save(); c.translate(cx + CW / 2, cy + CH / 2); c.rotate(ang);
      c.beginPath(); c.moveTo(0, -58); c.lineTo(54, 42); c.lineTo(-54, 42); c.closePath(); c.fill(); c.restore();
    };
    tri(0, 1, 0); tri(1, 1, Math.PI); tri(2, 1, -Math.PI / 2); tri(3, 1, Math.PI / 2);
  }, 'keypad_icons');
  const matIcon = new THREE.MeshStandardMaterial({ map: iconTex, transparent: true, roughness: 0.55 });
  matIcon.name = 'keypad_icons';
  const CELL = (i, j) => [i / ICON_COLS, 1 - (j + 1) / ICON_ROWS, 1 / ICON_COLS, 1 / ICON_ROWS];

  function keyButton(z, y, w, h, r, cell, name, lift) {
    lift = lift === undefined ? 0.15 : lift;
    z *= KS; y *= KS; w *= KS; h *= KS; r *= KS;
    plateX(rrShapeSimple(w / 2 - 0.025, h / 2 - 0.025, r), lift, 0.032, matButton,
           name + '_base', KP_X + lift, KP_CY + y, z, true);
    plateX(rrShapeSimple(w / 2 - 0.065, h / 2 - 0.065, r * 0.9), 0.05, 0.02, matButtonHi,
           name + '_top', KP_X + lift + 0.05, KP_CY + y, z, true);
    if (cell) {
      const sz = Math.min(w, h) * 0.60;
      const m = add(quadX(sz, sz, cell), matIcon, name + '_icon',
                    KP_X + lift + 0.075, KP_CY + y, z, true);
      m.castShadow = false;
    }
  }
  // 中央五向键 + 四周功能键
  // 五向键与四角功能键严格对称(左右 z=±,上下 y=±,两侧列行高一致)
  keyButton(0.00, 0.00, 0.92, 0.82, 0.17, CELL(4, 0), 'key_ok', 0.18);
  keyButton(0.00, 0.58, 0.86, 0.36, 0.12, CELL(0, 1), 'key_up');
  keyButton(0.00, -0.58, 0.86, 0.36, 0.12, CELL(1, 1), 'key_down');
  keyButton(-0.76, 0.00, 0.36, 0.72, 0.12, CELL(2, 1), 'key_left');
  keyButton(0.76, 0.00, 0.36, 0.72, 0.12, CELL(3, 1), 'key_right');
  keyButton(-1.88, 0.46, 0.56, 0.44, 0.12, CELL(0, 0), 'key_power', 0.14);
  keyButton(-1.88, -0.38, 0.56, 0.44, 0.12, CELL(1, 0), 'key_bookmark', 0.14);
  keyButton(1.88, 0.46, 0.56, 0.44, 0.12, CELL(2, 0), 'key_cycle', 0.14);
  keyButton(1.88, -0.38, 0.56, 0.44, 0.12, CELL(3, 0), 'key_back', 0.14);

  // ============================================================
  //  5. 侧脸内嵌面板 + 丝印
  // ============================================================
  const sideTextTex = canvasTex(768, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#cdd2d8';
    c.textAlign = 'center';
    c.font = '600 62px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
    c.fillText('手持测温热像仪', w / 2, h * 0.46);
    c.font = '600 46px Arial, Helvetica, sans-serif';
    c.fillText('2M DROP  IP54', w / 2, h * 0.64);
  }, 'side_nameplate');
  const matSideText = new THREE.MeshStandardMaterial({ map: sideTextTex, transparent: true, roughness: 0.6 });
  matSideText.name = 'side_nameplate';

  // 侧板中心对齐头部中心(X=0,Y=KC),不再偏向镜头侧或偏下
  const SIDE_CX = 0, SIDE_CY = KC;
  [1, -1].forEach(sg => {
    const tag = sg > 0 ? 'R' : 'L';
    // 暗色凹槽(形成清晰的内嵌轮廓)
    plateZ(rrShapeSimple(2.34, 2.34, 0.66), 0.06, 0.02, matShellDk,
           'side_groove_' + tag, sg * (ZH + 0.085), SIDE_CX, SIDE_CY, true);
    // 面板外圈
    plateZ(rrShapeSimple(2.16, 2.16, 0.62), 0.16, 0.05, matShell,
           'side_panel_rim_' + tag, sg * (ZH + 0.105), SIDE_CX, SIDE_CY, true);
    // 内凹面
    plateZ(rrShapeSimple(1.94, 1.94, 0.56), 0.10, 0.03, matPanelIn,
           'side_panel_inner_' + tag, sg * (ZH + 0.055), SIDE_CX, SIDE_CY, true);
  });
  {
    // 右侧 HIKVISION 丝印(贴在+Z 侧板内凹面上,相对侧板中心偏移不变)
    const m = add(quadZ(1.84, 0.34, 1), matLogo, 'side_logo_R', SIDE_CX, SIDE_CY - 1.40, ZH + 0.062, true);
    m.castShadow = false;
    // 左侧型号铭牌(贴在 −Z 侧板内凹面上)
    const m2 = add(quadZ(1.66, 1.10, -1), matSideText, 'side_nameplate_L', SIDE_CX, SIDE_CY + 0.15, -(ZH + 0.062), true);
    m2.castShadow = false;

  }

  // ============================================================
  //  6. 顶部腕带弓形环
  // ============================================================
  {
    const sh = new THREE.Shape();
    const H = 0.95, W = 1.48, R = 0.40, T = 0.30;
    sh.moveTo(-W, 0);
    sh.lineTo(-W, H - R);
    sh.quadraticCurveTo(-W, H, -W + R, H);
    sh.lineTo(W - R, H);
    sh.quadraticCurveTo(W, H, W, H - R);
    sh.lineTo(W, 0);
    sh.lineTo(W - T, 0);
    sh.lineTo(W - T, H - T - R);
    sh.quadraticCurveTo(W - T, H - T, W - T - R, H - T);
    sh.lineTo(-W + T + R, H - T);
    sh.quadraticCurveTo(-W + T, H - T, -W + T, H - T - R);
    sh.lineTo(-W + T, 0);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth: 2.30, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 10
    });
    geo.rotateY(Math.PI / 2);
    // 弓形环居中:X 方向 ∈[-1.15,1.15](厚度 2.30),Z 方向 ∈[-1.48,1.48](跨度 2.96)
    geo.translate(-1.15, Y_TOP - 0.52, 0);
    add(geo, matShell, 'strap_loop', 0, 0, 0, true);
    // 环内横梁(与环同心)
    const bar = new THREE.CylinderGeometry(0.085, 0.085, 2.30, 16);
    bar.rotateX(Math.PI / 2);
    add(bar, matMetalDk, 'strap_bar', 0, Y_TOP + 0.30, 0, true);
  }

  // ============================================================
  //  7. 前面红外镜头组(朝 −X)
  // ============================================================
  const LENS_CY = 5.62, LENS_CZ = 0.0;
  {
    const f = X_LENS;
    // 底座凸台
    cylX(2.30, 2.42, 0.46, matShellDk, 'lens_boss', f - 0.22, LENS_CY, LENS_CZ, 56, true);
    // 遮光罩阶梯(空心管,不能有端盖,否则会挡住镜片)
    cylXOpen(2.10, 2.20, 0.36, matMetalDk, 'lens_hood', f - 0.60, LENS_CY, LENS_CZ, 56, true);
    cylXOpen(1.88, 2.02, 0.26, matShellDk, 'lens_hood_in', f - 0.82, LENS_CY, LENS_CZ, 56, true);
    // 内筒(空心)
    cylXOpen(1.66, 1.68, 0.62, matMetalDk, 'lens_barrel', f - 1.02, LENS_CY, LENS_CZ, 56, true);
    // 筒底(深色吸光面)
    cylX(1.68, 1.68, 0.08, matScrew, 'lens_wall_back', f - 0.80, LENS_CY, LENS_CZ, 48, true);
    // 口沿倒角环
    {
      const tg2 = new THREE.TorusGeometry(2.13, 0.055, 10, 56);
      tg2.rotateY(Math.PI / 2);
      add(tg2, matMetalDk, 'lens_lip', f - 0.74, LENS_CY, LENS_CZ, true);
    }
    // 镜片(锗窗口)
    const lensTex = canvasTex(512, 512, (c, w, h) => {
      const g2 = c.createRadialGradient(w * 0.46, h * 0.34, w * 0.01, w * 0.5, h * 0.5, w * 0.56);
      g2.addColorStop(0, '#8d7aae');
      g2.addColorStop(0.24, '#41305c');
      g2.addColorStop(0.58, '#221a32');
      g2.addColorStop(1, '#100c18');
      c.fillStyle = g2; c.fillRect(0, 0, w, h);
      const g3 = c.createRadialGradient(w * 0.36, h * 0.28, 2, w * 0.36, h * 0.28, w * 0.30);
      g3.addColorStop(0, 'rgba(244,238,255,0.85)');
      g3.addColorStop(1, 'rgba(236,226,255,0)');
      c.fillStyle = g3; c.fillRect(0, 0, w, h);
    }, 'lens_ge_window');
    const matLens = new THREE.MeshBasicMaterial({ map: lensTex });
    matLens.name = 'lens_ge_window';
    const lensGeo = new THREE.CircleGeometry(1.62, 64);
    lensGeo.rotateY(-Math.PI / 2);
    const lm = add(lensGeo, matLens, 'lens_ge', f - 1.12, LENS_CY, LENS_CZ, true);
    lm.castShadow = false;
    // 镜片外金属护圈
    {
      const tg = new THREE.TorusGeometry(1.66, 0.075, 12, 56);
      tg.rotateY(Math.PI / 2);
      add(tg, matSilver, 'lens_ring', f - 1.12, LENS_CY, LENS_CZ, true);
    }

    // 可见光摄像头(-Z 侧上方)
    cylX(0.34, 0.38, 0.30, matShellDk, 'viscam_boss', f - 0.14, LENS_CY + 3.05, -2.05, 32, true);
    cylX(0.22, 0.22, 0.16, matMetalDk, 'viscam_ring', f - 0.30, LENS_CY + 3.05, -2.05, 32, true);
    const visGeo = new THREE.CircleGeometry(0.19, 32);
    visGeo.rotateY(-Math.PI / 2);
    add(visGeo, matScrew, 'viscam_lens', f - 0.37, LENS_CY + 3.05, -2.05, true);
    // 激光指示窗(+Z 侧上方)
    cylX(0.19, 0.22, 0.22, matScrew, 'laser_window', f - 0.12, LENS_CY + 3.05, 2.05, 28, true);
    // 前指示灯
    cylX(0.12, 0.12, 0.09, matLed, 'front_led', f - 0.06, LENS_CY - 2.95, 2.30, 20, true);
    // 三脚架螺孔(头底)
    cylZ(0.55, 0.55, 0.10, matSilver, 'tripod_boss', 1.55, Y_HEAD_BOT + 0.03, 0, 32, true);
    cylZ(0.36, 0.36, 0.22, matScrew, 'tripod_thread', 1.55, Y_HEAD_BOT - 0.02, 0, 24, true);
  }

  // ============================================================
  //  8. 握把(渐变截面 + 后倾)
  // ============================================================
  const gripStations = [
    { y: 0.72, xc: 0.24, dx: 2.04, dz: 1.86, r: 1.02 },
    { y: -1.60, xc: 0.44, dx: 2.01, dz: 1.72, r: 1.01 },
    { y: -3.40, xc: 0.64, dx: 1.97, dz: 1.63, r: 0.97 },
    { y: -5.20, xc: 0.85, dx: 1.94, dz: 1.55, r: 0.93 },
    { y: -6.90, xc: 1.03, dx: 1.91, dz: 1.47, r: 0.89 },
    { y: Y_CAP_TOP, xc: 1.14, dx: 1.89, dz: 1.42, r: 0.86 },
  ];
  add(loftY(gripStations, { closed: true, capStart: true, capEnd: true, M: 48 }),
      matShell, 'grip_body', 0, 0, 0, true);

  // ---- 背面棱纹橡胶垫(参考图握把正面朝向观察者的一侧) ----
  {
    const RIB_N = 8, RIB_TOP = -1.10, RIB_STEP = 0.78;
    for (let k = 0; k < RIB_N; k++) {
      const yc = RIB_TOP - k * RIB_STEP;
      // 按站位插值出该高度的截面参数
      let t = (0.72 - yc) / (0.72 - Y_CAP_TOP);
      t = Math.max(0, Math.min(1, t));
      const xc = 0.24 + t * (1.14 - 0.24);
      const dx = 2.04 + t * (1.89 - 2.04);
      const dz = 1.80 + t * (1.42 - 1.80);
      const r = 1.02 + t * (0.86 - 1.02);
      const xBack = xc + dx;
      const flat = dz - r;
      const LIFT = 0.055;
      const rings = [];
      [-0.05, 0.05, 0.05].forEach((dy, ri) => {
        const prof = [];
        const N = 22;
        for (let i = 0; i <= N; i++) {
          const u = -1 + 2 * i / N;
          const z = u * (dz * 0.62);
          const az = Math.abs(z);
          const fil = az <= flat ? 0 : (r - Math.sqrt(Math.max(0, r * r - Math.pow(az - flat, 2))));
          const lift = (ri === 1) ? LIFT : 0.012;
          prof.push([xBack - fil + lift, yc + (ri === 2 ? 0.05 : -0.05), z]);
        }
        rings.push(prof);
      });
      const geo = stitch(rings, { closed: false });
      orientAway(geo, 0);
      geo.computeVertexNormals();
      add(geo, matRubber, 'grip_rib_' + (k + 1), 0, 0, 0, true);
    }
    // 橡胶垫上的圆点(握把背面靠上)
    cylX(0.16, 0.16, 0.07, matRubber, 'grip_pad_dot', 2.44, -0.52, 0, 20, true);
    cylX(0.085, 0.085, 0.10, matShellDk, 'grip_pad_dot_in', 2.47, -0.52, 0, 16, true);
  }

  // 握把两侧装饰凹槽
  [1, -1].forEach(sg => {
    add(new THREE.BoxGeometry(2.4, 0.09, 0.05), matShellDk,
        'grip_groove_' + (sg > 0 ? 'R' : 'L'), 0.72, -4.30, sg * 1.46, true);
  });

  // ============================================================
  //  9. 扳机(红色,握把前方 −X 侧,顶部塞在头部下沿)
  // ============================================================
  {
    const sh = new THREE.Shape();
    sh.moveTo(-1.05, -0.16);
    sh.bezierCurveTo(-1.62, -0.40, -2.06, -0.92, -2.22, -1.60);
    sh.bezierCurveTo(-2.36, -2.26, -2.22, -2.78, -1.86, -3.02);
    sh.lineTo(-1.44, -3.10);
    sh.bezierCurveTo(-1.36, -2.36, -1.26, -1.60, -1.20, -0.90);
    sh.lineTo(-1.05, -0.16);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth: 0.96, bevelEnabled: true, bevelThickness: 0.10, bevelSize: 0.10, bevelSegments: 3, curveSegments: 20
    });
    geo.translate(0, 0, -0.48);
    add(geo, matRed, 'trigger', 0, 0, 0, true);
    // 内侧暗红衬
    const geo2 = new THREE.ExtrudeGeometry(sh, { depth: 0.30, bevelEnabled: false, curveSegments: 16 });
    geo2.scale(0.84, 0.84, 1);
    geo2.translate(-0.34, -0.48, -0.15);
    add(geo2, matRedDk, 'trigger_back', 0, 0, 0, true);
  }

  // ============================================================
  //  10. 电池仓(银色分界环 + 电芯盖 + 卡扣 + Type-C)
  // ============================================================
  {
    // 银色分界环
    add(loftY([
      { y: Y_CAP_TOP + 0.14, xc: 1.13, dx: 1.915, dz: 1.448, r: 0.86 },
      { y: Y_CAP_TOP - 0.14, xc: 1.17, dx: 1.915, dz: 1.448, r: 0.86 },
    ], { closed: true, capStart: true, capEnd: true, M: 48 }),
        matSilver, 'battery_ring', 0, 0, 0, true);

    // 电芯盖
    add(loftY([
      { y: Y_CAP_TOP - 0.14, xc: 1.17, dx: 1.885, dz: 1.420, r: 0.85 },
      { y: -9.30, xc: 1.22, dx: 1.860, dz: 1.395, r: 0.83 },
      { y: -10.55, xc: 1.26, dx: 1.830, dz: 1.365, r: 0.81 },
      { y: Y_BOT + 0.24, xc: 1.28, dx: 1.790, dz: 1.330, r: 0.78 },
      { y: Y_BOT, xc: 1.29, dx: 1.640, dz: 1.220, r: 0.70 },
    ], { closed: true, capStart: true, capEnd: true, M: 48 }),
        matShell, 'battery_cap', 0, 0, 0, true);

    // 卡扣按钮(背面)
    plateX(rrShapeSimple(0.34, 0.40, 0.10), 0.10, 0.03, matShellDk,
           'battery_latch', 1.29 + 1.80, -9.85, -0.55, true);
    // 挂绳孔
    cylZ(0.10, 0.10, 0.18, matShellDk, 'lanyard_hole', 1.22, -9.05, 1.34, 14, true);
    // Type-C 充电口(电池盖前侧面 x≈−0.60)
    {
      const portBack = new THREE.BoxGeometry(0.16, 0.30, 0.74);
      add(portBack, matScrew, 'typec_port', -0.54, -9.30, 0, true);
      const tongue = new THREE.BoxGeometry(0.08, 0.10, 0.56);
      add(tongue, matSilver, 'typec_tongue', -0.58, -9.30, 0, true);
      const shell = new THREE.BoxGeometry(0.10, 0.42, 0.86);
      add(shell, matShellDk, 'typec_shell', -0.50, -9.30, 0, true);
    }
  }

  // ============================================================
  //  11. 内部结构(「查看内部」时可见)
  // ============================================================
  {
    // 主控板
    add(new THREE.BoxGeometry(0.16, 7.4, 5.6), matPcb, 'inner_main_pcb', 1.90, 5.6, 0, false);
    add(new THREE.BoxGeometry(0.14, 1.6, 1.8), matChip, 'inner_soc', 1.75, 6.4, -1.0, false);
    add(new THREE.BoxGeometry(0.14, 1.1, 1.4), matChip, 'inner_shield', 1.75, 4.4, 1.6, false);
    // 探测器(镜头正后方)
    add(new THREE.BoxGeometry(1.5, 3.4, 3.4), matChip, 'inner_detector', X_LENS + 1.55, LENS_CY, 0, false);
    cylX(1.40, 1.40, 1.0, matMetalDk, 'inner_lens_tube', X_LENS + 0.72, LENS_CY, 0, 32, false);
    // 电芯(两节,完全收在握把内)
    for (let i = 0; i < 2; i++) {
      const b = new THREE.CylinderGeometry(0.60, 0.60, 3.1, 20);
      b.rotateZ(Math.PI / 2);
      add(b, matBatWrap, 'inner_cell_' + (i + 1), 0.95, -5.20, -0.62 + i * 1.24, false);
    }
    add(new THREE.BoxGeometry(1.5, 1.0, 3.0), matBat, 'inner_battery_pcb', 0.85, -2.30, 0, false);
    // 排线(从主板下沿走到电池组)
    const wire = new THREE.CylinderGeometry(0.065, 0.065, 4.2, 10);
    add(wire, matWire, 'inner_cable_1', 1.50, 1.5, -0.9, false);
    const wire2 = new THREE.CylinderGeometry(0.065, 0.065, 4.2, 10);
    add(wire2, matWire, 'inner_cable_2', 1.50, 1.5, 0.9, false);
    // 屏幕背光模块
    add(new THREE.BoxGeometry(0.30, 5.6, 4.2), matChip, 'inner_lcd_module', 2.85, 5.9, 0, false);
    // 握把内骨架
    add(new THREE.BoxGeometry(0.30, 6.4, 1.6), matChip, 'inner_grip_frame', 0.95, -4.6, 0, false);
  }

  group.userData.shells = shells;
  return group;
}
