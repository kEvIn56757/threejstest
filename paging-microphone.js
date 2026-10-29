// paging-microphone.js — 网络寻呼话筒（桌面式 IP 广播控制台）
// 桌面底座 + 3.5 寸屏 + 数字键盘 + 分区键 + PTT + 鹅颈麦克风。
// 单位：厘米(cm)。底座 24×18×5，鹅颈高约 22。front +Z，root 旋转 180°。
function buildPagingMicrophone(THREE) {
  const { roundedRectShape, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'NetworkPagingMicrophone';

  const shellGroup = new THREE.Group(); shellGroup.name = 'PmShellGroup';
  const frontGroup = new THREE.Group(); frontGroup.name = 'PmFrontGroup';
  const topGroup = new THREE.Group(); topGroup.name = 'PmTopGroup';
  const micGroup = new THREE.Group(); micGroup.name = 'PmMicGroup';
  const internalGroup = new THREE.Group(); internalGroup.name = 'PmInternalGroup';
  root.add(shellGroup, frontGroup, topGroup, micGroup, internalGroup);

  const W = 24, D = 18, H = 5;
  const hw = W / 2, hd = D / 2, hh = H / 2;

  // ---------- materials ----------
  const matBase = mat(THREE, 'physical', 'PmBaseDark', {
    color: 0x22262c, metalness: 0.35, roughness: 0.45, clearcoat: 0.2,
  });
  const matTop = mat(THREE, 'physical', 'PmTopPanel', {
    color: 0x2b3037, metalness: 0.4, roughness: 0.4, clearcoat: 0.25,
  });
  const matBlack = mat(THREE, 'standard', 'PmBlackPlastic', {
    color: 0x0b0d10, metalness: 0.1, roughness: 0.68,
  });
  const matShield = mat(THREE, 'physical', 'PmNickel', {
    color: 0xc8d0d6, metalness: 0.9, roughness: 0.22,
  });
  const matKey = mat(THREE, 'standard', 'PmKeyGray', {
    color: 0xb9c0c6, metalness: 0.1, roughness: 0.55,
  });
  const matPtt = mat(THREE, 'physical', 'PmPttGreen', {
    color: 0x16a34a, metalness: 0.2, roughness: 0.35, clearcoat: 0.5,
    emissive: 0x052e16, emissiveIntensity: 0.5,
  });
  const matGoose = mat(THREE, 'physical', 'PmGooseneckMetal', {
    color: 0x4b5158, metalness: 0.85, roughness: 0.35,
  });
  const matMic = mat(THREE, 'standard', 'PmMicBlack', {
    color: 0x101215, metalness: 0.2, roughness: 0.6,
  });
  const matPcb = mat(THREE, 'standard', 'PmPcbGreen', {
    color: 0x0b3d2a, metalness: 0.15, roughness: 0.6,
  });
  const matGold = mat(THREE, 'physical', 'PmGold', {
    color: 0xfbbf24, metalness: 0.95, roughness: 0.15,
  });
  const matSpeaker = mat(THREE, 'standard', 'PmSpeaker', {
    color: 0x1b1e22, roughness: 0.85,
  });

  // ---------- screen texture ----------
  const { c: sc, ctx: s } = canvas(640, 360);
  s.fillStyle = '#07101a'; s.fillRect(0, 0, 640, 360);
  const grad = s.createLinearGradient(0, 0, 640, 360);
  grad.addColorStop(0, '#102033'); grad.addColorStop(1, '#050a10');
  s.fillStyle = grad; s.fillRect(0, 0, 640, 360);
  s.strokeStyle = 'rgba(56,189,248,0.5)'; s.lineWidth = 3; s.strokeRect(8, 8, 624, 344);
  label(s, 'NETWORK PAGING', 26, 38, { px: 22, color: '#38bdf8' });
  label(s, 'DS-QA6P', 612, 38, { px: 14, color: '#94a3b8', align: 'right' });
  label(s, '分区广播  ·  全部在线', 26, 78, { px: 16, color: '#e2e8f0' });
  const zones = [
    ['01  大门入口', '#22c55e'], ['02  实验楼走廊', '#22c55e'],
    ['03  危化品库', '#f59e0b'], ['04  周界东侧', '#22c55e'],
    ['05  停车场', '#94a3b8'], ['06  全员广播', '#38bdf8'],
  ];
  zones.forEach((z, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 26 + col * 300, y = 100 + row * 66;
    s.fillStyle = '#0d1826'; s.fillRect(x, y, 284, 54);
    s.strokeStyle = 'rgba(56,189,248,0.3)'; s.lineWidth = 1; s.strokeRect(x, y, 284, 54);
    s.fillStyle = z[1];
    s.beginPath(); s.arc(x + 18, y + 27, 6, 0, Math.PI * 2); s.fill();
    label(s, z[0], x + 34, y + 28, { px: 16, color: '#e2e8f0' });
  });
  s.fillStyle = '#0d1826'; s.fillRect(26, 306, 588, 34);
  label(s, 'PTT: IDLE   ·   VOL 72%   ·   14:32:08', 40, 324, { px: 14, color: '#94a3b8' });
  const screenTex = canvasTexture(THREE, sc);

  // ---------- base ----------
  const baseShape = roundedRectShape(THREE, W, D, 1.2);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: H, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 4,
  });
  baseGeo.translate(0, 0, -H / 2);
  baseGeo.rotateX(-Math.PI / 2);   // 厚度方向转为 Y
  const base = new THREE.Mesh(baseGeo, matBase);
  base.castShadow = true; base.receiveShadow = true;
  base.name = 'Pm_Base';
  tag(base, '桌面控制台底座', '24×18×5cm 压铸铝底座，底部防滑脚垫。', 'ExtrudeGeometry', 'Die-cast Aluminum');
  shellGroup.add(base);

  // top panel
  const topShape = roundedRectShape(THREE, W - 1.2, D - 1.2, 0.9);
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: 0.25, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2,
  });
  topGeo.translate(0, 0, -0.125);
  topGeo.rotateX(-Math.PI / 2);
  const top = new THREE.Mesh(topGeo, matTop);
  top.position.y = hh;
  top.name = 'Pm_TopPanel';
  shellGroup.add(top);

  // rubber feet
  const footGeo = new THREE.CylinderGeometry(0.7, 0.6, 0.25, 16);
  for (const fx of [-hw + 3, hw - 3]) {
    for (const fz of [-hd + 3, hd - 3]) {
      const foot = new THREE.Mesh(footGeo, matBlack);
      foot.position.set(fx, -hh - 0.12, fz);
      shellGroup.add(foot);
    }
  }

  // ---------- front LCD + PTT + zone keys ----------
  const frontZ = hd;
  const lcdHousing = new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.4, 0.6), matBlack);
  lcdHousing.position.set(-6.6, 0.3, frontZ + 0.15);
  const lcdScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 4.0),
    new THREE.MeshBasicMaterial({ name: 'PmScreenMat', map: screenTex })
  );
  lcdScreen.position.set(-6.6, 0.3, frontZ + 0.48);
  const lcdGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 4.2),
    new THREE.MeshPhysicalMaterial({
      name: 'PmScreenGlass', color: 0xffffff, transparent: true, opacity: 0.06,
      roughness: 0.1, clearcoat: 0.5,
    })
  );
  lcdGlass.position.set(-6.6, 0.3, frontZ + 0.5);
  tag(lcdScreen, '3.5 寸寻呼屏', '显示分区状态、音量与 PTT 状态。', 'PlaneGeometry + CanvasTexture', 'IPS LCD');
  frontGroup.add(lcdHousing, lcdScreen, lcdGlass);

  // PTT button
  const pttRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.15, 10, 32), matShield);
  pttRing.position.set(8.0, -0.7, frontZ + 0.3);
  const ptt = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.4, 32), matPtt);
  ptt.rotation.x = Math.PI / 2;
  ptt.position.set(8.0, -0.7, frontZ + 0.45);
  ptt.name = 'Pm_PttButton';
  tag(ptt, 'PTT 按下发言键', '按下后向选定分区广播，松开结束。', 'CylinderGeometry', 'PC + LED');
  frontGroup.add(pttRing, ptt);

  // zone keys (6) above PTT
  const zoneTex = (n) => {
    const { c, ctx } = canvas(64, 64);
    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 0, 64, 64);
    label(ctx, `Z${n}`, 32, 34, { px: 22, color: '#1f2937', align: 'center', mono: false });
    return canvasTexture(THREE, c);
  };
  for (let i = 0; i < 6; i++) {
    const zx = 1.0 + (i % 3) * 2.1;
    const zy = 1.7 - Math.floor(i / 3) * 1.5;
    const key = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.35), matKey);
    key.position.set(zx, zy, frontZ + 0.32);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.85),
      new THREE.MeshBasicMaterial({ map: zoneTex(i + 1) })
    );
    face.position.set(zx, zy, frontZ + 0.51);
    frontGroup.add(key, face);
  }

  // ---------- top keypad ----------
  const keySide = matKey;
  function keyTexture(txt) {
    const { c, ctx } = canvas(64, 64);
    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 0, 64, 64);
    label(ctx, txt, 32, 35, { px: 28, color: '#1f2937', align: 'center', mono: false });
    return canvasTexture(THREE, c);
  }
  const keyLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const kx = -9.0 + c * 1.9;
      const kz = -2.4 + r * 1.9;
      const tex = keyTexture(keyLabels[idx]);
      const topMat = new THREE.MeshBasicMaterial({ map: tex });
      const mats = [keySide, keySide, topMat, keySide, keySide, keySide];
      const key = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.6), mats);
      key.position.set(kx, hh + 0.35, kz);
      topGroup.add(key);
    }
  }

  // volume knob
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.7, 30), matShield);
  knob.position.set(7.2, hh + 0.45, -4.2);
  knob.name = 'Pm_VolumeKnob';
  const knobMark = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.9), matBlack);
  knobMark.position.set(7.2, hh + 0.82, -4.2);
  topGroup.add(knob, knobMark);

  // status LEDs
  for (let i = 0; i < 4; i++) {
    const led = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10),
      new THREE.MeshStandardMaterial({
        color: [0x22c55e, 0x3b82f6, 0xf59e0b, 0xef4444][i],
        emissive: [0x22c55e, 0x3b82f6, 0xf59e0b, 0xef4444][i],
        emissiveIntensity: 0.8, roughness: 0.2,
      })
    );
    led.position.set(7.2, hh + 0.2, 2.0 - i * 1.2);
    topGroup.add(led);
  }

  // ---------- gooseneck microphone ----------
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9.0, hh, -6.0),
    new THREE.Vector3(-9.0, hh + 6.0, -6.0),
    new THREE.Vector3(-9.0, hh + 12.0, -3.5),
    new THREE.Vector3(-8.5, hh + 16.5, 1.0),
    new THREE.Vector3(-8.0, hh + 18.5, 5.0),
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.32, 10, false), matGoose);
  tube.name = 'Pm_Gooseneck';
  tag(tube, '鹅颈麦克风软管', '30cm 金属软管，可任意弯折定位。', 'TubeGeometry (Spline)', 'Stainless Steel');
  micGroup.add(tube);

  // flexible ribs
  for (let i = 1; i < 22; i++) {
    const t = i / 22;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 6, 14), matBlack);
    ring.position.copy(p);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    micGroup.add(ring);
  }

  // mic capsule
  const end = curve.getPoint(1);
  const endTan = curve.getTangent(1).normalize();
  const capsule = new THREE.Group();
  capsule.position.copy(end);
  capsule.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endTan);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.75, 2.6, 24), matMic);
  head.position.y = 1.2;
  const grille = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 16), matBlack);
  grille.position.y = 2.5;
  grille.scale.y = 0.7;
  const ringCap = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 24), matShield);
  ringCap.rotation.x = Math.PI / 2;
  ringCap.position.y = 2.15;
  capsule.add(head, grille, ringCap);
  micGroup.add(capsule);

  // base connector
  const gooseneckBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.0, 24), matShield);
  gooseneckBase.position.set(-9.0, hh + 0.4, -6.0);
  micGroup.add(gooseneckBase);

  // ---------- rear connectors ----------
  const rearZ = -hd;
  const poe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.8), matShield);
  poe.position.set(-6, -1.0, rearZ + 0.1);
  const dc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16), matBlack);
  dc.rotation.x = Math.PI / 2;
  dc.position.set(-3.5, -1.0, rearZ - 0.05);
  const audio = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.6), matBlack);
  audio.position.set(0, -1.0, rearZ + 0.1);
  const usb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5), matShield);
  usb.position.set(3.0, -1.0, rearZ + 0.05);
  internalGroup.add(poe, dc, audio, usb);

  // ---------- internals ----------
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(18, 0.25, 12), matPcb);
  pcb.position.set(0, -1.2, 0);
  pcb.name = 'Pm_MainPcb';
  tag(pcb, '寻呼控制主板', '网络音频解码、分区控制、PTT 与麦克风前置放大。', 'BoxGeometry', 'FR-4');
  internalGroup.add(pcb);

  const speaker = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.0, 24), matSpeaker);
  speaker.rotation.x = Math.PI / 2;
  speaker.position.set(6.0, -0.8, 4.0);
  internalGroup.add(speaker);

  const micPre = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 3), matPcb);
  micPre.position.set(-8.5, -0.8, -4.5);
  internalGroup.add(micPre);
  const ic = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), matBlack);
  ic.position.set(-8.5, -0.5, -4.5);
  internalGroup.add(ic);

  markShell(shellGroup);
  internalGroup.visible = false;

  root.rotation.y = Math.PI;
  root.userData = {
    groups: { shellGroup, frontGroup, topGroup, micGroup, internalGroup },
    onShellToggle: (on) => { internalGroup.visible = !on; },
  };
  return root;
}
