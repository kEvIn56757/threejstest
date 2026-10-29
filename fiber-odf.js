// fiber-odf.js — 24 口 LC 双工光纤配线架（ODF）
// 19" 1U 机架式，2×12 LC 双工适配器、48 芯熔接盘、黄色单模尾纤与理线环。
// 单位：厘米(cm)。外形 44 × 4.4 × 30。front +Z，root 旋转 180°。
function buildFiberODF(THREE) {
  const { roundedRectShape, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'FiberODF24';

  const baseGroup = new THREE.Group(); baseGroup.name = 'OdfBaseGroup';
  const coverGroup = new THREE.Group(); coverGroup.name = 'OdfCoverGroup';
  const frontGroup = new THREE.Group(); frontGroup.name = 'OdfFrontGroup';
  const trayGroup = new THREE.Group(); trayGroup.name = 'OdfSpliceTrayGroup';
  const patchGroup = new THREE.Group(); patchGroup.name = 'OdfPatchCordsGroup';
  root.add(baseGroup, coverGroup, frontGroup, trayGroup, patchGroup);

  const W = 44, H = 4.4, D = 30;
  const hw = W / 2, hh = H / 2, hd = D / 2;
  const wall = 0.14;

  // ---------- materials ----------
  const matCase = mat(THREE, 'physical', 'OdfCaseMetal', {
    color: 0x23272d, metalness: 0.75, roughness: 0.38,
  });
  const matCover = mat(THREE, 'physical', 'OdfCoverMetal', {
    color: 0x282d34, metalness: 0.75, roughness: 0.36,
  });
  const matShield = mat(THREE, 'physical', 'OdfNickel', {
    color: 0xc8d0d6, metalness: 0.9, roughness: 0.22,
  });
  const matBlack = mat(THREE, 'standard', 'OdfBlackPlastic', {
    color: 0x0e1014, metalness: 0.1, roughness: 0.65,
  });
  const matBlue = mat(THREE, 'standard', 'OdfLcUpcBlue', {
    color: 0x1d4ed8, metalness: 0.1, roughness: 0.45,
  });
  const matGreen = mat(THREE, 'standard', 'OdfLcApcGreen', {
    color: 0x15803d, metalness: 0.1, roughness: 0.45,
  });
  const matFiber = mat(THREE, 'standard', 'OdfFiberYellow', {
    color: 0xfacc15, metalness: 0.05, roughness: 0.5,
  });
  const matRubber = mat(THREE, 'standard', 'OdfRubber', {
    color: 0x141619, roughness: 0.9,
  });
  const matGold = mat(THREE, 'physical', 'OdfGold', {
    color: 0xfbbf24, metalness: 0.95, roughness: 0.15,
  });

  // ---------- front silkscreen ----------
  const PW = W - 0.4, PH = H - 0.3;
  const CW = 2048, CH = Math.round(CW * PH / PW);
  const { c: fc, ctx: f } = canvas(CW, CH);
  const PX = x => (x / PW + 0.5) * CW;
  const PY = y => (0.5 - y / PH) * CH;

  const g = f.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, '#1c2026'); g.addColorStop(0.5, '#252a31'); g.addColorStop(1, '#191d23');
  f.fillStyle = g; f.fillRect(0, 0, CW, CH);
  for (let y = 0; y < CH; y += 3) {
    f.strokeStyle = 'rgba(255,255,255,0.022)'; f.lineWidth = 1;
    f.beginPath(); f.moveTo(0, y); f.lineTo(CW, y); f.stroke();
  }
  f.fillStyle = '#dc2626'; f.fillRect(PX(-21.6), PY(2.02), PX(21.6) - PX(-21.6), 4);

  label(f, 'HIKVISION', PX(-21.2), PY(1.55), { px: 15, color: '#f8fafc', mono: false });
  label(f, '24 PORT LC DUPLEX ODF', PX(-21.2), PY(1.15), { px: 9, color: '#94a3b8' });
  label(f, '48 FIBERS  ·  19" 1U  ·  SM/MM', PX(-21.2), PY(0.78), { px: 8, color: '#64748b' });
  label(f, '48F', PX(21.2), PY(1.55), { px: 13, color: '#38bdf8', align: 'right' });
  label(f, 'LC/UPC · LC/APC', PX(21.2), PY(1.15), { px: 8, color: '#94a3b8', align: 'right' });

  // adapter numbers: 2 rows × 12, aligned with 3D adapters
  const ax = i => -15.4 + i * 2.8;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 12; i++) {
      const n = row * 12 + i + 1;
      label(f, String(n).padStart(2, '0'), PX(ax(i)), PY(row === 0 ? 1.52 : 0.0), {
        px: 13, color: row === 0 ? '#cbd5e1' : '#94a3b8', align: 'center',
      });
    }
  }
  label(f, 'SPLICE TRAY  ·  24× HEAT-SHRINK PROTECTOR', PX(0), PY(-1.82), { px: 8, color: '#64748b', align: 'center' });

  const frontTex = canvasTexture(THREE, fc);
  const matFront = mat(THREE, 'standard', 'OdfFrontSilk', { map: frontTex, roughness: 0.42, metalness: 0.35 });

  // ---------- chassis ----------
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
  uBody.name = 'Odf_UChassis';
  uBody.castShadow = true; uBody.receiveShadow = true;
  tag(uBody, '1U U 型下机壳', '冷轧钢板折弯，前面板承托 24 个 LC 双工适配器。', 'Shape + ExtrudeGeometry', 'SECC');
  baseGroup.add(uBody);

  const coverShape = roundedRectShape(THREE, W - 0.06, D - 0.24, 0.2);
  const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2,
  });
  coverGeo.rotateX(Math.PI / 2);
  const cover = new THREE.Mesh(coverGeo, matCover);
  cover.position.y = hh;
  cover.name = 'Odf_TopCover';
  cover.castShadow = true;
  tag(cover, '可拆卸顶盖', '顶盖可拆，露出熔接盘与盘纤区。', 'Shape + ExtrudeGeometry', 'SECC');
  coverGroup.add(cover);

  // rack ears
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.24, H - 0.12, 5.5), matCase);
    ear.position.set(side * (hw + 0.12), 0, hd - 2.75);
    baseGroup.add(ear);
    const flange = new THREE.Mesh(new THREE.BoxGeometry(2.0, H - 0.12, 0.24), matCase);
    flange.position.set(side * (hw - 0.9), 0, hd - 0.12);
    baseGroup.add(flange);
    for (const sy of [-1.4, 1.4]) {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 10), matShield);
      sc.rotation.x = Math.PI / 2;
      sc.position.set(side * (hw - 0.9), sy, hd + 0.02);
      baseGroup.add(sc);
    }
  }

  // ---------- rear cable-entry panel ----------
  // 之前只做了 U 型下壳 + 顶盖，背面完全敞开，从后侧看就是一个空心盒子。
  // 这里补一块后封板 + 进缆橡胶护套 + 接地柱 + 固定螺钉 + 后部尾纤，
  // 让设备从任何角度都是闭合的；「查看内部」时后封板随 baseGroup 一起隐藏。
  const rearPanelZ = -hd + 0.11;
  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, H - 0.2, 0.18), matCase);
  rearPlate.position.set(0, 0, rearPanelZ);
  rearPlate.name = 'Odf_RearPanel';
  tag(rearPlate, '后封板与进缆区', '冷轧钢后封板，中央为 24 芯光缆进缆孔与加强芯固定区。', 'BoxGeometry', 'SECC');
  baseGroup.add(rearPlate);

  // 进缆橡胶护套（外部）
  const rearBoot = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.9, 24), matRubber);
  rearBoot.rotation.x = Math.PI / 2;
  rearBoot.position.set(0, -0.55, rearPanelZ - 0.45);
  baseGroup.add(rearBoot);
  const rearBootRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.16, 8, 28), matShield);
  rearBootRing.position.set(0, -0.55, rearPanelZ - 0.9);
  baseGroup.add(rearBootRing);

  // 加强芯固定夹
  const rearClamp = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.8, 1.3), matShield);
  rearClamp.position.set(0, -2.0, rearPanelZ - 1.6);
  tag(rearClamp, '光缆加强芯固定夹', '用于固定光缆芳纶纱/钢丝加强芯，避免纤芯受力。', 'BoxGeometry', 'Nickel-plated Steel');
  baseGroup.add(rearClamp);

  // 后部接地柱
  const rearGndWasher = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 18), matGold);
  rearGndWasher.rotation.x = Math.PI / 2;
  rearGndWasher.position.set(18.2, -1.2, rearPanelZ - 0.12);
  const rearGndStud = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 14), matGold);
  rearGndStud.rotation.x = Math.PI / 2;
  rearGndStud.position.set(18.2, -1.2, rearPanelZ - 0.6);
  baseGroup.add(rearGndWasher, rearGndStud);

  // 后封板四角螺钉
  const rearScrewGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10);
  rearScrewGeo.rotateX(Math.PI / 2);
  for (const sx of [-20.5, 20.5]) {
    for (const sy of [-1.7, 1.7]) {
      const sc = new THREE.Mesh(rearScrewGeo, matShield);
      sc.position.set(sx, sy, rearPanelZ - 0.1);
      baseGroup.add(sc);
    }
  }

  // 后部丝印铭牌（透明底，只印字；旋转 180° 面向后侧观察者）
  const { c: rc, ctx: rctx } = canvas(2048, 128);
  rctx.clearRect(0, 0, 2048, 128);
  label(rctx, '24F FIBER DISTRIBUTION FRAME', 42, 38, { px: 26, color: '#e2e8f0' });
  label(rctx, 'CABLE ENTRY  ·  48 FIBERS  ·  19" 1U', 42, 78, { px: 14, color: '#94a3b8' });
  label(rctx, 'GND', 42, 110, { px: 13, color: '#facc15' });
  label(rctx, 'ASSET: SEC-BLDG-A3-RACK02-ODF01', 1290, 110, { px: 12, color: '#64748b' });
  const rearLabelTex = canvasTexture(THREE, rc);
  const rearLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 2.2),
    new THREE.MeshBasicMaterial({ map: rearLabelTex, transparent: true })
  );
  rearLabel.rotation.y = Math.PI;
  rearLabel.position.set(0, 1.0, rearPanelZ - 0.12);
  baseGroup.add(rearLabel);

  // 后部进缆：一根黑色室外光缆从进缆护套引入，穿过加强芯固定夹后自然下垂。
  // 之前这里放了 6 根悬空的黄色尾纤，既没有接入点，也会和固定夹穿插，
  // 看起来像“接口歪了/断开”。改为单根进缆后，背面走线是连续的。
  const dropCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.55, rearPanelZ - 0.95),
    new THREE.Vector3(0, -1.35, rearPanelZ - 1.35),
    new THREE.Vector3(0, -2.0, rearPanelZ - 1.6),   // 穿过加强芯固定夹
    new THREE.Vector3(0.5, -3.0, rearPanelZ - 3.0),
    new THREE.Vector3(1.2, -4.2, rearPanelZ - 5.0),
  ]);
  const dropCable = new THREE.Mesh(new THREE.TubeGeometry(dropCurve, 40, 0.45, 12, false), matRubber);
  dropCable.name = 'Odf_IncomingCable';
  tag(dropCable, '室外单模光缆进缆', '一根黑色室外光缆从后部进缆护套引入，经加强芯固定夹固定后进入熔接盘。', 'TubeGeometry (Spline)', 'LSZH Outdoor Fiber Cable');
  baseGroup.add(dropCable);

  // 进缆口热缩护套
  const dropBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 1.6, 20), matRubber);
  dropBoot.rotation.x = Math.PI / 2;
  dropBoot.position.set(0, -0.8, rearPanelZ - 1.1);
  baseGroup.add(dropBoot);

  // 光缆标签扎带
  for (const t of [0.42, 0.78]) {
    const p = dropCurve.getPoint(t);
    const tan = dropCurve.getTangent(t).normalize();
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 6, 18), matShield);
    tie.position.copy(p);
    tie.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    baseGroup.add(tie);
  }

  // ---------- front panel ----------
  const frontZ = hd;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), matFront);
  face.position.set(0, 0, frontZ + 0.06);
  face.name = 'Odf_FrontPanel';
  tag(face, '前面板丝印', '品牌、端口编号、光纤类型与熔接盘标识。', 'PlaneGeometry + CanvasTexture', 'Silkscreen');
  frontGroup.add(face);

  // 24 LC duplex adapters (2 rows × 12)
  const adapterGeo = new THREE.BoxGeometry(1.15, 0.86, 1.35);
  const portGeo = new THREE.BoxGeometry(0.38, 0.3, 1.42);
  const portInnerGeo = new THREE.BoxGeometry(0.24, 0.18, 1.46);
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 12; i++) {
      const n = row * 12 + i + 1;
      const x = ax(i);
      const y = row === 0 ? 0.85 : -0.85;
      const adapter = new THREE.Mesh(adapterGeo, row === 0 ? matBlue : matGreen);
      adapter.position.set(x, y, frontZ - 0.35);
      adapter.name = `Odf_LcAdapter_${n}`;
      tag(adapter, `LC 双工适配器 #${n}`, '陶瓷套管 LC 双工法兰，蓝色 UPC / 绿色 APC。', 'BoxGeometry', 'PBT + Ceramic');
      frontGroup.add(adapter);

      for (const dx of [-0.25, 0.25]) {
        const port = new THREE.Mesh(portGeo, matShield);
        port.position.set(x + dx, y, frontZ + 0.35);
        const inner = new THREE.Mesh(portInnerGeo, matBlack);
        inner.position.set(x + dx, y, frontZ + 0.38);
        frontGroup.add(port, inner);
      }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), matRubber);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(x, y - 0.25, frontZ + 0.6);
      frontGroup.add(cap);
    }
  }

  // ---------- internal splice tray ----------
  const trayBase = new THREE.Mesh(new THREE.BoxGeometry(38, 0.35, 22), matShield);
  trayBase.position.set(0, -1.45, -0.5);
  trayBase.name = 'Odf_SpliceTray';
  tag(trayBase, '24 芯熔接盘', '可翻转熔接盘，容纳 24 个热缩保护管与盘纤。', 'BoxGeometry', 'ABS + Steel');
  trayGroup.add(trayBase);

  const trayCover = new THREE.Mesh(new THREE.BoxGeometry(34, 0.2, 18), matBlack);
  trayCover.position.set(0, -1.2, -0.5);
  trayGroup.add(trayCover);

  // coiled fibers on tray
  for (let c = 0; c < 4; c++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(5.5 + c * 0.6, 0.12, 8, 40), matFiber);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(-7 + c * 1.0, -1.0, -2.5);
    trayGroup.add(coil);
  }

  // heat-shrink protectors
  const hsGeo = new THREE.CylinderGeometry(0.11, 0.11, 3.2, 8);
  hsGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 12; i++) {
    const hs = new THREE.Mesh(hsGeo, matBlack);
    hs.position.set(-11 + i * 1.6, -0.98, 2.8);
    trayGroup.add(hs);
  }

  // adapter mounting plate (behind front panel)
  const mount = new THREE.Mesh(new THREE.BoxGeometry(40, 3.6, 0.25), matCase);
  mount.position.set(0, 0, frontZ - 1.2);
  frontGroup.add(mount);

  // rear cable entry + strength member clamp
  const rearZ = -hd;
  const grommet = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.6, 20), matRubber);
  grommet.rotation.x = Math.PI / 2;
  grommet.position.set(-8, -0.9, rearZ + 0.2);
  trayGroup.add(grommet);

  const clamp = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 1.2), matShield);
  clamp.position.set(-8, -1.6, rearZ + 1.4);
  trayGroup.add(clamp);

  // ---------- front patch cords ----------
  // 尾纤必须从真实的 LC 端口位置引出：之前用一组与适配器不对应的 x 坐标，
  // 看起来像悬空/断开的“网线接口”。这里按适配器中心 ±0.25 的端口坐标布线，
  // 并在端口处补上 LC 连接器与黄色尾套，保证视觉上是插好的。
  const patchPlan = [
    { i: 0, row: 0, dx: -0.25 },
    { i: 3, row: 0, dx: 0.25 },
    { i: 6, row: 0, dx: -0.25 },
    { i: 9, row: 0, dx: 0.25 },
    { i: 1, row: 1, dx: -0.25 },
    { i: 4, row: 1, dx: 0.25 },
    { i: 7, row: 1, dx: -0.25 },
    { i: 10, row: 1, dx: 0.25 },
  ];

  patchPlan.forEach((p, idx) => {
    const x = ax(p.i) + p.dx;
    const y0 = p.row === 0 ? 0.85 : -0.85;

    // LC 连接器本体（插在适配器端口上）
    const lcBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.6),
      p.row === 0 ? matBlue : matGreen
    );
    lcBody.position.set(x, y0, frontZ + 1.0);
    lcBody.name = `Odf_LcPlug_${idx + 1}`;
    tag(lcBody, `LC 单芯连接器 ${idx + 1}`, '插在 LC 双工适配器端口的 LC/UPC 连接器。', 'BoxGeometry', 'PBT + Ceramic Ferrule');
    patchGroup.add(lcBody);

    // 黄色尾纤护套
    const lcBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.55, 10), matFiber);
    lcBoot.rotation.x = Math.PI / 2;
    lcBoot.position.set(x, y0, frontZ + 1.45);
    patchGroup.add(lcBoot);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, y0, frontZ + 1.68),
      new THREE.Vector3(x, y0 - 0.35, frontZ + 2.6),
      new THREE.Vector3(x + 0.5, y0 - 1.3, frontZ + 3.8),
      new THREE.Vector3(x + 1.1, -2.35, frontZ + 4.7),
    ]);
    const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.09, 8, false), matFiber);
    cord.name = `Odf_PatchCord_${idx + 1}`;
    patchGroup.add(cord);
  });

  // front horizontal cable management bar + rings
  const bar = new THREE.Mesh(new THREE.BoxGeometry(34, 0.35, 0.35), matShield);
  bar.position.set(0, -1.85, frontZ + 2.2);
  patchGroup.add(bar);
  for (const rx of [-12, -4, 4, 12]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 8, 20), matShield);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(rx, -1.85, frontZ + 2.2);
    patchGroup.add(ring);
  }

  markShell(coverGroup);
  markShell(baseGroup);
  trayGroup.visible = false;   // 默认只看外观，点「查看内部」再显示熔接盘

  root.rotation.y = Math.PI;
  root.userData = {
    groups: { baseGroup, coverGroup, frontGroup, trayGroup, patchGroup },
    onShellToggle: (on) => { trayGroup.visible = !on; },
  };
  return root;
}
