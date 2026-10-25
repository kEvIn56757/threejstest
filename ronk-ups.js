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
  const matPanelIn = new THREE.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.56, metalness: 0.22, emissive: 0x121519, emissiveIntensity: 1 });
  matPanelIn.name = 'front_panel_inner';
  const matTrim = new THREE.MeshStandardMaterial({ color: 0x646b73, roughness: 0.55, metalness: 0.18 });
  matTrim.name = 'gray_trim';
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
  // LCD(关机黑屏,仅玻璃反光)
  const texLCD = makeCanvasTex(256, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#15191e'); grad.addColorStop(0.45, '#0b0d10'); grad.addColorStop(1, '#060708');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.055)';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.52, 0); g.lineTo(0, h * 0.66); g.fill();
  });
  const matLCD = new THREE.MeshStandardMaterial({ map: texLCD, roughness: 0.14, metalness: 0.08 });
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
  box(70.8, 1.2, 34, matShell, 0, 0.6, 0, interior, false);      // 底板(内部视图保留)

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

  // 控制面板(按实拍重做):外板 25 宽异形(底部宽弧裙)+ 内台双层台阶
  {
    // 外板轮廓:上圆角、两侧立边、底部宽弧
    const s = new THREE.Shape();
    s.moveTo(-11.25, 72.1);
    s.lineTo(11.25, 72.1);
    s.quadraticCurveTo(12.45, 72.1, 12.45, 70.9);
    s.lineTo(12.45, 64.2);
    s.bezierCurveTo(12.45, 61.6, 7.0, 60.85, 0, 60.85);
    s.bezierCurveTo(-7.0, 60.85, -12.45, 61.6, -12.45, 64.2);
    s.lineTo(-12.45, 70.9);
    s.quadraticCurveTo(-12.45, 72.1, -11.25, 72.1);
    const outer = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: false }), matPanel);
    outer.rotation.y = Math.PI / 2;
    outer.position.set(35.96, 0, -0.08);
    outer.castShadow = true;
    outer.userData.shell = true;
    shell.add(outer);

    // 内台(比外板凸出 0.12,承载 LCD/按钮/按键排),底缘同样微弧
    const s2 = new THREE.Shape();
    s2.moveTo(-8.35, 71.4);
    s2.lineTo(8.35, 71.4);
    s2.quadraticCurveTo(9.35, 71.4, 9.35, 70.4);
    s2.lineTo(9.35, 63.2);
    s2.bezierCurveTo(9.35, 62.35, 5.2, 61.95, 0, 61.95);
    s2.bezierCurveTo(-5.2, 61.95, -9.35, 62.35, -9.35, 63.2);
    s2.lineTo(-9.35, 70.4);
    s2.quadraticCurveTo(-9.35, 71.4, -8.35, 71.4);
    const inner = new THREE.Mesh(new THREE.ExtrudeGeometry(s2, { depth: 0.24, bevelEnabled: false }), matPanelIn);
    inner.rotation.y = Math.PI / 2;
    inner.position.set(36.1, 0, -0.35);
    inner.castShadow = true;
    inner.userData.shell = true;
    shell.add(inner);
  }

  // LCD 模块(按实拍:灰框 10.3×5.7 + 黑框 9.05×4.3 + 黑屏 7.7×2.4,居中偏左 z+1.84)
  box(0.24, 5.7, 10.3, matTrim, 36.46, 68.1, 1.84, shell, true);
  box(0.26, 4.3, 9.05, matBezel, 36.47, 68.1, 1.84, shell, true);
  planeYZ(7.7, 2.4, matLCD, 36.615, 68.1, 1.84, shell, true);

  // 3 只大按钮(内台右侧竖排):暗环+铬环+暗缝+金属钮面+中心点,各带绿色指示灯
  [69.4, 66.6, 63.9].forEach(y => {
    cylX(0.90, 0.30, matToggle, 36.49, y, -8.0, shell, true);
    cylX(0.78, 0.32, matButton, 36.50, y, -8.0, shell, true);
    cylX(0.52, 0.34, matGrille, 36.51, y, -8.0, shell, true);
    cylX(0.40, 0.36, matMetal, 36.52, y, -8.0, shell, true);
    cylX(0.07, 0.38, matGrille, 36.53, y, -8.0, shell, true);
    cylX(0.19, 0.16, matLedG, 36.44, y + 1.37, -7.5, shell, true);
  });

  // 底排 6 只小按钮(LCD 下方一排,各带上方 LED):绿×4 红×1 绿×1
  [6.21, 4.39, 2.58, 0.76, -1.05, -2.87].forEach((z, i) => {
    cylX(0.62, 0.22, (i === 4) ? matPos : matToggle, 36.45, 64.1, z, shell, true);
    cylX(0.46, 0.25, matButton, 36.465, 64.1, z, shell, true);
    cylX(0.17, 0.16, (i === 4) ? matLedR : matLedG, 36.44, 65.0, z, shell, true);
  });

  // 两翼装饰杠(左右各 4 条圆头凸条,在外板翼面上)
  [70.9, 68.6, 66.1, 63.6].forEach(y => {
    [10.9, -10.9].forEach(z => {
      const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.5, 4, 12), matTrim);
      d.rotation.x = Math.PI / 2;
      d.position.set(36.1, y, z);
      d.userData.shell = true;
      shell.add(d);
    });
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
    planeZY(4.3, 1.35, lbl, -36.31, 73.0, z);                          // 名牌
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
  [66.5, 57, 47.5, 38].forEach(gy => {
    for (let i = 0; i < 10; i++) {
      const slot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 9.5, 12), matGrille);
      slot.rotation.x = Math.PI / 2;
      slot.position.set(-36.06, gy - 3.55 + i * 0.79, -9.25);
      shell.add(slot); slot.userData.shell = true;
    }
  });

  // 断路器:5P(输入/输出)+ 2P 维修旁路 —— 空开式白壳模块 + 蓝色闸刀手柄
  const mcb = (z, y) => {
    box(1.6, 5.2, 2.25, matBreaker, -36.55, y, z, shell, true);        // 白色模块
    box(0.55, 3.0, 1.6, matBreaker, -37.25, y + 0.2, z, shell, true);  // 手柄座
    const t = box(1.15, 2.5, 1.35, matBlue, -37.75, y + 0.45, z, shell, true); // 蓝色闸刀手柄
    t.rotation.z = -0.38;
    box(0.12, 0.5, 1.85, matToggle, -37.38, y + 2.15, z, shell, true); // 顶部小铭牌
  };
  box(0.5, 9, 13.75, matTermBase, -36.1, 19.7, -3.35, shell, true);
  for (let i = 0; i < 5; i++) mcb(-8.1 + i * 2.6, 19.7);
  box(0.5, 9, 5.0, matTermBase, -36.1, 19.7, 8.5, shell, true);
  [7.1, 9.6].forEach(z => mcb(z, 19.7));
  // 框架螺钉
  [-10.25, -6.9, -3.55, -0.2, 3.15, 6.0, 11.0].forEach(z => {
    cylX(0.26, 0.2, matMetal, -36.42, 23.7, z, shell, true);
    cylX(0.26, 0.2, matMetal, -36.42, 15.7, z, shell, true);
  });
  cylX(0.26, 0.2, matMetal, -36.42, 19.7, -10.25, shell, true);
  cylX(0.26, 0.2, matMetal, -36.42, 19.7, 3.5, shell, true);
  cylX(0.26, 0.2, matMetal, -36.42, 19.7, 6.0, shell, true);
  cylX(0.26, 0.2, matMetal, -36.42, 19.7, 11.0, shell, true);
  // 标签:输入 / 输出 / 维修开关
  planeZY(3.25, 1.7, matLblIn, -36.31, 27.7, -7.65);
  planeZY(3.25, 1.7, matLblOut, -36.31, 27.7, -2.6);
  planeZY(4.0, 1.7, matLblMaint, -36.31, 27.7, 8.5);

  // 底部大电流动力端子排(2×10 黄铜方块,相间隔板)
  box(0.8, 8, 25.25, matTermBase, -36.2, 9.2, -0.1, shell, true);
  for (let i = 0; i < 10; i++) {
    const z = -6.75 + i * 1.7;
    [11.2, 7.7].forEach(y => {
      box(1.15, 1.7, 1.35, matBrass, -36.85, y, z, shell, true);
      cylX(0.34, 0.3, matToggle, -37.55, y, z, shell, true); // 螺钉头
    });
    box(1.3, 6.6, 0.22, matToggle, -36.8, 9.2, z + 0.85, shell, true); // 相间隔板
  }
  box(1.3, 6.6, 0.22, matToggle, -36.8, 9.2, -7.6, shell, true);
  // 两端接线座
  [-10.25, 10.75].forEach(z => {
    box(1.3, 3.2, 3.0, matTermBase, -36.8, 9.2, z, shell, true);
    cylX(0.3, 0.3, matMetal, -37.6, 10.5, z, shell, true);
    cylX(0.3, 0.3, matMetal, -37.6, 7.9, z, shell, true);
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

  // 下层:小机箱(准系统塔式,36×30×16)
  {
    const pc = new THREE.Group();
    const caseBody = new THREE.Mesh(new THREE.BoxGeometry(36, 30, 16), matPC);
    caseBody.castShadow = true;
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.7, 29, 15.2), matPCFront);
    front.position.x = 18.3;
    const power = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.28, 20), matPwr);
    power.rotation.z = Math.PI / 2;
    power.position.set(18.85, 11.5, -2.0);
    const reset = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 16), matToggle);
    reset.rotation.z = Math.PI / 2;
    reset.position.set(18.83, 11.5, -4.0);
    pc.add(caseBody, front, power, reset);
    [-2.0, -4.0].forEach(z => {
      const usb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 1.5), matUSB);
      usb.position.set(18.8, 8.0, z);
      pc.add(usb);
    });
    [-5.4, -6.5].forEach(z => {
      const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.22, 14), matUSB);
      jack.rotation.z = Math.PI / 2;
      jack.position.set(18.8, 8.0, z);
      pc.add(jack);
    });
    const bay = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 8), matToggle);
    bay.position.set(18.82, 12.8, 3.4);
    pc.add(bay);
    for (let i = 0; i < 5; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7, 0.9), matGrille);
      vent.position.set(18.8, -8.5, -3.6 + i * 1.8);
      pc.add(vent);
    }
    pc.position.set(8, 16.4, 0);
    interior.add(pc);
  }

  return group;
}
