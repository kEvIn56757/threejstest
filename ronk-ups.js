// ronk-ups.js — RONK 新H型系列工频/高频在线式 UPS 机柜
// 单位:厘米(cm)。外形 34(宽 Z) × 72(深 X) × 85.5(高 Y),图纸 340×720×855 mm 1:10。
// 朝向:前面板朝 +X,侧面 ±Z,后面板 −X。
// 内部三层:上层 4 只 12V 蓄电池、中层 4 只、下层电脑主机(96VDC=8×12V)。
// 涂装:工业碳素黑 RAL 9005,亚光微金属质感(光泽度 20~25 GU)。
// THREE 作为参数传入,不依赖模块系统,便于单文件内联。
function buildRonkUPS(THREE) {
  const group = new THREE.Group();
  group.name = 'ronk_ups';

  // ---------- 材质 ----------
  const matShell = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.58, metalness: 0.22, emissive: 0x12151a, emissiveIntensity: 1 });
  matShell.name = 'shell_ral9005';
  const matPanel = new THREE.MeshStandardMaterial({ color: 0x34383d, roughness: 0.55, metalness: 0.24, emissive: 0x14171c, emissiveIntensity: 1 });
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

  // LCD 屏幕贴图
  function makeLCDTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#2a5e8e'); grad.addColorStop(1, '#16344f');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 128);
    g.fillStyle = 'rgba(190,225,255,0.85)';
    for (let i = 0; i < 4; i++) g.fillRect(28, 26 + i * 22, 120 + (i % 2) * 60, 8);
    g.fillStyle = 'rgba(160,210,255,0.5)';
    g.fillRect(170, 26, 58, 70);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  // RONK logo 贴图
  function makeLogoTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 160;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 512, 160);
    g.fillStyle = '#d8dade';
    g.font = 'bold italic 120px Arial, Helvetica, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    try { g.letterSpacing = '10px'; } catch (_) {}
    g.fillText('RONK', 256, 86);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  const matLogo = new THREE.MeshStandardMaterial({ map: makeLogoTexture(), transparent: true, roughness: 0.55, depthWrite: false });
  matLogo.name = 'logo_ronk';
  const matLCD = new THREE.MeshStandardMaterial({ map: makeLCDTexture(), emissive: 0x224466, emissiveIntensity: 0.55, roughness: 0.25 });
  matLCD.name = 'lcd_screen';

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

  // ============================================================
  //  外壳:六块钣金面板(SPCC 冷轧板,RAL 9005 喷涂)
  // ============================================================
  box(1.2, 85.5, 31.6, matShell, 35.4, 42.75, 0, shell, true);   // 前面板
  box(1.2, 85.5, 31.6, matShell, -35.4, 42.75, 0, shell, true);  // 后面板
  box(72, 85.5, 1.2, matShell, 0, 42.75, 16.4, shell, true);     // 右侧板
  box(72, 85.5, 1.2, matShell, 0, 42.75, -16.4, shell, true);    // 左侧板
  box(70.8, 1.2, 34, matShell, 0, 84.9, 0, shell, true);         // 顶盖
  box(70.8, 1.2, 34, matShell, 0, 0.6, 0, shell, true);          // 底板

  // 顶部加强筋带:3 道环绕四面的水平凸筋(图纸顶沿 y≈80.5~84.5)
  [81.2, 82.5, 83.8].forEach(y => {
    box(0.5, 0.85, 34.6, matGroove, 36.15, y, 0, shell, true);    // 前
    box(0.5, 0.85, 34.6, matGroove, -36.15, y, 0, shell, true);   // 后
    box(72.6, 0.85, 0.5, matGroove, 0, y, 17.15, shell, true);    // 右
    box(72.6, 0.85, 0.5, matGroove, 0, y, -17.15, shell, true);   // 左
  });

  // 底部 4 只可调防滑地脚(φ44 mm)
  [[-28, -12], [-28, 12], [28, -12], [28, 12]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.2, 2.5, 24), matFoot);
    post.position.set(x, -1.25, z);
    post.castShadow = true;
    interior.add(post);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.9, 24), matFoot);
    pad.position.set(x, -2.95, z);
    interior.add(pad);
  });

  // ============================================================
  //  前面板(朝 +X):RONK logo / 控制面板 / 强制进风百叶栅
  // ============================================================
  // RONK logo(左上,面朝 +X)
  planeYZ(7.4, 2.4, matLogo, 36.08, 78, 9.9, shell, true);

  // 控制面板(圆角底边造型,略浅于机身)
  {
    const pw = 11, pT = 8, rt = 1.5, rb = 4.6;
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
    const ext = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false });
    const p = new THREE.Mesh(ext, matPanel);
    p.rotation.y = Math.PI / 2;
    p.position.set(35.55, 65, 0);
    p.castShadow = true;
    p.userData.shell = true;
    shell.add(p);
  }

  // LCD 液晶屏(面板中偏左)
  box(0.5, 6.4, 9.4, matBezel, 36.55, 67.2, 1.9, shell, true);
  planeYZ(8.4, 5.4, matLCD, 36.83, 67.2, 1.9, shell, true);

  // 3 只金属按钮(竖排,面板右侧)+ 顶部微型电源指示灯
  [69.8, 65.5, 61.2].forEach(y => {
    cylX(0.95, 0.55, matButton, 36.62, y, -6.5, shell, true);
    cylX(1.12, 0.12, matPanel, 36.5, y, -6.5, shell, true);
  });
  cylX(0.24, 0.2, matLedG, 36.58, 71.6, -6.5, shell, true);

  // 状态 LED 一行 6 点(LCD 下方):绿/白/白/黄/红/红
  [matLedG, matLedW, matLedW, matLedA, matLedR, matLedR].forEach((m, i) =>
    cylX(0.3, 0.22, m, 36.6, 62.6, 5.7 - i * 1.62, shell, true));

  // 面板铭牌槽线(左 3 右 3)
  [65.3, 62.4, 59.5].forEach(y => {
    box(0.18, 0.5, 2.1, matGrille, 36.52, y, 9.2, shell, true);
    box(0.18, 0.5, 2.1, matGrille, 36.52, y, -9.2, shell, true);
  });

  // 大面积强制进风百叶栅(14 片竖叶片)+ 防尘过滤网
  box(0.15, 37, 27, matFilter, 35.62, 27.5, 0.8, shell, true);
  for (let i = 0; i < 14; i++) {
    box(0.3, 36, 1.15, matGrille, 36.06, 27.5, 0.8 + (i - 6.5) * 1.9, shell, true);
  }

  // 前面板沉头螺栓
  [[82, -14.8], [82, 14.8], [43.5, -14.8], [43.5, 14.8], [3, -14.8], [3, 14.8]]
    .forEach(([y, z]) => cylX(0.3, 0.18, matScrew, 36.08, y, z, shell, true));

  // ============================================================
  //  右侧板(朝 +Z):3 组阶梯侧百叶 / 检修门 / 吊环挂牌
  // ============================================================
  // 3 组阶梯侧百叶(每组 2 列 × 13 片短横槽,前中部布置)
  [20, 7, -7].forEach(gx => {
    [-1.8, 1.8].forEach(dx => {
      for (let i = 0; i < 13; i++) {
        box(2.9, 0.62, 0.3, matGrille, gx + dx, 8 + i * 1.35, 17.05, shell, true);
      }
    });
  });
  // 检修门(前部竖长门)+ 竖向拉手
  box(9.5, 24, 0.3, matHatch, 28.2, 52, 17.03, shell, true);
  box(1.0, 15, 1.1, matHandle, 34.0, 65.3, 17.5, shell, true);
  [[24.2, 63], [32.2, 63], [24.2, 41], [32.2, 41]].forEach(([x, y]) =>
    box(0.55, 0.55, 0.25, matScrew, x, y, 17.28, shell, true));
  // 顶部吊环 + 挂牌(右前角)
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
  // 侧面板螺栓
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
  //  后面板(朝 −X):通讯 / 干接点 / 双风扇 / 断路器 / 动力端子
  // ============================================================
  // 2 组 DB9 通讯串口(RS232 / RS485)+ 标签条
  [-8.4, -3.6].forEach(z => {
    box(0.35, 1.6, 2.4, matMetal, -36.1, 80.4, z, shell, true);
    box(0.22, 1.0, 1.7, matToggle, -36.32, 80.4, z, shell, true);
    box(0.25, 0.7, 2.8, matBreaker, -36.12, 78.6, z, shell, true);
  });
  // 12 位可插拔干接点端子(绿色,故障告警/电池低压/市电异常…)
  box(1.0, 1.9, 9.2, matGreen, -36.25, 81.1, 5.9, shell, true);
  for (let i = 0; i < 12; i++) cylX(0.28, 0.3, matBreaker, -36.85, 81.65, 1.5 + i * 0.8, shell, true);
  box(0.7, 1.0, 9.6, matTermBase, -36.15, 79.7, 5.9, shell, true);

  // 双 120mm 高速轴流风扇(4 圈同心圆钢丝防护网 + 十字加强筋)
  [70.6, 52.3].forEach(y => {
    cylX(6.1, 0.35, matFanDark, -36.12, y, 5.4, shell, true);
    [1.7, 3.2, 4.7, 6.05].forEach(r => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.16, 10, 40), matMetal);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-36.38, y, 5.4);
      shell.add(ring); ring.userData.shell = true;
    });
    [Math.PI / 4, -Math.PI / 4].forEach(a => {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 12.3), matMetal);
      spoke.rotation.x = a;
      spoke.position.set(-36.38, y, 5.4);
      shell.add(spoke); spoke.userData.shell = true;
    });
    cylX(1.85, 0.5, matFanDark, -36.42, y, 5.4, shell, true);
    [[4.3, 4.3], [4.3, -4.3], [-4.3, 4.3], [-4.3, -4.3]].forEach(([dy, dz]) =>
      cylX(0.32, 0.22, matMetal, -36.5, y + dy, 5.4 + dz, shell, true));
  });

  // 左中散热槽网格 2 组(7 列 × 6 行短竖槽)
  [62.9, 48.5].forEach(gy => {
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 6; r++) {
        box(0.3, 1.9, 0.7, matGrille, -36.06, gy - 4.75 + r * 1.9, -3.1 - c * 1.63, shell, true);
      }
    }
  });
  // 左缘竖向散热槽列
  for (let i = 0; i < 8; i++) {
    box(0.3, 1.5, 0.7, matGrille, -36.06, 12.5 + i * 2.2, -15, shell, true);
  }

  // 断路器区:5P 微型断路器 + 2P 独立手动维修旁路 + 1P 防雷开关
  box(0.5, 5.2, 12.9, matTermBase, -36.1, 26, -3.75, shell, true);
  for (let i = 0; i < 5; i++) {
    const z = -8.55 + i * 2.4;
    box(1.7, 2.7, 1.85, matBreaker, -36.55, 26.6, z, shell, true);
    const t = box(1.9, 1.15, 0.85, matToggle, -36.9, 26.6, z, shell, true);
    t.rotation.z = -0.35;
  }
  box(0.5, 5.2, 5.8, matTermBase, -36.1, 26, 9.4, shell, true);
  [8.3, 10.5].forEach(z => {
    box(1.9, 3.5, 2.1, matBreaker, -36.55, 26.2, z, shell, true);
    const t = box(2.1, 1.35, 1.0, matToggle, -36.95, 26.2, z, shell, true);
    t.rotation.z = -0.35;
  });
  box(1.8, 3.3, 2.0, matBreaker, -36.55, 26.2, -12.6, shell, true);
  const lt = box(2.0, 1.25, 0.95, matToggle, -36.92, 26.2, -12.6, shell, true);
  lt.rotation.z = -0.35;
  // 标签条
  [-12.6, -3.75, 9.4].forEach(z => box(0.35, 0.85, 2.6, matBreaker, -36.18, 29.6, z, shell, true));

  // 底部大电流动力接线端子排(2×10 位黄铜柱,带相间隔绝缘隔板)
  box(0.8, 12, 23.7, matTermBase, -36.15, 14, 1.65, shell, true);
  for (let i = 0; i < 10; i++) {
    const z = -7.1 + i * 2.03;
    cylX(0.55, 0.9, matBrass, -36.85, 11.8, z, shell, true);
    cylX(0.55, 0.9, matBrass, -36.85, 16.2, z, shell, true);
    box(1.5, 10.2, 0.22, matToggle, -36.75, 14, z + 1.01, shell, true); // 相间隔板
  }
  box(1.5, 10.2, 0.22, matToggle, -36.75, 14, -8.11, shell, true);
  [[14, -9.4], [14, 12.7]].forEach(([y, z]) => cylX(0.35, 0.3, matBreaker, -36.9, y, z, shell, true));

  // 后面板螺栓
  [[82, -14.8], [82, 14.8], [43.5, -14.8], [43.5, 14.8], [3, -14.8], [3, 14.8]]
    .forEach(([y, z]) => cylX(0.3, 0.18, matScrew, -36.08, y, z, shell, true));

  // ============================================================
  //  内部:三层结构
  // ============================================================
  // 层板(带前/后翻边)
  [38.5, 59.7].forEach(y => {
    box(68, 1.0, 31.2, matShelf, 0, y, 0, interior);
    box(1.2, 2.2, 31.2, matShelf, 33.4, y + 1.6, 0, interior);
    box(1.2, 2.2, 31.2, matShelf, -33.4, y + 1.6, 0, interior);
    // 层板侧面支撑
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
  // 中层 4 只(层板 38.5 上)
  [-11.7, -3.9, 3.9, 11.7].forEach(z => interior.add(makeBattery(4, 39, z)));
  // 上层 4 只(层板 59.7 上)
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
