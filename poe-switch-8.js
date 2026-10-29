// poe-switch-8.js — 8 口千兆 PoE+ + 2 口千兆 SFP 桌面型安防交换机
// 金属外壳、无风扇/低噪设计，前面板 8×RJ45 + 2×SFP，后置 AC 电源与接地。
// 单位：厘米(cm)。外形 28 × 4.4 × 18。
function buildPoeSwitch8(THREE) {
  const { roundedRectShape, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'PoeSwitch8';

  const baseGroup = new THREE.Group(); baseGroup.name = 'Sw8BaseGroup';
  const coverGroup = new THREE.Group(); coverGroup.name = 'Sw8CoverGroup';
  const frontGroup = new THREE.Group(); frontGroup.name = 'Sw8FrontGroup';
  const rearGroup = new THREE.Group(); rearGroup.name = 'Sw8RearGroup';
  const internalGroup = new THREE.Group(); internalGroup.name = 'Sw8InternalGroup';
  root.add(baseGroup, coverGroup, frontGroup, rearGroup, internalGroup);

  const W = 28, H = 4.4, D = 18;
  const hw = W / 2, hh = H / 2, hd = D / 2;
  const wall = 0.14;

  // ---------- materials ----------
  const matCase = mat(THREE, 'physical', 'Sw8CaseMetal', {
    color: 0x22262c, metalness: 0.75, roughness: 0.38, clearcoat: 0.15,
  });
  const matCover = mat(THREE, 'physical', 'Sw8CoverMetal', {
    color: 0x272c33, metalness: 0.75, roughness: 0.36, clearcoat: 0.18,
  });
  const matShield = mat(THREE, 'physical', 'Sw8ShieldNickel', {
    color: 0xc8d0d6, metalness: 0.9, roughness: 0.22,
  });
  const matBlack = mat(THREE, 'standard', 'Sw8BlackLcp', {
    color: 0x0e1014, metalness: 0.12, roughness: 0.62,
  });
  const matGold = mat(THREE, 'physical', 'Sw8GoldPin', {
    color: 0xfbbf24, metalness: 0.95, roughness: 0.14,
  });
  const matRubber = mat(THREE, 'standard', 'Sw8RubberFoot', {
    color: 0x0a0b0d, roughness: 0.9,
  });
  const matHeatsink = mat(THREE, 'physical', 'Sw8Heatsink', {
    color: 0x2a2f36, metalness: 0.85, roughness: 0.3,
  });
  const matPsu = mat(THREE, 'physical', 'Sw8PsuAlum', {
    color: 0x94a3b8, metalness: 0.85, roughness: 0.3,
  });
  const matPcb = mat(THREE, 'standard', 'Sw8PcbGreen', {
    color: 0x0b3d2a, metalness: 0.15, roughness: 0.6,
  });
  const matCopper = mat(THREE, 'physical', 'Sw8Copper', {
    color: 0xd97706, metalness: 0.9, roughness: 0.25,
  });

  // ---------- front silkscreen ----------
  const PW = W - 0.3, PH = H - 0.3;
  const CW = 2048, CH = Math.round(CW * PH / PW);
  const { c: fc, ctx: f } = canvas(CW, CH);
  const PX = x => (x / PW + 0.5) * CW;
  const PY = y => (0.5 - y / PH) * CH;

  const g = f.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, '#1b1f25'); g.addColorStop(0.5, '#23282f'); g.addColorStop(1, '#181c22');
  f.fillStyle = g; f.fillRect(0, 0, CW, CH);
  for (let y = 0; y < CH; y += 3) {
    f.strokeStyle = 'rgba(255,255,255,0.02)'; f.lineWidth = 1;
    f.beginPath(); f.moveTo(0, y); f.lineTo(CW, y); f.stroke();
  }
  f.fillStyle = '#dc2626'; f.fillRect(PX(-13.7), PY(2.0), PX(13.7) - PX(-13.7), 4);

  label(f, 'HIKVISION', PX(-13.5), PY(1.62), { px: 17, color: '#f8fafc', mono: false });
  label(f, 'DS-3E0109P-E', PX(-13.5), PY(1.30), { px: 10, color: '#94a3b8' });
  label(f, '8×GE PoE+  ·  2×GE SFP  ·  120W', PX(13.4), PY(1.62), { px: 9, color: '#94a3b8', align: 'right' });
  label(f, 'PoE+ 120W BUDGET', PX(13.4), PY(1.30), { px: 9, color: '#f59e0b', align: 'right' });

  // port numbers aligned with 3D ports
  for (let i = 0; i < 8; i++) {
    const x = -11 + i * 1.75;
    label(f, String(i + 1), PX(x), PY(0.58), { px: 18, color: '#cbd5e1', align: 'center' });
  }
  label(f, 'SFP1', PX(6.5), PY(0.58), { px: 11, color: '#38bdf8', align: 'center' });
  label(f, 'SFP2', PX(9.2), PY(0.58), { px: 11, color: '#38bdf8', align: 'center' });
  label(f, 'RESET', PX(12.4), PY(1.62), { px: 7, color: '#94a3b8', align: 'center' });
  const frontTex = canvasTexture(THREE, fc);
  const matFront = mat(THREE, 'standard', 'Sw8FrontSilk', { map: frontTex, roughness: 0.42, metalness: 0.35 });

  // ---------- U chassis ----------
  const uShape = new THREE.Shape();
  uShape.moveTo(-hw, hh - 0.1);
  uShape.lineTo(-hw, -hh + 0.1);
  uShape.quadraticCurveTo(-hw, -hh, -hw + 0.1, -hh);
  uShape.lineTo(hw - 0.1, -hh);
  uShape.quadraticCurveTo(hw, -hh, hw, -hh + 0.1);
  uShape.lineTo(hw, hh - 0.1);
  uShape.lineTo(hw - wall, hh - 0.1);
  uShape.lineTo(hw - wall, -hh + wall);
  uShape.lineTo(-hw + wall, -hh + wall);
  uShape.lineTo(-hw + wall, hh - 0.1);
  uShape.closePath();
  const uGeo = new THREE.ExtrudeGeometry(uShape, {
    depth: D - 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2,
  });
  uGeo.translate(0, 0, -(D - 0.3) / 2);
  const uBody = new THREE.Mesh(uGeo, matCase);
  uBody.name = 'Sw8_UChassis';
  uBody.castShadow = true; uBody.receiveShadow = true;
  tag(uBody, 'U 型金属下机壳', '0.8mm 冷轧钢板折弯，深灰喷塑，兼顾散热与 EMI 屏蔽。', 'Shape + ExtrudeGeometry', 'SECC');
  baseGroup.add(uBody);

  // rubber feet
  const footGeo = new THREE.CylinderGeometry(0.75, 0.65, 0.24, 18);
  for (const fx of [-hw + 3, hw - 3]) {
    for (const fz of [-hd + 3, hd - 3]) {
      const foot = new THREE.Mesh(footGeo, matRubber);
      foot.position.set(fx, -hh - 0.12, fz);
      baseGroup.add(foot);
    }
  }

  // ---------- top cover ----------
  const coverShape = roundedRectShape(THREE, W - 0.06, D - 0.24, 0.2);
  const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2,
  });
  coverGeo.rotateX(Math.PI / 2);
  const cover = new THREE.Mesh(coverGeo, matCover);
  cover.position.y = hh;
  cover.name = 'Sw8_TopCover';
  cover.castShadow = true;
  tag(cover, '可拆卸顶盖', '顶盖冲压散热格栅，支持「查看内部」透视。', 'Shape + ExtrudeGeometry', 'SECC');
  coverGroup.add(cover);

  // top vents
  const ventGeo = new THREE.BoxGeometry(10, 0.03, 0.22);
  for (let i = 0; i < 7; i++) {
    const vent = new THREE.Mesh(ventGeo, matBlack);
    vent.position.set(-4, hh + 0.07, -6 + i * 1.6);
    coverGroup.add(vent);
  }

  // ---------- front bezel + ports ----------
  const frontZ = hd;
  const bezelShape = roundedRectShape(THREE, W + 0.02, H + 0.02, 0.15);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2,
  });
  bezelGeo.translate(0, 0, -0.15);
  const bezel = new THREE.Mesh(bezelGeo, matCase);
  bezel.position.z = frontZ;
  frontGroup.add(bezel);

  const face = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), matFront);
  // 前面板倒角会再向外凸 0.03，丝印面必须再往前，否则会被壳体盖住
  face.position.set(0, 0, frontZ + 0.24);
  face.name = 'Sw8_FrontPanel';
  tag(face, '前面板丝印', '品牌、型号、端口编号与 PoE 功率标识。', 'PlaneGeometry + CanvasTexture', 'Silkscreen');
  frontGroup.add(face);

  // 8 RJ45 ports
  const portX = i => -11 + i * 1.75;
  for (let i = 0; i < 8; i++) {
    const x = portX(i);
    const cage = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.0, 1.3), matShield);
    cage.position.set(x, -0.55, frontZ - 0.1);
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.7, 1.36), matBlack);
    cavity.position.set(x, -0.55, frontZ + 0.02);
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 1.38), matBlack);
    latch.position.set(x, -0.92, frontZ + 0.02);
    frontGroup.add(cage, cavity, latch);

    for (let p = 0; p < 8; p++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.5), matGold);
      pin.position.set(x - 0.36 + p * 0.103, -0.4, frontZ + 0.18);
      frontGroup.add(pin);
    }

    // link + PoE LEDs
    const blink = new THREE.MeshStandardMaterial({
      color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.9, roughness: 0.2,
    });
    const poe = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8, roughness: 0.2,
    });
    const ledGeo = new THREE.BoxGeometry(0.2, 0.1, 0.08);
    const l1 = new THREE.Mesh(ledGeo, blink); l1.position.set(x - 0.36, 0.82, frontZ + 0.19);
    const l2 = new THREE.Mesh(ledGeo, poe); l2.position.set(x + 0.36, 0.82, frontZ + 0.19);
    frontGroup.add(l1, l2);
  }

  // 2 SFP cages
  for (const sx of [6.5, 9.2]) {
    const cage = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.95, 1.7), matShield);
    cage.position.set(sx, -0.55, frontZ - 0.15);
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.68, 1.75), matBlack);
    cavity.position.set(sx, -0.55, frontZ - 0.08);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.62, 0.3), matRubber);
    cap.position.set(sx, -0.55, frontZ + 0.3);
    frontGroup.add(cage, cavity, cap);
  }

  // reset pinhole
  const rst = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 10), matBlack);
  rst.rotation.x = Math.PI / 2;
  rst.position.set(12.4, -0.55, frontZ + 0.2);
  frontGroup.add(rst);

  // power LED
  const pwrLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.1, roughness: 0.2 })
  );
  pwrLed.rotation.x = Math.PI / 2;
  pwrLed.position.set(-13.2, -0.55, frontZ + 0.2);
  frontGroup.add(pwrLed);

  // ---------- rear panel ----------
  const rearZ = -hd;
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, H - 0.2), matCase);
  rear.rotation.y = Math.PI;
  rear.position.z = rearZ + 0.02;
  rearGroup.add(rear);

  // AC inlet
  const iec = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 0.8), matBlack);
  iec.position.set(-10, -0.5, rearZ + 0.1);
  const iecCav = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.45, 0.55), new THREE.MeshBasicMaterial({ color: 0x050608 }));
  iecCav.position.set(-10, -0.5, rearZ + 0.02);
  rearGroup.add(iec, iecCav);
  const bladeGeo = new THREE.BoxGeometry(0.12, 0.42, 0.55);
  for (const [bx, by] of [[-0.6, -0.2], [0.6, -0.2], [0, 0.3]]) {
    const blade = new THREE.Mesh(bladeGeo, matCopper);
    blade.position.set(-10 + bx, -0.5 + by, rearZ - 0.2);
    rearGroup.add(blade);
  }

  // ground stud
  const gnd = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.0, 16), matCopper);
  gnd.rotation.x = Math.PI / 2;
  gnd.position.set(-6, -1.2, rearZ - 0.45);
  rearGroup.add(gnd);

  // 40mm fan
  const fanGroup = new THREE.Group();
  fanGroup.position.set(7.5, -0.4, rearZ + 0.12);
  const fanFrame = new THREE.Mesh(new THREE.BoxGeometry(4.0, 4.0, 0.9), matBlack);
  fanFrame.position.z = 0.25;
  fanGroup.add(fanFrame);
  const fanTunnel = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 1.0, 24), new THREE.MeshBasicMaterial({ color: 0x06080c }));
  fanTunnel.rotation.x = Math.PI / 2;
  fanGroup.add(fanTunnel);
  const rotor = new THREE.Group();
  rotor.position.z = 0.15;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.55, 16), matBlack);
  hub.rotation.x = Math.PI / 2;
  rotor.add(hub);
  const fanBladeGeo = new THREE.BoxGeometry(1.0, 0.38, 0.06);
  for (let b = 0; b < 7; b++) {
    const bp = new THREE.Group();
    bp.rotation.z = (b / 7) * Math.PI * 2;
    const bm = new THREE.Mesh(fanBladeGeo, matBlack);
    bm.position.x = 1.05; bm.rotation.x = 0.5;
    bp.add(bm); rotor.add(bp);
  }
  fanGroup.add(rotor);
  for (const r of [0.7, 1.2, 1.62]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 8, 24), matShield);
    ring.position.z = -0.18;
    fanGroup.add(ring);
  }
  rearGroup.add(fanGroup);

  // rear vent slots
  const rvGeo = new THREE.BoxGeometry(0.18, 1.8, 0.04);
  for (let i = 0; i < 6; i++) {
    const rv = new THREE.Mesh(rvGeo, matBlack);
    rv.position.set(-2.5 + i * 1.1, -0.4, rearZ + 0.04);
    rearGroup.add(rv);
  }

  // ---------- internals ----------
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 14), matPcb);
  pcb.position.set(-1, -1.4, 0);
  pcb.name = 'Sw8_MainPcb';
  tag(pcb, '交换主板', '集成 8 口千兆交换 ASIC、PoE PSE 控制器与网络变压器。', 'BoxGeometry', 'FR-4');
  internalGroup.add(pcb);

  // 8 transformers behind ports
  const trGeo = new THREE.BoxGeometry(1.1, 0.7, 1.0);
  for (let i = 0; i < 8; i++) {
    const tr = new THREE.Mesh(trGeo, matBlack);
    tr.position.set(portX(i), -1.0, 4.2);
    internalGroup.add(tr);
  }

  // PoE controller heatsink
  const hs = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 4), matHeatsink);
  hs.position.set(-5, -1.1, -2.5);
  internalGroup.add(hs);
  const finGeo = new THREE.BoxGeometry(0.12, 1.2, 4);
  for (let i = 0; i < 12; i++) {
    const fin = new THREE.Mesh(finGeo, matHeatsink);
    fin.position.set(-8.2 + i * 0.58, -0.45, -2.5);
    internalGroup.add(fin);
  }

  // PSU
  const psu = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.4, 9), matPsu);
  psu.position.set(9, -1.0, 0);
  psu.name = 'Sw8_Psu';
  tag(psu, '120W 内置电源', '54V PoE 输出与 5V/3.3V 系统供电。', 'BoxGeometry', 'Galvanized Steel');
  internalGroup.add(psu);
  const capGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 14);
  for (let i = 0; i < 2; i++) {
    const cap = new THREE.Mesh(capGeo, matCopper);
    cap.position.set(7 + i * 1.6, 0.4, -2.6);
    internalGroup.add(cap);
  }

  markShell(coverGroup);
  markShell(baseGroup);
  internalGroup.visible = false;   // 默认只看外观，点「查看内部」再显示

  root.rotation.y = Math.PI;
  root.userData = {
    groups: { baseGroup, coverGroup, frontGroup, rearGroup, internalGroup },
    onShellToggle: (on) => { internalGroup.visible = !on; },
  };
  return root;
}
