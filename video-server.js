// video-server.js — 2U 视频服务器 / 解码服务器
// 8 个 2.5" 热插拔盘位、双路 CPU 散热、RAID 卡、冗余电源与 4 个热插拔风扇。
// 单位：厘米(cm)。外形 44 × 8.8 × 65。front +Z，root 旋转 180°。
function buildVideoServer(THREE) {
  const { roundedRectShape, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'VideoServer2U';

  const baseGroup = new THREE.Group(); baseGroup.name = 'VsBaseGroup';
  const coverGroup = new THREE.Group(); coverGroup.name = 'VsCoverGroup';
  const frontGroup = new THREE.Group(); frontGroup.name = 'VsFrontGroup';
  const rearGroup = new THREE.Group(); rearGroup.name = 'VsRearGroup';
  const internalGroup = new THREE.Group(); internalGroup.name = 'VsInternalGroup';
  const hddGroup = new THREE.Group(); hddGroup.name = 'VsHddGroup';
  root.add(baseGroup, coverGroup, frontGroup, rearGroup, internalGroup, hddGroup);

  const W = 44, H = 8.8, D = 65;
  const hw = W / 2, hh = H / 2, hd = D / 2;
  const wall = 0.16;

  // ---------- materials ----------
  const matCase = mat(THREE, 'physical', 'VsCaseMetal', { color: 0x1b1f25, metalness: 0.72, roughness: 0.42 });
  const matCover = mat(THREE, 'physical', 'VsCoverMetal', { color: 0x20252c, metalness: 0.72, roughness: 0.4 });
  const matEar = mat(THREE, 'physical', 'VsRackEar', { color: 0x16191e, metalness: 0.8, roughness: 0.38 });
  const matShield = mat(THREE, 'physical', 'VsNickel', { color: 0xc8d0d6, metalness: 0.9, roughness: 0.22 });
  const matBlack = mat(THREE, 'standard', 'VsBlackPlastic', { color: 0x0e1014, metalness: 0.1, roughness: 0.64 });
  const matGold = mat(THREE, 'physical', 'VsGold', { color: 0xfbbf24, metalness: 0.95, roughness: 0.14 });
  const matCopper = mat(THREE, 'physical', 'VsCopper', { color: 0xd97706, metalness: 0.9, roughness: 0.25 });
  const matRubber = mat(THREE, 'standard', 'VsRubber', { color: 0x0a0b0d, roughness: 0.9 });
  const matHeatsink = mat(THREE, 'physical', 'VsHeatsink', { color: 0x2a2f36, metalness: 0.85, roughness: 0.3 });
  const matPcb = mat(THREE, 'standard', 'VsPcbGreen', { color: 0x0b3d2a, metalness: 0.15, roughness: 0.6 });
  const matHdd = mat(THREE, 'physical', 'VsHddCase', { color: 0x2a2e34, metalness: 0.6, roughness: 0.45 });
  const matPsu = mat(THREE, 'physical', 'VsPsuAlum', { color: 0x94a3b8, metalness: 0.85, roughness: 0.3 });

  // ---------- front silkscreen ----------
  const PW = W - 0.4, PH = H - 0.4;
  const CW = 2048, CH = Math.round(CW * PH / PW);
  const { c: fc, ctx: f } = canvas(CW, CH);
  const PX = x => (x / PW + 0.5) * CW;
  const PY = y => (0.5 - y / PH) * CH;

  const g = f.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, '#1a1e24'); g.addColorStop(0.5, '#22272e'); g.addColorStop(1, '#171b21');
  f.fillStyle = g; f.fillRect(0, 0, CW, CH);
  for (let y = 0; y < CH; y += 3) {
    f.strokeStyle = 'rgba(255,255,255,0.02)'; f.lineWidth = 1;
    f.beginPath(); f.moveTo(0, y); f.lineTo(CW, y); f.stroke();
  }
  f.fillStyle = '#dc2626'; f.fillRect(PX(-21.6), PY(4.12), PX(21.6) - PX(-21.6), 5);

  label(f, 'HIKVISION', PX(-21.4), PY(3.62), { px: 20, color: '#f8fafc', mono: false });
  label(f, 'DS-VS2000', PX(-16.0), PY(3.62), { px: 11, color: '#94a3b8' });
  label(f, '2U VIDEO SERVER  ·  8×2.5" SAS/SATA  ·  DUAL XEON', PX(-21.4), PY(3.22), { px: 9, color: '#64748b' });
  label(f, 'RAID 0/1/5/6/10  ·  10GbE SFP+  ·  REDUNDANT PSU', PX(21.4), PY(3.62), { px: 9, color: '#94a3b8', align: 'right' });

  // right control panel labels
  label(f, 'PWR', PX(11.0), PY(2.0), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'SYS', PX(11.0), PY(1.4), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'NET', PX(11.0), PY(0.8), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'ALM', PX(11.0), PY(0.2), { px: 7, color: '#94a3b8', align: 'center' });
  label(f, 'USB 3.0', PX(18.2), PY(0.0), { px: 7, color: '#0ea5e9', align: 'center' });
  label(f, 'RESET', PX(18.2), PY(-1.0), { px: 7, color: '#64748b', align: 'center' });
  label(f, 'ASSET: SEC-BLDG-A3-RACK01-VS01  ·  S/N VS20261029007', PX(0), PY(-4.02), { px: 9, color: '#64748b', align: 'center' });

  const frontTex = canvasTexture(THREE, fc);
  const matFront = mat(THREE, 'standard', 'VsFrontSilk', { map: frontTex, roughness: 0.42, metalness: 0.35 });

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
  uBody.name = 'Vs_UChassis';
  uBody.castShadow = true; uBody.receiveShadow = true;
  tag(uBody, '2U U 型下机壳', '1.2mm 镀锌钢板折弯，深灰喷塑，承载主板、硬盘笼与冗余电源。', 'Shape + ExtrudeGeometry', 'SGCC');
  baseGroup.add(uBody);

  const coverShape = roundedRectShape(THREE, W - 0.08, D - 0.3, 0.24);
  const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2,
  });
  coverGeo.rotateX(Math.PI / 2);
  const cover = new THREE.Mesh(coverGeo, matCover);
  cover.position.y = hh;
  cover.name = 'Vs_TopCover';
  cover.castShadow = true;
  tag(cover, '可拆卸顶盖', '顶盖带散热窗与加强筋，可透视查看双 CPU 与硬盘笼。', 'Shape + ExtrudeGeometry', 'SGCC');
  coverGroup.add(cover);

  // top vents
  const ventGeo = new THREE.BoxGeometry(26, 0.04, 0.3);
  for (let i = 0; i < 8; i++) {
    const v = new THREE.Mesh(ventGeo, matBlack);
    v.position.set(-4, hh + 0.08, -20 + i * 5);
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
  face.name = 'Vs_FrontPanel';
  tag(face, '前面板丝印', '品牌、型号、RAID/10GbE 规格、状态灯与资产编号。', 'PlaneGeometry + CanvasTexture', 'Silkscreen');
  frontGroup.add(face);

  // 8 hot-swap 2.5" bays: 4 columns × 2 rows
  const bayW = 4.8, bayH = 2.5;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const n = row * 4 + col + 1;
      const bx = -16.0 + col * 6.0;
      const by = 1.55 - row * 3.1;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(bayW, bayH, 0.9), matShield);
      frame.position.set(bx, by, frontZ + 0.22);
      const door = new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.35, bayH - 0.35, 0.35), matBlack);
      door.position.set(bx, by, frontZ + 0.72);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.4), matShield);
      handle.position.set(bx + bayW / 2 - 0.55, by, frontZ + 0.92);
      const led = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.0, roughness: 0.2 })
      );
      led.rotation.x = Math.PI / 2;
      led.position.set(bx - bayW / 2 + 0.45, by + bayH / 2 - 0.35, frontZ + 0.92);
      tag(door, `2.5" 热插拔盘位 ${n}`, 'SAS/SATA 热插拔硬盘托架，带锁扣与活动指示灯。', 'BoxGeometry', 'Aluminum Tray');
      frontGroup.add(frame, door, handle, led);
    }
  }

  // right control panel: power button + LEDs + USB + reset
  const pwrBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1d22, emissive: 0x0b3d1f, emissiveIntensity: 0.5, roughness: 0.35 })
  );
  pwrBtn.rotation.x = Math.PI / 2;
  pwrBtn.position.set(14.0, -1.8, frontZ + 0.35);
  const pwrLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.2, roughness: 0.2 })
  );
  pwrLed.rotation.x = Math.PI / 2;
  pwrLed.position.set(14.0, -1.8, frontZ + 0.48);
  frontGroup.add(pwrBtn, pwrLed);

  const ledCols = [0x22c55e, 0x3b82f6, 0x06b6d4, 0xef4444];
  ledCols.forEach((c, i) => {
    const led = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.2 })
    );
    led.rotation.x = Math.PI / 2;
    led.position.set(11.0, 2.0 - i * 0.6, frontZ + 0.32);
    frontGroup.add(led);
  });

  // USB
  for (let i = 0; i < 2; i++) {
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.5), matShield);
    usb.position.set(18.2 + i * 1.3, -0.0, frontZ + 0.3);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.55), matBlack);
    inner.position.set(18.2 + i * 1.3, -0.0, frontZ + 0.42);
    frontGroup.add(usb, inner);
  }
  const rst = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), matBlack);
  rst.rotation.x = Math.PI / 2;
  rst.position.set(18.2, -1.0, frontZ + 0.4);
  frontGroup.add(rst);

  // ---------- rear panel ----------
  const rearZ = -hd;
  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, H - 0.2, 0.22), matCase);
  rearPlate.position.set(0, 0, rearZ + 0.11);
  rearGroup.add(rearPlate);

  // IO ports left half
  const ioY = 0.8;
  const sfpXs = [-18.5, -15.5];
  for (const sx of sfpXs) {
    const cage = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 1.8), matShield);
    cage.position.set(sx, ioY, rearZ - 0.55);
    const cav = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.7, 1.85), matBlack);
    cav.position.set(sx, ioY, rearZ - 0.5);
    rearGroup.add(cage, cav);
  }
  for (let i = 0; i < 4; i++) {
    const rx = -10.5 + i * 2.2;
    const cage = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), matShield);
    cage.position.set(rx, ioY, rearZ - 0.35);
    const cav = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.68, 1.55), matBlack);
    cav.position.set(rx, ioY, rearZ - 0.3);
    rearGroup.add(cage, cav);
    for (let p = 0; p < 8; p++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.45), matGold);
      pin.position.set(rx - 0.35 + p * 0.1, ioY + 0.22, rearZ - 0.1);
      rearGroup.add(pin);
    }
  }
  // VGA
  const vga = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.8), matShield);
  vga.position.set(1.0, ioY, rearZ - 0.2);
  const vgaIn = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.85), matBlack);
  vgaIn.position.set(1.0, ioY, rearZ - 0.18);
  rearGroup.add(vga, vgaIn);
  // USB
  for (let i = 0; i < 2; i++) {
    const usb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.7), matShield);
    usb.position.set(4.5 + i * 1.6, ioY, rearZ - 0.15);
    rearGroup.add(usb);
  }
  // IPMI
  const ipmi = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.4), matShield);
  ipmi.position.set(8.5, ioY, rearZ - 0.35);
  rearGroup.add(ipmi);

  // redundant PSUs
  for (let i = 0; i < 2; i++) {
    const px = 12.5 + i * 7.2;
    const psu = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.6, 14), matPsu);
    psu.position.set(px, -1.8, rearZ + 7.2);
    tag(psu, `冗余电源 ${i + 1}`, '800W 80+ Platinum 热插拔冗余电源。', 'BoxGeometry', 'Aluminum');
    rearGroup.add(psu);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.5), matBlack);
    handle.position.set(px, -0.4, rearZ - 0.2);
    rearGroup.add(handle);
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.2, 20), matBlack);
    fan.rotation.x = Math.PI / 2;
    fan.position.set(px, -1.8, rearZ - 0.2);
    rearGroup.add(fan);
  }

  // rear fans (4)
  for (let i = 0; i < 4; i++) {
    const fx = -18 + i * 4.2;
    const fan = new THREE.Group();
    fan.position.set(fx, 2.8, rearZ + 0.2);
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

  // rear labels (canvas texture on a thin plane above PSUs)
  const { c: rc, ctx: r } = canvas(1024, 256);
  r.fillStyle = '#181c24'; r.fillRect(0, 0, 1024, 256);
  label(r, '10GbE SFP+  ·  GE RJ45  ·  IPMI  ·  REDUNDANT 800W', 24, 36, { px: 18, color: '#94a3b8' });
  label(r, 'PSU1', 700, 220, { px: 16, color: '#cbd5e1' });
  label(r, 'PSU2', 880, 220, { px: 16, color: '#cbd5e1' });
  const rearTex = canvasTexture(THREE, rc);
  const rearLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 5),
    new THREE.MeshBasicMaterial({ map: rearTex, transparent: true })
  );
  rearLabel.rotation.y = Math.PI;
  rearLabel.position.set(-4, 3.2, rearZ - 0.02);
  rearGroup.add(rearLabel);

  // ---------- internals ----------
  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(36, 0.25, 42), matPcb);
  mainPcb.position.set(-3, -2.8, -3);
  mainPcb.name = 'Vs_Mainboard';
  tag(mainPcb, '双路服务器主板', '支持双 Xeon、8 通道 DDR4、PCIe 4.0 与 RAID 卡。', 'BoxGeometry', 'FR-4');
  internalGroup.add(mainPcb);

  // 2 CPU heatsinks
  for (let c = 0; c < 2; c++) {
    const hx = -10 + c * 9;
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 7), matHeatsink);
    base.position.set(hx, -2.2, -2);
    internalGroup.add(base);
    const finGeo = new THREE.BoxGeometry(0.14, 2.2, 7);
    for (let i = 0; i < 12; i++) {
      const fin = new THREE.Mesh(finGeo, matHeatsink);
      fin.position.set(hx - 3.2 + i * 0.58, -0.9, -2);
      internalGroup.add(fin);
    }
  }

  // RAM sticks
  const ramGeo = new THREE.BoxGeometry(0.25, 1.4, 6);
  for (let b = 0; b < 2; b++) {
    for (let i = 0; i < 6; i++) {
      const ram = new THREE.Mesh(ramGeo, matBlack);
      ram.position.set(-17 + i * 0.7, -1.9, 4 + b * 7);
      internalGroup.add(ram);
    }
  }

  // RAID card
  const raid = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 8), matPcb);
  raid.position.set(6, -1.6, 4);
  internalGroup.add(raid);
  const raidChip = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 2.2), matHeatsink);
  raidChip.position.set(6, -1.3, 4);
  internalGroup.add(raidChip);

  // 8 × 2.5" drives in front
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const bx = -16.0 + col * 6.0;
      const by = 1.55 - row * 3.1;
      const drive = new THREE.Mesh(new THREE.BoxGeometry(7, 1.5, 10), matHdd);
      drive.position.set(bx, by, 24.5);
      drive.name = `Vs_Hdd_${row * 4 + col + 1}`;
      tag(drive, `2.5" 硬盘 ${row * 4 + col + 1}`, 'SAS/SATA 企业级固态/机械硬盘。', 'BoxGeometry', 'Aluminum');
      hddGroup.add(drive);
    }
  }
  // drive cage
  for (const cx of [-19.2, 6.8]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.6, 12), matHdd);
    plate.position.set(cx, 0, 24.5);
    hddGroup.add(plate);
  }

  // PSU cages at rear
  for (let i = 0; i < 2; i++) {
    const px = 12.5 + i * 7.2;
    const psu = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.6, 14), matPsu);
    psu.position.set(px, -1.8, -25);
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
