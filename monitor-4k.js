// monitor-4k.js — 27 寸 4K 安防监视器
// 三边窄边框、金属底座、4 分屏实时预览；后壳可透视看到主板/电源板/扬声器。
// 单位：厘米(cm)。屏幕 60×33.8，外框 62.2×36，front +Z，root 旋转 180°。
function buildMonitor4K(THREE) {
  const { roundedRectShape, roundedRectWithHole, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'SecurityMonitor4K';

  const shellGroup = new THREE.Group(); shellGroup.name = 'MonShellGroup';
  const panelGroup = new THREE.Group(); panelGroup.name = 'MonPanelGroup';
  const standGroup = new THREE.Group(); standGroup.name = 'MonStandGroup';
  const internalGroup = new THREE.Group(); internalGroup.name = 'MonInternalGroup';
  root.add(shellGroup, panelGroup, standGroup, internalGroup);

  // ---------- materials ----------
  const matBezel = mat(THREE, 'physical', 'MonBezelBlack', {
    color: 0x111317, metalness: 0.25, roughness: 0.42, clearcoat: 0.2,
  });
  const matBack = mat(THREE, 'physical', 'MonBackCover', {
    color: 0x1a1d22, metalness: 0.3, roughness: 0.5,
  });
  const matStand = mat(THREE, 'physical', 'MonStandMetal', {
    color: 0x6b737b, metalness: 0.8, roughness: 0.3,
  });
  const matBlack = mat(THREE, 'standard', 'MonBlackPlastic', {
    color: 0x0c0e11, metalness: 0.1, roughness: 0.65,
  });
  const matShield = mat(THREE, 'physical', 'MonNickel', {
    color: 0xc8d0d6, metalness: 0.9, roughness: 0.22,
  });
  const matPcb = mat(THREE, 'standard', 'MonPcbGreen', {
    color: 0x0b3d2a, metalness: 0.15, roughness: 0.6,
  });
  const matGold = mat(THREE, 'physical', 'MonGold', {
    color: 0xfbbf24, metalness: 0.95, roughness: 0.15,
  });
  const matSpeaker = mat(THREE, 'standard', 'MonSpeakerCone', {
    color: 0x1b1e22, roughness: 0.85,
  });

  // ---------- screen texture ----------
  const { c: sc, ctx: s } = canvas(1280, 720);
  s.fillStyle = '#05080c'; s.fillRect(0, 0, 1280, 720);
  const rgb = ['#22c55e', '#3b82f6', '#f59e0b', '#a78bfa'];
  const names = ['大门入口', '实验室走廊', '危化品库', '周界东侧'];
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 2; col++) {
      const gx = col * 640, gy = r * 360;
      const grd = s.createLinearGradient(gx, gy, gx + 640, gy + 360);
      grd.addColorStop(0, '#1a2430'); grd.addColorStop(0.6, '#0d141b'); grd.addColorStop(1, '#070b10');
      s.fillStyle = grd; s.fillRect(gx + 2, gy + 2, 636, 316);
      s.strokeStyle = 'rgba(56,189,248,0.45)'; s.lineWidth = 2;
      s.strokeRect(gx + 2, gy + 2, 636, 316);

      // 模拟场景：地面透视线 + 货架/门框
      s.strokeStyle = 'rgba(148,163,184,0.22)'; s.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        s.beginPath();
        s.moveTo(gx + 40 + k * 100, gy + 300);
        s.lineTo(gx + 300 + k * 20, gy + 150);
        s.stroke();
      }
      s.strokeStyle = 'rgba(148,163,184,0.35)';
      s.strokeRect(gx + 80, gy + 90, 90, 140);
      s.strokeRect(gx + 470, gy + 70, 100, 170);

      s.fillStyle = rgb[r * 2 + col];
      s.font = 'bold 22px "JetBrains Mono", monospace';
      s.fillText(`CH ${r * 2 + col + 1}`, gx + 18, gy + 34);
      s.fillStyle = 'rgba(226,232,240,0.9)';
      s.font = '16px Inter, Arial, sans-serif';
      s.fillText(names[r * 2 + col], gx + 90, gy + 34);
      s.fillStyle = '#ef4444';
      s.font = 'bold 16px "JetBrains Mono", monospace';
      s.fillText('● REC  4K', gx + 520, gy + 34);
    }
  }
  // 中央分隔线
  s.strokeStyle = 'rgba(56,189,248,0.6)'; s.lineWidth = 3;
  s.beginPath(); s.moveTo(640, 0); s.lineTo(640, 720); s.stroke();
  s.beginPath(); s.moveTo(0, 360); s.lineTo(1280, 360); s.stroke();
  // 底部状态条
  s.fillStyle = 'rgba(2,6,12,0.78)'; s.fillRect(0, 676, 1280, 44);
  s.fillStyle = '#38bdf8'; s.font = 'bold 18px "JetBrains Mono", monospace';
  s.fillText('2026-10-29  14:32:08', 24, 704);
  s.fillStyle = '#94a3b8'; s.font = '16px "JetBrains Mono", monospace';
  s.fillText('4-CH LIVE VIEW  ·  H.265+  ·  HDD 68%', 330, 704);
  s.fillStyle = '#22c55e'; s.font = 'bold 17px "JetBrains Mono", monospace';
  s.fillText('● ONLINE 128', 1010, 704);
  const screenTex = canvasTexture(THREE, sc);

  // ---------- front bezel ----------
  const SW = 60, SH = 33.8;          // screen
  const BW = 62.2, BH = 36;          // outer bezel
  const bezelShape = roundedRectWithHole(THREE, BW, BH, 0.8, SW, SH, 0.2);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 1.0, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3,
  });
  bezelGeo.translate(0, 0, -0.5);
  const bezel = new THREE.Mesh(bezelGeo, matBezel);
  bezel.position.z = 0.5;
  bezel.castShadow = true; bezel.receiveShadow = true;
  bezel.name = 'Mon_FrontBezel';
  tag(bezel, '三边窄边框', '62.2×36cm 黑色金属窄边框，屏占比约 96%。', 'ExtrudeGeometry + Hole', 'Aluminum');
  panelGroup.add(bezel);

  // screen
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(SW, SH),
    new THREE.MeshBasicMaterial({ name: 'MonScreenMat', map: screenTex })
  );
  screen.position.z = 0.08;
  screen.name = 'Mon_Screen';
  tag(screen, '27 寸 4K 液晶屏', '3840×2160 IPS 面板，4 分屏实时预览。', 'PlaneGeometry + CanvasTexture', 'IPS LCD');
  panelGroup.add(screen);

  // screen glass
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(SW - 0.2, SH - 0.2),
    new THREE.MeshPhysicalMaterial({
      name: 'MonScreenGlass', color: 0xffffff, transparent: true, opacity: 0.05,
      roughness: 0.08, clearcoat: 0.6,
    })
  );
  glass.position.z = 0.12;
  panelGroup.add(glass);

  // bottom bezel logo
  const { c: lc, ctx: lctx } = canvas(512, 96);
  lctx.fillStyle = '#111317'; lctx.fillRect(0, 0, 512, 96);
  label(lctx, 'HIKVISION', 24, 48, { px: 42, color: '#e5e7eb', mono: false });
  label(lctx, '4K UHD  ·  27"', 300, 52, { px: 18, color: '#6b7280' });
  const logoTex = canvasTexture(THREE, lc);
  const logoPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 2.0),
    new THREE.MeshStandardMaterial({ name: 'MonLogoPlate', map: logoTex, roughness: 0.5 })
  );
  logoPlate.position.set(0, -16.9, 1.06);
  panelGroup.add(logoPlate);

  // OSD buttons bottom-right
  for (let i = 0; i < 5; i++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14), matBlack);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(20 + i * 1.1, -16.7, 1.06);
    panelGroup.add(btn);
  }
  const pwrLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.0, roughness: 0.2 })
  );
  pwrLed.rotation.x = Math.PI / 2;
  pwrLed.position.set(26.8, -16.7, 1.06);
  panelGroup.add(pwrLed);

  // ---------- rear cover ----------
  const backShape = roundedRectShape(THREE, BW - 1.0, BH - 1.0, 0.7);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 3.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 3,
  });
  backGeo.translate(0, 0, -3.6);   // 向 -Z 方向拉伸，形成后壳
  const back = new THREE.Mesh(backGeo, matBack);
  back.position.set(0, 0, -0.5);
  back.castShadow = true;
  back.name = 'Mon_BackCover';
  tag(back, '后壳', '内置主板、电源板、扬声器与 VESA 安装孔。', 'ExtrudeGeometry', 'ABS + Steel');
  shellGroup.add(back);

  // VESA plate
  const vesa = new THREE.Mesh(new THREE.BoxGeometry(11, 11, 0.5), matShield);
  vesa.position.set(0, 0, -4.3);
  shellGroup.add(vesa);
  const holeGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 12);
  holeGeo.rotateX(Math.PI / 2);
  for (const vx of [-3.5, 3.5]) {
    for (const vy of [-3.5, 3.5]) {
      const h = new THREE.Mesh(holeGeo, matBlack);
      h.position.set(vx, vy, -4.3);
      shellGroup.add(h);
    }
  }

  // rear IO panel
  const ioPanel = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 0.3), matBlack);
  ioPanel.position.set(0, -12, -4.4);
  shellGroup.add(ioPanel);
  const ioDefs = [
    { x: -9.5, w: 2.2, h: 1.0, c: 0x0d0f12 },  // HDMI 1
    { x: -6.5, w: 2.2, h: 1.0, c: 0x0d0f12 },  // HDMI 2
    { x: -3.5, w: 2.4, h: 1.2, c: 0x1d4ed8 },  // DP
    { x: -0.5, w: 2.4, h: 1.2, c: 0x1d4ed8 },  // VGA
    { x: 3.0, w: 1.6, h: 0.8, c: 0x0d0f12 },   // audio
    { x: 6.0, w: 2.0, h: 1.2, c: 0x0d0f12 },   // USB
  ];
  for (const d of ioDefs) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.5), matShield);
    port.position.set(d.x, -12, -4.55);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(d.w - 0.4, d.h - 0.3, 0.55), new THREE.MeshBasicMaterial({ color: d.c }));
    inner.position.set(d.x, -12, -4.58);
    shellGroup.add(port, inner);
  }
  // power inlet
  const pwr = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.8), matBlack);
  pwr.position.set(9.5, -12, -4.5);
  shellGroup.add(pwr);

  // ---------- stand ----------
  const neck = new THREE.Mesh(new THREE.BoxGeometry(7, 18, 2.2), matStand);
  neck.position.set(0, -25, -2.2);
  neck.castShadow = true;
  neck.name = 'Mon_StandNeck';
  tag(neck, '金属支架颈', '支持 -5°~15° 俯仰调节。', 'BoxGeometry', 'Die-cast Aluminum');
  standGroup.add(neck);

  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 7.5, 20), matBlack);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, -16.8, -2.2);
  standGroup.add(hinge);

  const baseShape = roundedRectShape(THREE, 30, 20, 2.0);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: 1.1, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 3,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, matStand);
  base.position.set(0, -34, 0.5);
  base.castShadow = true; base.receiveShadow = true;
  base.name = 'Mon_StandBase';
  standGroup.add(base);

  // ---------- internals ----------
  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(28, 0.3, 16), matPcb);
  mainPcb.position.set(0, -1.5, -2.2);
  mainPcb.name = 'Mon_MainPcb';
  tag(mainPcb, '显示驱动主板', '4K 缩放芯片、HDMI/DP 接收器与背光控制。', 'BoxGeometry', 'FR-4');
  internalGroup.add(mainPcb);

  const pwrPcb = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 10), matPcb);
  pwrPcb.position.set(-8, -3.0, -2.2);
  pwrPcb.name = 'Mon_PowerPcb';
  tag(pwrPcb, '电源板', '内置 120W 开关电源，输出 19V/6A。', 'BoxGeometry', 'FR-4');
  internalGroup.add(pwrPcb);

  const icGeo = new THREE.BoxGeometry(2.2, 0.5, 2.2);
  for (let i = 0; i < 3; i++) {
    const ic = new THREE.Mesh(icGeo, matBlack);
    ic.position.set(-5 + i * 5, 0.2, -2.2);
    internalGroup.add(ic);
  }
  const capGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 14);
  for (let i = 0; i < 3; i++) {
    const cap = new THREE.Mesh(capGeo, matGold);
    cap.position.set(-15 + i * 2, -2.4, -2.2);
    internalGroup.add(cap);
  }

  // speakers left/right
  for (const sx of [-24, 24]) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 3), matSpeaker);
    sp.position.set(sx, 0, -2.4);
    internalGroup.add(sp);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 24), matBlack);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(sx, 0, -1.0);
    internalGroup.add(cone);
  }

  // T-con board at top
  const tcon = new THREE.Mesh(new THREE.BoxGeometry(22, 0.25, 5), matPcb);
  tcon.position.set(0, 15, -1.6);
  internalGroup.add(tcon);

  markShell(shellGroup);
  internalGroup.visible = false;   // 默认只看外观，点「查看内部」再显示

  root.rotation.y = Math.PI;
  root.userData = {
    groups: { shellGroup, panelGroup, standGroup, internalGroup },
    onShellToggle: (on) => {
      internalGroup.visible = !on;
      // 拆开后壳时把屏幕/玻璃一起隐藏，方便从正面看内部
      screen.visible = on;
      glass.visible = on;
    },
  };
  return root;
}
