// security-platform.js — 企业安全管理平台一体机
// 2U 机架式，前置 10 寸平台状态屏（摄像机/报警/存储/事件），4 个热插拔盘位。
// 单位：厘米(cm)。外形 44 × 8.8 × 50。front +Z，root 旋转 180°。
function buildSecurityPlatform(THREE) {
  const { roundedRectShape, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'SecurityPlatformAppliance';

  const baseGroup = new THREE.Group(); baseGroup.name = 'SpBaseGroup';
  const coverGroup = new THREE.Group(); coverGroup.name = 'SpCoverGroup';
  const frontGroup = new THREE.Group(); frontGroup.name = 'SpFrontGroup';
  const rearGroup = new THREE.Group(); rearGroup.name = 'SpRearGroup';
  const internalGroup = new THREE.Group(); internalGroup.name = 'SpInternalGroup';
  const hddGroup = new THREE.Group(); hddGroup.name = 'SpHddGroup';
  root.add(baseGroup, coverGroup, frontGroup, rearGroup, internalGroup, hddGroup);

  const W = 44, H = 8.8, D = 50;
  const hw = W / 2, hh = H / 2, hd = D / 2;
  const wall = 0.16;

  // ---------- materials ----------
  const matCase = mat(THREE, 'physical', 'SpCaseMetal', { color: 0x1b1f25, metalness: 0.72, roughness: 0.42 });
  const matCover = mat(THREE, 'physical', 'SpCoverMetal', { color: 0x20252c, metalness: 0.72, roughness: 0.4 });
  const matEar = mat(THREE, 'physical', 'SpRackEar', { color: 0x16191e, metalness: 0.8, roughness: 0.38 });
  const matShield = mat(THREE, 'physical', 'SpNickel', { color: 0xc8d0d6, metalness: 0.9, roughness: 0.22 });
  const matBlack = mat(THREE, 'standard', 'SpBlackPlastic', { color: 0x0e1014, metalness: 0.1, roughness: 0.64 });
  const matGold = mat(THREE, 'physical', 'SpGold', { color: 0xfbbf24, metalness: 0.95, roughness: 0.14 });
  const matCopper = mat(THREE, 'physical', 'SpCopper', { color: 0xd97706, metalness: 0.9, roughness: 0.25 });
  const matHeatsink = mat(THREE, 'physical', 'SpHeatsink', { color: 0x2a2f36, metalness: 0.85, roughness: 0.3 });
  const matPcb = mat(THREE, 'standard', 'SpPcbGreen', { color: 0x0b3d2a, metalness: 0.15, roughness: 0.6 });
  const matHdd = mat(THREE, 'physical', 'SpHddCase', { color: 0x2a2e34, metalness: 0.6, roughness: 0.45 });
  const matPsu = mat(THREE, 'physical', 'SpPsuAlum', { color: 0x94a3b8, metalness: 0.85, roughness: 0.3 });

  // ---------- front silkscreen ----------
  const PW = W - 0.4, PH = H - 0.4;
  const CW = 2048, CH = Math.round(CW * PH / PW);
  const { c: fc, ctx: f } = canvas(CW, CH);
  const PX = x => (x / PW + 0.5) * CW;
  const PY = y => (0.5 - y / PH) * CH;

  const g = f.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, '#171b21'); g.addColorStop(0.5, '#20252c'); g.addColorStop(1, '#15191e');
  f.fillStyle = g; f.fillRect(0, 0, CW, CH);
  for (let y = 0; y < CH; y += 3) {
    f.strokeStyle = 'rgba(255,255,255,0.02)'; f.lineWidth = 1;
    f.beginPath(); f.moveTo(0, y); f.lineTo(CW, y); f.stroke();
  }
  // 蓝色平台主题条
  f.fillStyle = '#0ea5e9'; f.fillRect(PX(-21.6), PY(4.12), PX(21.6) - PX(-21.6), 5);
  f.fillStyle = '#dc2626'; f.fillRect(PX(-21.6), PY(4.12), PX(-13.0) - PX(-21.6), 5);

  label(f, 'HIKVISION', PX(-21.4), PY(3.66), { px: 18, color: '#f8fafc', mono: false });
  label(f, 'HikCentral Professional', PX(-15.4), PY(3.66), { px: 11, color: '#38bdf8' });
  label(f, 'DS-VP1000  ·  企业安全管理平台一体机', PX(-21.4), PY(3.28), { px: 9, color: '#94a3b8' });
  label(f, '128 CH  ·  4×SATA  ·  RAID 5  ·  DUAL GE', PX(21.4), PY(3.66), { px: 9, color: '#94a3b8', align: 'right' });

  label(f, 'PWR', PX(15.2), PY(2.3), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'SYS', PX(15.2), PY(1.7), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'ALM', PX(15.2), PY(1.1), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'NET', PX(15.2), PY(0.5), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'USB 3.0', PX(18.6), PY(0.1), { px: 7, color: '#0ea5e9', align: 'center' });
  label(f, 'ASSET: SEC-BLDG-A3-RACK01-PF01  ·  S/N PF20261029003', PX(0), PY(-4.02), { px: 9, color: '#64748b', align: 'center' });

  const frontTex = canvasTexture(THREE, fc);
  const matFront = mat(THREE, 'standard', 'SpFrontSilk', { map: frontTex, roughness: 0.42, metalness: 0.35 });

  // ---------- chassis ----------
  const uShape = new THREE.Shape();
  uShape.moveTo(-hw, hh - 0.12);
  uShape.lineTo(-hw, -hh + 0.1);
  uShape.quadraticCurveTo(-hw, -hh, -hw + 0.1, -hh);
  uShape.lineTo(hw - 0.1, -hh);
  uShape.quadraticCurveTo(hw, -hh, hw, -hh + 0.1);
  uShape.lineTo(hw, hh - 0.12);
  uShape.lineTo(hw - wall, hh - 0.12);
  uShape.lineTo(hw - wall, -hh + wall);
  uShape.lineTo(-hw + wall, -hh + wall);
  uShape.lineTo(-hw + wall, hh - 0.12);
  uShape.closePath();
  const uGeo = new THREE.ExtrudeGeometry(uShape, {
    depth: D - 0.4, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2,
  });
  uGeo.translate(0, 0, -(D - 0.4) / 2);
  const uBody = new THREE.Mesh(uGeo, matCase);
  uBody.name = 'Sp_UChassis';
  uBody.castShadow = true; uBody.receiveShadow = true;
  tag(uBody, '2U U 型下机壳', '1.2mm 镀锌钢板折弯，承载平台主板、硬盘与电源。', 'Shape + ExtrudeGeometry', 'SGCC');
  baseGroup.add(uBody);

  const coverShape = roundedRectShape(THREE, W - 0.08, D - 0.3, 0.24);
  const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2,
  });
  coverGeo.rotateX(Math.PI / 2);
  const cover = new THREE.Mesh(coverGeo, matCover);
  cover.position.y = hh;
  cover.name = 'Sp_TopCover';
  cover.castShadow = true;
  tag(cover, '可拆卸顶盖', '顶盖带散热窗，可透视查看平台主板与硬盘。', 'Shape + ExtrudeGeometry', 'SGCC');
  coverGroup.add(cover);

  // top vents
  const ventGeo = new THREE.BoxGeometry(24, 0.04, 0.3);
  for (let i = 0; i < 7; i++) {
    const v = new THREE.Mesh(ventGeo, matBlack);
    v.position.set(-4, hh + 0.08, -16 + i * 5);
    coverGroup.add(v);
  }

  // rack ears
  for (const side of [-1, 1]) {
    const sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, H - 0.14, 8), matEar);
    sidePlate.position.set(side * (hw + 0.13), 0, hd - 4);
    baseGroup.add(sidePlate);
    const flange = new THREE.Mesh(new THREE.BoxGeometry(2.0, H - 0.14, 0.26), matEar);
    flange.position.set(side * (hw - 0.9), 0, hd - 0.13);
    baseGroup.add(flange);
    for (const sy of [-2.6, 2.6]) {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 10), matShield);
      sc.rotation.x = Math.PI / 2;
      sc.position.set(side * (hw - 0.9), sy, hd + 0.02);
      baseGroup.add(sc);
    }
  }

  // ---------- front bezel ----------
  const frontZ = hd;
  const bezelShape = roundedRectShape(THREE, W + 0.04, H + 0.02, 0.2);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.36, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3,
  });
  bezelGeo.translate(0, 0, -0.18);
  const bezel = new THREE.Mesh(bezelGeo, matCase);
  bezel.position.z = frontZ;
  bezel.castShadow = true;
  frontGroup.add(bezel);

  const face = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), matFront);
  face.position.set(0, 0, frontZ + 0.26);
  face.name = 'Sp_FrontPanel';
  tag(face, '前面板丝印', '品牌、平台名称、型号、状态灯与资产编号。', 'PlaneGeometry + CanvasTexture', 'Silkscreen');
  frontGroup.add(face);

  // 10" dashboard LCD
  const { c: dc, ctx: d } = canvas(1280, 720);
  d.fillStyle = '#070b12'; d.fillRect(0, 0, 1280, 720);
  // top bar
  d.fillStyle = '#0b1626'; d.fillRect(0, 0, 1280, 64);
  d.fillStyle = '#0ea5e9'; d.fillRect(0, 60, 1280, 4);
  label(d, 'HikCentral Professional', 24, 34, { px: 26, color: '#e2e8f0', mono: false });
  label(d, '企业安全管理平台', 470, 34, { px: 16, color: '#38bdf8' });
  label(d, '2026-10-29  14:32', 1080, 34, { px: 16, color: '#94a3b8', align: 'right' });
  // KPI cards
  const cards = [
    { x: 24, title: 'CAMERAS', value: '128', sub: '在线 126 / 离线 2', color: '#22c55e' },
    { x: 336, title: 'ALARMS', value: '03', sub: '今日新增 12', color: '#f59e0b' },
    { x: 648, title: 'STORAGE', value: '68%', sub: '4×4TB RAID5', color: '#38bdf8' },
    { x: 960, title: 'PLATFORM', value: 'OK', sub: 'CPU 42% / MEM 61%', color: '#a78bfa' },
  ];
  cards.forEach(c => {
    d.fillStyle = '#0d1826'; d.fillRect(c.x, 92, 288, 150);
    d.strokeStyle = 'rgba(56,189,248,0.35)'; d.lineWidth = 2; d.strokeRect(c.x, 92, 288, 150);
    label(d, c.title, c.x + 18, 120, { px: 15, color: '#64748b' });
    label(d, c.value, c.x + 18, 178, { px: 52, color: c.color });
    label(d, c.sub, c.x + 18, 216, { px: 14, color: '#94a3b8' });
  });
  // left event list
  d.fillStyle = '#0b1420'; d.fillRect(24, 268, 700, 400);
  d.strokeStyle = 'rgba(56,189,248,0.25)'; d.strokeRect(24, 268, 700, 400);
  label(d, 'REAL-TIME EVENTS', 44, 296, { px: 15, color: '#38bdf8' });
  const events = [
    ['14:31:58', '周界东侧 · 区域入侵', '#ef4444'],
    ['14:30:12', '大门入口 · 人脸识别通过', '#22c55e'],
    ['14:28:40', '危化品库 · 门磁打开', '#f59e0b'],
    ['14:25:03', '实验室走廊 · 视频丢失', '#ef4444'],
    ['14:20:31', '平台 · 用户 admin 登录', '#38bdf8'],
  ];
  events.forEach((e, i) => {
    const y = 336 + i * 58;
    d.fillStyle = e[2];
    d.beginPath(); d.arc(52, y, 6, 0, Math.PI * 2); d.fill();
    label(d, e[0], 72, y + 1, { px: 15, color: '#94a3b8' });
    label(d, e[1], 180, y + 1, { px: 16, color: '#e2e8f0' });
  });
  // right map
  d.fillStyle = '#0b1420'; d.fillRect(752, 268, 504, 400);
  d.strokeStyle = 'rgba(56,189,248,0.25)'; d.strokeRect(752, 268, 504, 400);
  label(d, 'SITE MAP', 772, 296, { px: 15, color: '#38bdf8' });
  d.strokeStyle = 'rgba(56,189,248,0.18)'; d.lineWidth = 1;
  for (let x = 780; x < 1240; x += 40) { d.beginPath(); d.moveTo(x, 320); d.lineTo(x, 650); d.stroke(); }
  for (let y = 320; y < 650; y += 40) { d.beginPath(); d.moveTo(780, y); d.lineTo(1240, y); d.stroke(); }
  d.strokeStyle = '#38bdf8'; d.lineWidth = 3; d.strokeRect(860, 380, 200, 140);
  d.strokeStyle = '#22c55e'; d.strokeRect(1080, 430, 110, 90);
  d.fillStyle = '#ef4444'; d.beginPath(); d.arc(900, 420, 8, 0, Math.PI * 2); d.fill();
  d.fillStyle = '#22c55e'; d.beginPath(); d.arc(1130, 470, 8, 0, Math.PI * 2); d.fill();
  const dashTex = canvasTexture(THREE, dc);

  const lcdHousing = new THREE.Mesh(new THREE.BoxGeometry(11.4, 6.6, 0.6), matBlack);
  lcdHousing.position.set(-9.8, -0.35, frontZ + 0.2);
  const lcdScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(10.6, 5.96),
    new THREE.MeshBasicMaterial({ name: 'SpDashboardMat', map: dashTex })
  );
  lcdScreen.position.set(-9.8, -0.35, frontZ + 0.52);
  const lcdGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(10.8, 6.16),
    new THREE.MeshPhysicalMaterial({
      name: 'SpLcdGlass', color: 0xffffff, transparent: true, opacity: 0.06,
      roughness: 0.1, clearcoat: 0.5,
    })
  );
  lcdGlass.position.set(-9.8, -0.35, frontZ + 0.54);
  tag(lcdScreen, '10 寸平台状态屏', '实时显示摄像机在线数、报警、存储、平台负载与事件列表。', 'PlaneGeometry + CanvasTexture', 'IPS LCD');
  frontGroup.add(lcdHousing, lcdScreen, lcdGlass);

  // 4 drive bays 2×2
  const bayW = 5.4, bayH = 2.5;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const n = row * 2 + col + 1;
      const bx = 3.0 + col * 6.2;
      const by = 1.5 - row * 3.0;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(bayW, bayH, 0.9), matShield);
      frame.position.set(bx, by, frontZ + 0.22);
      const door = new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.35, bayH - 0.35, 0.35), matBlack);
      door.position.set(bx, by, frontZ + 0.72);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.4), matShield);
      handle.position.set(bx + bayW / 2 - 0.6, by, frontZ + 0.92);
      const led = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.0, roughness: 0.2 })
      );
      led.rotation.x = Math.PI / 2;
      led.position.set(bx - bayW / 2 + 0.45, by + bayH / 2 - 0.35, frontZ + 0.92);
      tag(door, `平台盘位 ${n}`, '4TB 企业级 SATA 硬盘热插拔托架，RAID 5 成员。', 'BoxGeometry', 'Aluminum Tray');
      frontGroup.add(frame, door, handle, led);
    }
  }

  // right side status LEDs / power / USB
  const pwrBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1d22, emissive: 0x0b3d1f, emissiveIntensity: 0.5, roughness: 0.35 })
  );
  pwrBtn.rotation.x = Math.PI / 2;
  pwrBtn.position.set(17.2, -1.7, frontZ + 0.35);
  const pwrLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.2, roughness: 0.2 })
  );
  pwrLed.rotation.x = Math.PI / 2;
  pwrLed.position.set(17.2, -1.7, frontZ + 0.48);
  frontGroup.add(pwrBtn, pwrLed);

  const ledCols = [0x22c55e, 0x3b82f6, 0xef4444, 0x06b6d4];
  ledCols.forEach((c, i) => {
    const led = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.2 })
    );
    led.rotation.x = Math.PI / 2;
    led.position.set(15.2, 2.3 - i * 0.6, frontZ + 0.32);
    frontGroup.add(led);
  });

  for (let i = 0; i < 2; i++) {
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.5), matShield);
    usb.position.set(18.6 + i * 1.25, 0.1, frontZ + 0.3);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.55), matBlack);
    inner.position.set(18.6 + i * 1.25, 0.1, frontZ + 0.42);
    frontGroup.add(usb, inner);
  }

  // ---------- rear panel ----------
  const rearZ = -hd;
  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, H - 0.2, 0.22), matCase);
  rearPlate.position.set(0, 0, rearZ + 0.11);
  rearGroup.add(rearPlate);

  // 4 GE RJ45
  for (let i = 0; i < 4; i++) {
    const rx = -17 + i * 2.4;
    const cage = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), matShield);
    cage.position.set(rx, 0.8, rearZ - 0.35);
    const cav = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.68, 1.55), matBlack);
    cav.position.set(rx, 0.8, rearZ - 0.3);
    rearGroup.add(cage, cav);
    for (let p = 0; p < 8; p++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.45), matGold);
      pin.position.set(rx - 0.35 + p * 0.1, 1.02, rearZ - 0.1);
      rearGroup.add(pin);
    }
  }
  // HDMI + VGA
  const hdmi = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.8), matShield);
  hdmi.position.set(-4.0, 0.8, rearZ - 0.2);
  const vga = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.8), matShield);
  vga.position.set(-0.5, 0.8, rearZ - 0.2);
  rearGroup.add(hdmi, vga);
  // USB
  for (let i = 0; i < 2; i++) {
    const usb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.7), matShield);
    usb.position.set(2.8 + i * 1.6, 0.8, rearZ - 0.15);
    rearGroup.add(usb);
  }
  // alarm block
  const alarm = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.6, 0.9), matBlack);
  alarm.position.set(9.5, 0.8, rearZ - 0.1);
  rearGroup.add(alarm);
  for (let t = 0; t < 8; t++) {
    const term = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.35), matCopper);
    term.position.set(7.5 + t * 0.55, 0.8, rearZ - 0.4);
    rearGroup.add(term);
  }

  // redundant PSUs
  for (let i = 0; i < 2; i++) {
    const px = 13.0 + i * 7.0;
    const psu = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.4, 12), matPsu);
    psu.position.set(px, -1.8, rearZ + 6.2);
    tag(psu, `冗余电源 ${i + 1}`, '550W 80+ Platinum 热插拔冗余电源。', 'BoxGeometry', 'Aluminum');
    rearGroup.add(psu);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 0.45), matBlack);
    handle.position.set(px, -0.5, rearZ - 0.2);
    rearGroup.add(handle);
  }

  // rear fans
  for (let i = 0; i < 2; i++) {
    const fx = -12 + i * 5.0;
    const fan = new THREE.Group();
    fan.position.set(fx, -2.4, rearZ + 0.2);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 1.0), matBlack);
    frame.position.z = 0.3;
    fan.add(frame);
    const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 1.1, 20), new THREE.MeshBasicMaterial({ color: 0x06080c }));
    tunnel.rotation.x = Math.PI / 2;
    fan.add(tunnel);
    const rotor = new THREE.Group();
    rotor.position.z = 0.1;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 14), matBlack);
    hub.rotation.x = Math.PI / 2;
    rotor.add(hub);
    const bg = new THREE.BoxGeometry(0.9, 0.32, 0.05);
    for (let b = 0; b < 7; b++) {
      const bp = new THREE.Group();
      bp.rotation.z = (b / 7) * Math.PI * 2;
      const bm = new THREE.Mesh(bg, matBlack);
      bm.position.x = 0.95; bm.rotation.x = 0.5;
      bp.add(bm); rotor.add(bp);
    }
    fan.add(rotor);
    rearGroup.add(fan);
  }

  // ---------- internals ----------
  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(34, 0.25, 30), matPcb);
  mainPcb.position.set(-3, -2.8, -4);
  mainPcb.name = 'Sp_Mainboard';
  tag(mainPcb, '平台服务器主板', '承载 Xeon CPU、DDR4、RAID 卡与双千兆网卡。', 'BoxGeometry', 'FR-4');
  internalGroup.add(mainPcb);

  const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 8), matHeatsink);
  base.position.set(-8, -2.2, -4);
  internalGroup.add(base);
  const finGeo = new THREE.BoxGeometry(0.14, 2.4, 8);
  for (let i = 0; i < 13; i++) {
    const fin = new THREE.Mesh(finGeo, matHeatsink);
    fin.position.set(-11.8 + i * 0.62, -0.9, -4);
    internalGroup.add(fin);
  }

  const ramGeo = new THREE.BoxGeometry(0.25, 1.4, 6);
  for (let i = 0; i < 8; i++) {
    const ram = new THREE.Mesh(ramGeo, matBlack);
    ram.position.set(-16 + i * 0.7, -1.9, 2);
    internalGroup.add(ram);
  }

  // 4 drives in front
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const bx = 3.0 + col * 6.2;
      const by = 1.5 - row * 3.0;
      const drive = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.5, 10), matHdd);
      drive.position.set(bx, by, 18);
      drive.name = `Sp_Hdd_${row * 2 + col + 1}`;
      hddGroup.add(drive);
    }
  }
  // cage
  for (const cx of [-0.8, 12.0]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.5, 12), matHdd);
    plate.position.set(cx, 0, 18);
    hddGroup.add(plate);
  }

  // PSU cages at rear
  for (let i = 0; i < 2; i++) {
    const px = 13.0 + i * 7.0;
    const psu = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.4, 12), matPsu);
    psu.position.set(px, -1.8, -19);
    internalGroup.add(psu);
  }

  markShell(coverGroup);
  markShell(baseGroup);
  internalGroup.visible = false;
  hddGroup.visible = false;

  root.rotation.y = Math.PI;
  root.userData = {
    groups: { baseGroup, coverGroup, frontGroup, rearGroup, internalGroup, hddGroup },
    onShellToggle: (on) => { internalGroup.visible = !on; hddGroup.visible = !on; },
  };
  return root;
}
