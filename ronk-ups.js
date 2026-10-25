// ronk-ups.js — RONK 新H型系列工频/高频在线式 UPS 机柜
// 单位:厘米(cm)。外形 34(宽 Z) × 72(深 X) × 85.5(高 Y)。
// 朝向:前面板朝 +X,侧面 ±Z,后面板 −X。
// 外观按用户提供的正/背面实拍图细化;内部三层:上/中层各 4 只 12V 蓄电池,下层电脑主机。
// 涂装:工业碳素黑 RAL 9005 亚光。THREE 作为参数传入,便于单文件内联。
function buildRonkUPS(THREE) {
  const group = new THREE.Group();
  group.name = 'ronk_ups';

  // ---------- 材质 ----------
  const matShell = new THREE.MeshStandardMaterial({ color: 0x33383e, roughness: 0.56, metalness: 0.24, emissive: 0x161a1f, emissiveIntensity: 1 });
  matShell.name = 'shell_ral9005';
  const matPanel = new THREE.MeshStandardMaterial({ color: 0x363b41, roughness: 0.54, metalness: 0.24, emissive: 0x161a1f, emissiveIntensity: 1 });
  matPanel.name = 'front_panel';
  const matGroove = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.62, metalness: 0.2, emissive: 0x0c0e11, emissiveIntensity: 1 });
  matGroove.name = 'top_band';
  const matGrille = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.78 });
  matGrille.name = 'vent_dark';
  const matFilter = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.95 });
  matFilter.name = 'dust_filter';
  const matScrew = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.5, metalness: 0.5 });
  matScrew.name = 'hex_screw';
  const matBezel = new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.5 });
  matBezel.name = 'lcd_bezel';
  const matButton = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.32, metalness: 0.85 });
  matButton.name = 'button_metal';
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x8a8f94, roughness: 0.42, metalness: 0.7 });
  matMetal.name = 'metal_hw';
  const matFanDark = new THREE.MeshStandardMaterial({ color: 0x1b1e21, roughness: 0.6, metalness: 0.3 });
  matFanDark.name = 'fan_guard';
  const matBreaker = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.55 });
  matBreaker.name = 'breaker_white';
  const matToggle = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5 });
  matToggle.name = 'breaker_toggle';
  const matBlue = new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.42 });
  matBlue.name = 'breaker_blue';
  const matGreen = new THREE.MeshStandardMaterial({ color: 0x2f7a46, roughness: 0.5 });
  matGreen.name = 'terminal_green';
  const matTermBase = new THREE.MeshStandardMaterial({ color: 0x24272a, roughness: 0.6 });
  matTermBase.name = 'terminal_base';
  const matBrass = new THREE.MeshStandardMaterial({ color: 0xb08d5a, roughness: 0.35, metalness: 0.85 });
  matBrass.name = 'terminal_brass';
  const matFoot = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.9 });
  matFoot.name = 'foot_rubber';
  const matHatch = new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.66, metalness: 0.18, emissive: 0x101318, emissiveIntensity: 1 });
  matHatch.name = 'service_hatch';
  const matHandle = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.55, metalness: 0.3, emissive: 0x12151a, emissiveIntensity: 1 });
  matHandle.name = 'handle_dark';
  const matBattery = new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.55 });
  matBattery.name = 'battery_case';
  const matBatTop = new THREE.MeshStandardMaterial({ color: 0x2c3034, roughness: 0.6 });
  matBatTop.name = 'battery_top';
  const matPos = new THREE.MeshStandardMaterial({ color: 0xa83232, roughness: 0.45 });
  matPos.name = 'terminal_pos';
  const matNeg = new THREE.MeshStandardMaterial({ color: 0x222528, roughness: 0.45 });
  matNeg.name = 'terminal_neg';
  const matBatLabel = new THREE.MeshStandardMaterial({ color: 0x8a8f94, roughness: 0.8 });
  matBatLabel.name = 'battery_label';
  const matShelf = new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.45, metalness: 0.7 });
  matShelf.name = 'shelf_steel';
  const matPC = new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.5, metalness: 0.35 });
  matPC.name = 'pc_case';
  const matPCFront = new THREE.MeshStandardMaterial({ color: 0x1c1f23, roughness: 0.55, metalness: 0.3 });
  matPCFront.name = 'pc_front';
  const matPwr = new THREE.MeshStandardMaterial({ color: 0x3a6ea5, roughness: 0.4, emissive: 0x1c3c66, emissiveIntensity: 0.6 });
  matPwr.name = 'pc_power_led';
  const matUSB = new THREE.MeshStandardMaterial({ color: 0x0c0e10, roughness: 0.6 });
  matUSB.name = 'pc_usb';
  // 状态 LED(自发光)
  const ledMat = (name, c, e) => {
    const m = new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: 0.85, roughness: 0.35 });
    m.name = name; return m;
  };
  const matLedG = ledMat('led_green', 0x3fae5c, 0x2f8f46);
  const matLedA = ledMat('led_amber', 0xd8a13c, 0xb07f24);
  const matLedR = ledMat('led_red', 0xc84848, 0xa02f2f);
  const matLedW = ledMat('led_white', 0xd8dce0, 0x9aa0a6);

  // ---------- 贴图 ----------
  function makeCanvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  // LCD(偏暗的蓝灰屏)
  const texLCD = makeCanvasTex(256, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#9db4c9'); grad.addColorStop(0.5, '#7290ab'); grad.addColorStop(1, '#5a768f');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,60,80,0.30)';
    for (let i = 0; i < 3; i++) g.fillRect(30, 32 + i * 28, 110 + (i % 2) * 55, 10);
    g.fillStyle = 'rgba(40,60,80,0.20)';
    g.fillRect(170, 32, 56, 66);
  });
  const matLCD = new THREE.MeshStandardMaterial({ map: texLCD, roughness: 0.22, metalness: 0.1 });
  matLCD.name = 'lcd_screen';
  // RONK logo
  const texLogo = makeCanvasTex(512, 160, (g) => {
    g.clearRect(0, 0, 512, 160);
    g.fillStyle = '#d8dade';
    g.font = 'bold italic 120px Arial, Helvetica, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    try { g.letterSpacing = '10px'; } catch (_) {}
    g.fillText('RONK', 256, 86);
  });
  const matLogo = new THREE.MeshStandardMaterial({ map: texLogo, transparent: true, roughness: 0.55, depthWrite: false });
  matLogo.name = 'logo_ronk';
  // 前面冲孔网栅(圆孔阵列,圆角遮罩)
  const texPerf = makeCanvasTex(520, 560, (g, w, h) => {
    g.fillStyle = '#2c3137'; g.fillRect(0, 0, w, h);
    // 孔阵
    const pitch = 16.8, r = 5.0;
    for (let y = pitch / 2; y < h; y += pitch) {
      for (let x = pitch / 2; x < w; x += pitch) {
        g.fillStyle = '#060708';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(x, y + 1.0, r, Math.PI * 0.72, Math.PI * 1.88); g.stroke();
      }
    }
    // 圆角遮罩外透明
    g.globalCompositeOperation = 'destination-in';
    const rr = 40;
    g.beginPath();
    g.moveTo(rr, 0); g.lineTo(w - rr, 0); g.quadraticCurveTo(w, 0, w, rr);
    g.lineTo(w, h - rr); g.quadraticCurveTo(w, h, w - rr, h);
    g.lineTo(rr, h); g.quadraticCurveTo(0, h, 0, h - rr);
    g.lineTo(0, rr); g.quadraticCurveTo(0, 0, rr, 0);
    g.fill();
    g.globalCompositeOperation = 'source-over';
  });
  const matPerf = new THREE.MeshStandardMaterial({ map: texPerf, transparent: true, roughness: 0.75, metalness: 0.12, emissive: 0x0b0d10, emissiveIntensity: 1 });
  matPerf.name = 'front_perforated';
  // 铭牌(白字深底)
  const makeNamePlate = (text, name) => {
    const t = makeCanvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#101214'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#3a3f44'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#e6e8ea';
      g.font = 'bold 52px Arial, Helvetica, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + 2);
    });
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
    m.name = name;
    return m;
  };
  const matLbl232 = makeNamePlate('RS232', 'label_rs232');
  const matLbl485 = makeNamePlate('RS485', 'label_rs485');
  // 中文铭牌(输入/输出/维修开关)
  const makeCnPlate = (text, name) => {
    const t = makeCanvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#0e1012'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#c9ccd0'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#e8eaec';
      g.font = 'bold 46px "Noto Sans CJK SC", "WenQuanYi Micro Hei", "Microsoft YaHei", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + 2);
    });
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
    m.name = name;
    return m;
  };
  const matLblIn = makeCnPlate('输入', 'label_input');
  const matLblOut = makeCnPlate('输出', 'label_output');
  const matLblMaint = makeCnPlate('维修开关', 'label_maintain');
  // 绿色端子排号码表(1..12 + L1 L2 L3 N ×2)
  const matTermLbl = (() => {
    const t = makeCanvasTex(768, 200, (g, w, h) => {
      g.fillStyle = '#d8dadc'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#111'; g.font = 'bold 52px Arial, Helvetica, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const cw = w / 12;
      for (let i = 0; i < 12; i++) {
        g.fillText(String(i + 1), cw * (i + 0.5), h * 0.27);
        g.strokeStyle = '#555'; g.lineWidth = 3;
        g.strokeRect(cw * i + 2, 6, cw - 4, h * 0.44);
      }
      const ph = ['L1', 'L2', 'L3', 'N', 'L1', 'L2', 'L3', 'N'];
      const pw = w / 8;
      for (let i = 0; i < 8; i++) {
        g.fillText(ph[i], pw * (i + 0.5), h * 0.75);
        g.strokeRect(pw * i + 2, h * 0.52, pw - 4, h * 0.46);
      }
    });
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.65 });
    m.name = 'terminal_label';
    return m;
  })();

  // ---------- helpers ----------
  const shell = new THREE.Group();
  shell.name = 'shell';
  const interior = new THREE.Group();
  interior.name = 'interior';
  group.add(shell, interior);

  const box = (w, h, d, mat, x, y, z, parent, shellFlag) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    if (shellFlag) m.userData.shell = true;
    (parent || (shellFlag ? shell : interior)).add(m);
    return m;
  };
  const cylX = (r, h, mat, x, y, z, parent, shellFlag) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), mat);
    m.rotation.z = Math.PI / 2;
    m.position.set(x, y, z);
    m.castShadow = true;
    if (shellFlag) m.userData.shell = true;
    (parent || (shellFlag ? shell : interior)).add(m);
    return m;
  };
  const planeYZ = (w, h, mat, x, y, z, parent, shellFlag) => { // 面朝 +X
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.y = Math.PI / 2;
    m.position.set(x, y, z);
    if (shellFlag) m.userData.shell = true;
    (parent || (shellFlag ? shell : interior)).add(m);
    return m;
  };
  const planeZY = (w, h, mat, x, y, z) => { // 面朝 −X(后面板贴图)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.y = -Math.PI / 2;
    m.position.set(x, y, z);
    m.userData.shell = true;
    shell.add(m);
    return m;
  };

  // ============================================================
  //  外壳:六块钣金面板
  // ============================================================
  box(1.2, 85.5, 31.6, matShell, 35.4, 42.75, 0, shell, true);   // 前面板
  box(1.2, 85.5, 31.6, matShell, -35.4, 42.75, 0, shell, true);  // 后面板
  box(72, 85.5, 1.2, matShell, 0, 42.75, 16.4, shell, true);     // 右侧板
  box(72, 85.5, 1.2, matShell, 0, 42.75, -16.4, shell, true);    // 左侧板
  box(70.8, 1.2, 34, matShell, 0, 84.9, 0, shell, true);         // 顶盖
  box(70.8, 1.2, 34, matShell, 0, 0.6, 0, shell, true);          // 底板

  // 四角圆弧包边(竖向圆角压条)
  [[35.7, 16.55], [35.7, -16.55], [-35.7, 16.55], [-35.7, -16.55]].forEach(([x, z]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 83.2, 20), matShell);
    b.position.set(x, 42.75, z);
    b.castShadow = true;
    b.userData.shell = true;
    shell.add(b);
  });

  // 顶部加强筋带:3 道环绕凸筋 + 中缝
  [81.2, 82.5, 83.8].forEach(y => {
    box(0.5, 0.85, 34.6, matGroove, 36.15, y, 0, shell, true);    // 前
    box(0.5, 0.85, 34.6, matGroove, -36.15, y, 0, shell, true);   // 后
    box(72.6, 0.85, 0.5, matGroove, 0, y, 17.15, shell, true);    // 右
    box(72.6, 0.85, 0.5, matGroove, 0, y, -17.15, shell, true);   // 左
  });
  box(0.7, 3.6, 0.55, matGrille, 36.3, 82.7, 0, shell, true);     // 前中缝
  box(0.7, 3.6, 0.55, matGrille, -36.3, 82.7, 0, shell, true);    // 后中缝

  // 底部 4 只可调防滑地脚(φ44,圆鼓底)
  [[-28, -10.7], [-28, 10.7], [28, -10.7], [28, 10.7]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 1.95, 4.2, 26), matFoot);
    post.position.set(x, -2.1, z);
    post.castShadow = true;
    interior.add(post);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.95, 26, 14), matFoot);
    dome.position.set(x, -4.2, z);
    dome.scale.y = 0.55;
    interior.add(dome);
  });

  // ============================================================
  //  前面板(朝 +X)—— 按实拍图
  // ============================================================
  // RONK logo(左上)
  planeYZ(7.2, 2.0, matLogo, 36.08, 76.8, 9.8, shell, true);

  // 控制面板(26.2 × 18.2,圆角底,带凹槽边框)
  {
    const pw = 13.1, pT = 9.1, rt = 1.6, rb = 5.2;
    const s = new THREE.Shape();
    s.moveTo(-pw + rt, pT);
    s.lineTo(pw - rt, pT);
    s.quadraticCurveTo(pw, pT, pw, pT - rt);
    s.lineTo(pw, -pT + rb);
    s.quadraticCurveTo(pw, -pT, pw - rb, -pT);
    s.lineTo(-pw + rb, -pT);
    s.quadraticCurveTo(-pw, -pT, -pw, -pT + rb);
    s.lineTo(-pw, pT - rt);
    s.quadraticCurveTo(-pw, pT, -pw + rt, pT);
    const border = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: false }), matGrille);
    border.rotation.y = Math.PI / 2;
    border.position.set(35.42, 64.6, -0.2);
    border.userData.shell = true;
    shell.add(border);
    const p = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.75, bevelEnabled: false }), matPanel);
    p.rotation.y = Math.PI / 2;
    p.position.set(35.62, 64.6, -0.2);
    p.castShadow = true;
    p.userData.shell = true;
    shell.add(p);
  }

  // LCD(中偏左)
  box(0.5, 6.6, 10.8, matBezel, 36.5, 68.2, 1.2, shell, true);
  planeYZ(9.8, 5.5, matLCD, 36.79, 68.2, 1.2, shell, true);

  // 3 只金属按钮(竖排,右侧)+ 各自绿色指示灯
  [68.1, 63.7, 59.3].forEach((y, i) => {
    cylX(1.52, 0.14, matPanel, 36.48, y, -8.35, shell, true);   // 沉孔圈
    cylX(1.35, 0.55, matButton, 36.62, y, -8.35, shell, true);  // 钮帽
    cylX(0.26, 0.2, matLedG, 36.56, y + 1.8, -6.6, shell, true); // 绿 LED
  });

  // 状态 LED 一行 6 点(绿×4 红 绿)
  [matLedG, matLedG, matLedG, matLedG, matLedR, matLedG].forEach((m, i) =>
    cylX(0.3, 0.22, m, 36.56, 60.8, 6.6 - i * 2.18, shell, true));

  // 铭牌槽线(左 4 右 4)
  [69.9, 66.9, 64.1, 61.3].forEach(y => {
    box(0.16, 0.5, 2.9, matGrille, 36.5, y, 9.2, shell, true);
    box(0.16, 0.5, 2.9, matGrille, 36.5, y, -8.8, shell, true);
  });

  // 大面积冲孔进风网栅(26.9 × 29,圆孔阵)+ 防尘过滤网
  box(0.12, 30, 27.8, matFilter, 35.9, 18.5, -0.5, shell, true);
  planeYZ(26.9, 29, matPerf, 36.08, 18.5, -0.5, shell, true);

  // 前面板沉头螺栓
  [[82, -14.8], [82, 14.8], [43.5, -14.8], [43.5, 14.8], [3, -14.8], [3, 14.8]]
    .forEach(([y, z]) => cylX(0.3, 0.18, matScrew, 36.08, y, z, shell, true));

  // ============================================================
  //  右侧板(朝 +Z):3 组阶梯侧百叶 / 检修门 / 吊环挂牌
  // ============================================================
  [20, 7, -7].forEach(gx => {
    [-1.8, 1.8].forEach(dx => {
      for (let i = 0; i < 13; i++) {
        box(2.9, 0.62, 0.3, matGrille, gx + dx, 8 + i * 1.35, 17.05, shell, true);
      }
    });
  });
  box(9.5, 24, 0.3, matHatch, 28.2, 52, 17.03, shell, true);
  box(1.0, 15, 1.1, matHandle, 34.0, 65.3, 17.5, shell, true);
  [[24.2, 63], [32.2, 63], [24.2, 41], [32.2, 41]].forEach(([x, y]) =>
    box(0.55, 0.55, 0.25, matScrew, x, y, 17.28, shell, true));
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.28, 12, 28), matMetal);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(30.5, 77.0, 17.35);
    ring.castShadow = true;
    shell.add(ring); ring.userData.shell = true;
    box(3.0, 0.9, 0.55, matHandle, 30.5, 79.0, 17.15, shell, true);
    box(2.8, 5.4, 0.45, matHandle, 30.5, 73.4, 17.15, shell, true);
    box(0.35, 0.35, 0.28, matScrew, 30.5, 65.8, 17.25, shell, true);
  }
  [[71, 11.5], [58, -28], [76, -14], [44, 24]].forEach(([y, x]) =>
    box(0.55, 0.55, 0.25, matScrew, x, y, 17.28, shell, true));

  // 左侧板(−Z)螺栓
  [[82, -20], [82, 20], [43.5, -20], [43.5, 20], [3, -20], [3, 20]]
    .forEach(([y, x]) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16), matScrew);
      m.rotation.x = Math.PI / 2;
      m.position.set(x, y, -17.08);
      shell.add(m); m.userData.shell = true;
    });

  // ============================================================
  //  后面板(朝 −X)—— 按实拍图
  // ============================================================
  // 2 组 DB9(RS232 / RS485)+ 标签
  [[-11.9, matLbl232], [-6.5, matLbl485]].forEach(([z, lbl]) => {
    box(0.35, 2.5, 4.3, matMetal, -36.1, 76.1, z, shell, true);        // D 壳
    box(0.22, 1.35, 2.9, matToggle, -36.33, 76.1, z, shell, true);     // 针芯
    cylX(0.22, 0.25, matMetal, -36.42, 76.1, z - 1.75, shell, true);   // 固定螺钉
    cylX(0.22, 0.25, matMetal, -36.42, 76.1, z + 1.75, shell, true);
    planeZY(4.3, 1.35, lbl, -36.31, 72.3, z);                          // 名牌
  });

  // 12 位绿色干接点端子 + 号码表
  box(1.0, 1.9, 9.5, matGreen, -36.25, 78.8, 4.75, shell, true);
  for (let i = 0; i < 12; i++) cylX(0.3, 0.35, matMetal, -36.9, 79.15, 0.25 + i * 0.82, shell, true);
  box(0.55, 4.6, 9.5, matTermBase, -36.12, 75.2, 4.75, shell, true);
  planeZY(9.3, 2.6, matTermLbl, -36.46, 75.2, 4.75);

  // 双 120mm 风扇防护罩(6 圈同心圆 + 十字加强筋)
  [63.3, 39.0].forEach(y => {
    cylX(6.85, 0.35, matFanDark, -36.12, y, 4.6, shell, true);
    [1.2, 2.4, 3.6, 4.8, 5.9, 6.85].forEach(r => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.14, 10, 44), matMetal);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-36.4, y, 4.6);
      shell.add(ring); ring.userData.shell = true;
    });
    [Math.PI / 4, -Math.PI / 4].forEach(a => {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 13.7), matMetal);
      spoke.rotation.x = a;
      spoke.position.set(-36.4, y, 4.6);
      shell.add(spoke); spoke.userData.shell = true;
    });
    cylX(1.6, 0.5, matFanDark, -36.44, y, 4.6, shell, true);
    [[4.85, 4.85], [4.85, -4.85], [-4.85, 4.85], [-4.85, -4.85]].forEach(([dy, dz]) =>
      cylX(0.34, 0.22, matMetal, -36.52, y + dy, 4.6 + dz, shell, true));
  });

  // 左侧散热槽:4 组 × 10 条横圆槽
  [68.65, 58.5, 47.95, 37.5].forEach(gy => {
    for (let i = 0; i < 10; i++) {
      const slot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 9.5, 12), matGrille);
      slot.rotation.x = Math.PI / 2;
      slot.position.set(-36.06, gy - 3.55 + i * 0.79, -9.25);
      shell.add(slot); slot.userData.shell = true;
    }
  });

  // 断路器:5P(输入/输出)+ 2P 维修旁路 —— 白壳蓝钮微型断路器
  const mcb = (z, y) => {
    box(1.55, 4.9, 2.2, matBreaker, -36.55, y, z, shell, true);
    const t = box(0.85, 2.1, 0.95, matBlue, -36.98, y + 0.55, z, shell, true);
    t.rotation.z = -0.32;
    box(0.12, 0.55, 1.8, matToggle, -37.36, y + 1.85, z, shell, true);
  };
  box(0.5, 11, 13.75, matTermBase, -36.1, 19.4, -3.35, shell, true);
  for (let i = 0; i < 5; i++) mcb(-8.1 + i * 2.6, 19.85);
  box(0.5, 11, 5.0, matTermBase, -36.1, 19.4, 8.5, shell, true);
  [7.1, 9.6].forEach(z => mcb(z, 19.85));
  // 框架螺钉
  [-10.25, -6.9, -3.55, -0.2, 3.15].forEach(z => {
    cylX(0.26, 0.2, matMetal, -36.42, 24.4, z, shell, true);
    cylX(0.26, 0.2, matMetal, -36.42, 14.4, z, shell, true);
  });
  [6.0, 11.0].forEach(z => {
    cylX(0.26, 0.2, matMetal, -36.42, 24.4, z, shell, true);
    cylX(0.26, 0.2, matMetal, -36.42, 14.4, z, shell, true);
  });
  cylX(0.26, 0.2, matMetal, -36.42, 19.4, -10.25, shell, true);
  cylX(0.26, 0.2, matMetal, -36.42, 19.4, 3.5, shell, true);
  cylX(0.26, 0.2, matMetal, -36.42, 19.4, 6.0, shell, true);
  cylX(0.26, 0.2, matMetal, -36.42, 19.4, 11.0, shell, true);
  // 标签:输入 / 输出 / 维修开关
  planeZY(3.25, 1.7, matLblIn, -36.31, 27.7, -7.65);
  planeZY(3.25, 1.7, matLblOut, -36.31, 27.7, -2.6);
  planeZY(4.0, 1.7, matLblMaint, -36.31, 27.7, 8.5);

  // 底部大电流动力端子排(2×10 黄铜方块,相间隔板)
  box(0.8, 9, 25.25, matTermBase, -36.2, 10.7, -0.1, shell, true);
  for (let i = 0; i < 10; i++) {
    const z = -6.75 + i * 1.7;
    [12.7, 9.2].forEach(y => {
      box(1.15, 1.7, 1.35, matBrass, -36.85, y, z, shell, true);
      cylX(0.34, 0.3, matToggle, -37.55, y, z, shell, true); // 螺钉头
    });
    box(1.3, 7.4, 0.22, matToggle, -36.8, 10.7, z + 0.85, shell, true); // 相间隔板
  }
  box(1.3, 7.4, 0.22, matToggle, -36.8, 10.7, -7.6, shell, true);
  // 两端接线座
  [-10.25, 10.75].forEach(z => {
    box(1.3, 3.6, 3.0, matTermBase, -36.8, 10.9, z, shell, true);
    cylX(0.3, 0.3, matMetal, -37.6, 12.2, z, shell, true);
    cylX(0.3, 0.3, matMetal, -37.6, 9.6, z, shell, true);
  });

  // 后面板角螺栓
  [[83.8, -15.5], [83.8, 15.5], [2.6, -15.5], [2.6, 15.5]]
    .forEach(([y, z]) => cylX(0.32, 0.2, matScrew, -36.08, y, z, shell, true));

  // ============================================================
  //  内部:三层结构
  // ============================================================
  [38.5, 59.7].forEach(y => {
    box(68, 1.0, 31.2, matShelf, 0, y, 0, interior);
    box(1.2, 2.2, 31.2, matShelf, 33.4, y + 1.6, 0, interior);
    box(1.2, 2.2, 31.2, matShelf, -33.4, y + 1.6, 0, interior);
    [-15.2, 15.2].forEach(z => box(68, 1.4, 0.9, matShelf, 0, y - 1.1, z, interior));
  });

  // 12V 蓄电池块(17Ah 级:181 × 77 × 167 mm)
  function makeBattery(x, y, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(18.1, 16.7, 7.7), matBattery);
    body.position.y = 8.35;
    body.castShadow = true;
    const top = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.35, 7.0), matBatTop);
    top.position.y = 16.85;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 1.25, 18), matPos);
    p.position.set(-5.2, 17.7, -2.0);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 1.25, 18), matNeg);
    n.position.set(-5.2, 17.7, 2.0);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 1.0), matBrass);
    bar.position.set(-5.2, 18.45, -2.0);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 1.0), matBrass);
    bar2.position.set(-5.2, 18.45, 2.0);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.2), matBatLabel);
    label.rotation.y = Math.PI / 2;
    label.position.set(9.08, 9.6, 0);
    g.add(body, top, p, n, bar, bar2, label);
    g.position.set(x, y, z);
    return g;
  }
  [-11.7, -3.9, 3.9, 11.7].forEach(z => interior.add(makeBattery(4, 39, z)));
  [-11.7, -3.9, 3.9, 11.7].forEach(z => interior.add(makeBattery(4, 60.2, z)));

  // 下层:电脑主机(塔式机箱)
  {
    const pc = new THREE.Group();
    const caseBody = new THREE.Mesh(new THREE.BoxGeometry(45, 42, 20), matPC);
    caseBody.castShadow = true;
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.7, 41, 19.2), matPCFront);
    front.position.x = 24.7;
    const power = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.28, 20), matPwr);
    power.rotation.z = Math.PI / 2;
    power.position.set(25.18, 37, -5.5);
    const reset = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 16), matToggle);
    reset.rotation.z = Math.PI / 2;
    reset.position.set(25.16, 37, -8.4);
    pc.add(caseBody, front, power, reset);
    [-5.5, -8.0].forEach(z => {
      const usb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 1.65), matUSB);
      usb.position.set(25.12, 32.6, z);
      pc.add(usb);
    });
    [-10.8, -12.4].forEach(z => {
      const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14), matUSB);
      jack.rotation.z = Math.PI / 2;
      jack.position.set(25.12, 32.6, z);
      pc.add(jack);
    });
    const bay = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.7, 12.5), matToggle);
    bay.position.set(25.12, 39.6, 2.5);
    pc.add(bay);
    for (let i = 0; i < 6; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.32, 9.5, 1.05), matGrille);
      vent.position.set(25.1, 8.8, -6.5 + i * 2.6);
      pc.add(vent);
    }
    pc.position.set(2, 22.2, 0);
    interior.add(pc);
  }

  return group;
}
