// ip-intercom.js — IP 网络可视对讲终端（门口机）
// 壁挂式 20×30cm 面板：7 寸屏、摄像头、扬声器、呼叫按键、RFID 刷卡区。
// 单位：厘米(cm)。front +Z，root 旋转 180°。
function buildIPIntercom(THREE) {
  const { roundedRectShape, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'IPVideoIntercom';

  const shellGroup = new THREE.Group(); shellGroup.name = 'IcShellGroup';
  const frontGroup = new THREE.Group(); frontGroup.name = 'IcFrontGroup';
  const internalGroup = new THREE.Group(); internalGroup.name = 'IcInternalGroup';
  root.add(shellGroup, frontGroup, internalGroup);

  const W = 20, H = 30, D = 3.5;
  const hw = W / 2, hh = H / 2;

  // ---------- materials ----------
  const matBody = mat(THREE, 'physical', 'IcBodyAluminum', {
    color: 0x2a2f36, metalness: 0.65, roughness: 0.35, clearcoat: 0.2,
  });
  const matGlass = mat(THREE, 'physical', 'IcFrontGlass', {
    color: 0x0b0f14, metalness: 0.2, roughness: 0.08, clearcoat: 1.0,
  });
  const matBlack = mat(THREE, 'standard', 'IcBlackPlastic', {
    color: 0x0a0c0f, metalness: 0.1, roughness: 0.7,
  });
  const matShield = mat(THREE, 'physical', 'IcNickel', {
    color: 0xc8d0d6, metalness: 0.9, roughness: 0.22,
  });
  const matGreen = mat(THREE, 'physical', 'IcCallGreen', {
    color: 0x16a34a, metalness: 0.2, roughness: 0.35, clearcoat: 0.5,
    emissive: 0x052e16, emissiveIntensity: 0.6,
  });
  const matLens = mat(THREE, 'physical', 'IcCameraLens', {
    color: 0x06111c, metalness: 0.4, roughness: 0.03, clearcoat: 1.0,
  });
  const matPcb = mat(THREE, 'standard', 'IcPcbGreen', {
    color: 0x0b3d2a, metalness: 0.15, roughness: 0.6,
  });
  const matGold = mat(THREE, 'physical', 'IcGold', {
    color: 0xfbbf24, metalness: 0.95, roughness: 0.15,
  });
  const matSpeaker = mat(THREE, 'standard', 'IcSpeaker', {
    color: 0x1b1e22, roughness: 0.85,
  });

  // ---------- front screen texture ----------
  const { c: sc, ctx: s } = canvas(640, 360);
  s.fillStyle = '#07101a'; s.fillRect(0, 0, 640, 360);
  const grad = s.createLinearGradient(0, 0, 640, 360);
  grad.addColorStop(0, '#102033'); grad.addColorStop(1, '#050a10');
  s.fillStyle = grad; s.fillRect(0, 0, 640, 360);
  s.strokeStyle = 'rgba(56,189,248,0.5)'; s.lineWidth = 3;
  s.strokeRect(8, 8, 624, 344);
  label(s, '访客呼叫  VISITOR CALL', 26, 38, { px: 20, color: '#38bdf8' });
  label(s, '2026-10-29  14:32', 612, 38, { px: 14, color: '#94a3b8', align: 'right' });
  // video preview area
  s.fillStyle = '#0a141e'; s.fillRect(24, 60, 380, 240);
  s.strokeStyle = 'rgba(56,189,248,0.3)'; s.lineWidth = 1; s.strokeRect(24, 60, 380, 240);
  // simple visitor silhouette
  s.fillStyle = '#1e293b';
  s.beginPath(); s.arc(214, 140, 42, 0, Math.PI * 2); s.fill();
  s.beginPath();
  s.moveTo(130, 300); s.quadraticCurveTo(150, 200, 214, 200);
  s.quadraticCurveTo(278, 200, 298, 300); s.closePath(); s.fill();
  s.fillStyle = '#334155';
  s.beginPath(); s.arc(214, 130, 30, 0, Math.PI * 2); s.fill();
  label(s, '● LIVE', 36, 82, { px: 14, color: '#ef4444' });
  label(s, '主入口 · 门口机', 36, 286, { px: 13, color: '#94a3b8' });
  // call targets
  const targets = [['物业中心', '#22c55e'], ['保安室', '#3b82f6'], ['监控中心', '#f59e0b']];
  targets.forEach((t, i) => {
    const y = 64 + i * 76;
    s.fillStyle = '#0d1826'; s.fillRect(424, y, 190, 62);
    s.strokeStyle = t[1]; s.lineWidth = 2; s.strokeRect(424, y, 190, 62);
    label(s, t[0], 444, y + 38, { px: 18, color: '#e2e8f0' });
  });
  label(s, '请按绿色呼叫键', 424, 314, { px: 14, color: '#94a3b8' });
  const screenTex = canvasTexture(THREE, sc);

  // ---------- wall plate + body ----------
  const plate = new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, H - 0.4, 0.6), matShield);
  plate.position.z = -D / 2 + 0.3;
  plate.name = 'Ic_WallPlate';
  tag(plate, '壁挂底板', '镀锌钢壁挂底板，四角 M6 防盗螺钉固定。', 'BoxGeometry', 'Steel');
  shellGroup.add(plate);

  const bodyShape = roundedRectShape(THREE, W, H, 1.0);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: D - 0.8, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3,
  });
  bodyGeo.translate(0, 0, -(D - 0.8) / 2);
  const body = new THREE.Mesh(bodyGeo, matBody);
  body.position.z = 0;
  body.castShadow = true; body.receiveShadow = true;
  body.name = 'Ic_Body';
  tag(body, '铝合金机身', '20×30cm 压铸铝机身，深灰阳极氧化，IP65 防水。', 'ExtrudeGeometry', 'Die-cast Aluminum');
  shellGroup.add(body);

  // front glass
  const glassShape = roundedRectShape(THREE, W - 1.2, H - 1.2, 0.8);
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.25, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2,
  });
  const frontGlass = new THREE.Mesh(glassGeo, matGlass);
  frontGlass.position.z = D / 2 - 0.5;
  frontGlass.name = 'Ic_FrontGlass';
  tag(frontGlass, '前面板玻璃', '黑色钢化玻璃面板，集成屏幕、摄像头与刷卡区。', 'ExtrudeGeometry', 'Tempered Glass');
  shellGroup.add(frontGlass);

  // 4 tamper screws
  const screwGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 12);
  screwGeo.rotateX(Math.PI / 2);
  for (const sx of [-8.4, 8.4]) {
    for (const sy of [-13.4, 13.4]) {
      const sc = new THREE.Mesh(screwGeo, matShield);
      sc.position.set(sx, sy, D / 2 - 0.35);
      shellGroup.add(sc);
    }
  }

  // ---------- screen ----------
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(13.6, 7.65),
    new THREE.MeshBasicMaterial({ name: 'IcScreenMat', map: screenTex })
  );
  screen.position.set(0, 6.2, D / 2 - 0.22);
  screen.name = 'Ic_Screen';
  tag(screen, '7 寸触摸屏', '显示访客视频、呼叫目标与物业信息。', 'PlaneGeometry + CanvasTexture', 'IPS Touch LCD');
  frontGroup.add(screen);
  const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(14.4, 8.45, 0.3), matBlack);
  screenBezel.position.set(0, 6.2, D / 2 - 0.4);
  frontGroup.add(screenBezel);

  // ---------- camera ----------
  const camHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.5, 20), matShield);
  camHousing.rotation.x = Math.PI / 2;
  camHousing.position.set(0, 12.6, D / 2 - 0.25);
  const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 20), matLens);
  camLens.rotation.x = Math.PI / 2;
  camLens.position.set(0, 12.6, D / 2 - 0.05);
  frontGroup.add(camHousing, camLens);
  // IR LEDs
  for (const dx of [-1.4, 1.4]) {
    const ir = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10),
      new THREE.MeshStandardMaterial({ color: 0x3a0a0a, emissive: 0x7f1d1d, emissiveIntensity: 0.5, roughness: 0.25 })
    );
    ir.rotation.x = Math.PI / 2;
    ir.position.set(dx, 12.6, D / 2 - 0.06);
    frontGroup.add(ir);
  }

  // ---------- speaker grille ----------
  const grille = new THREE.Mesh(new THREE.BoxGeometry(11, 3.2, 0.25), matBlack);
  grille.position.set(0, 0.6, D / 2 - 0.35);
  frontGroup.add(grille);
  const holeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8);
  holeGeo.rotateX(Math.PI / 2);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 14; c++) {
      const hole = new THREE.Mesh(holeGeo, matShield);
      hole.position.set(-5 + c * 0.77, -0.6 + r * 0.8, D / 2 - 0.2);
      frontGroup.add(hole);
    }
  }

  // ---------- call button ----------
  const callRing = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.18, 12, 36), matShield);
  callRing.position.set(0, -5.8, D / 2 - 0.28);
  const callBtn = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.35, 36), matGreen);
  callBtn.rotation.x = Math.PI / 2;
  callBtn.position.set(0, -5.8, D / 2 - 0.18);
  callBtn.name = 'Ic_CallButton';
  tag(callBtn, '绿色呼叫按键', '一键呼叫物业/保安/监控中心，带背光与盲文标识。', 'CylinderGeometry', 'PC + LED');
  frontGroup.add(callRing, callBtn);

  // ---------- RFID area + logo ----------
  const rfid = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), matBlack);
  rfid.position.set(0, -10.6, D / 2 - 0.22);
  frontGroup.add(rfid);

  const { c: lc, ctx: lctx } = canvas(512, 128);
  lctx.fillStyle = '#0b0f14'; lctx.fillRect(0, 0, 512, 128);
  label(lctx, 'HIKVISION', 24, 52, { px: 40, color: '#e5e7eb', mono: false });
  label(lctx, 'IP VIDEO INTERCOM  ·  DS-KD8003', 24, 92, { px: 14, color: '#6b7280' });
  const logoTex = canvasTexture(THREE, lc);
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 2.25),
    new THREE.MeshBasicMaterial({ map: logoTex, transparent: false })
  );
  logo.position.set(0, -13.0, D / 2 - 0.22);
  frontGroup.add(logo);

  // mic hole
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8), matBlack);
  mic.rotation.x = Math.PI / 2;
  mic.position.set(0, -14.3, D / 2 - 0.2);
  frontGroup.add(mic);

  // ---------- internal modules ----------
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 20), matPcb);
  pcb.position.set(0, 0, -0.5);
  pcb.name = 'Ic_MainPcb';
  tag(pcb, '主控板', '集成网络解码、音频功放、继电器与 PoE 受电。', 'BoxGeometry', 'FR-4');
  internalGroup.add(pcb);

  const speaker = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.2, 28), matSpeaker);
  speaker.rotation.x = Math.PI / 2;
  speaker.position.set(0, 0.6, -1.4);
  tag(speaker, '8Ω 3W 扬声器', '免提对讲扬声器。', 'CylinderGeometry', 'Mylar');
  internalGroup.add(speaker);

  const cameraMod = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.0, 2.0), matBlack);
  cameraMod.position.set(0, 12.6, 0.2);
  internalGroup.add(cameraMod);
  const camPcb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.4), matPcb);
  camPcb.position.set(0, 12.6, 1.2);
  internalGroup.add(camPcb);

  const micMod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 10), matBlack);
  micMod.rotation.x = Math.PI / 2;
  micMod.position.set(0, -14.3, 0.6);
  internalGroup.add(micMod);

  // rear terminals
  const poe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.2), matShield);
  poe.position.set(-6, -11, -1.7);
  const relay = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.1, 0.9), matBlack);
  relay.position.set(0, -11, -1.7);
  for (let t = 0; t < 6; t++) {
    const term = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.35), matGold);
    term.position.set(-2 + t * 0.55, -11, -2.1);
    internalGroup.add(term);
  }
  internalGroup.add(poe, relay);

  markShell(shellGroup);
  internalGroup.visible = false;

  root.rotation.y = Math.PI;
  root.userData = {
    groups: { shellGroup, frontGroup, internalGroup },
    onShellToggle: (on) => { internalGroup.visible = !on; },
  };
  return root;
}
