// nvr.js — 4 盘位网络视频录像机 (NVR) 程序化模型
// 视频安防系统中的 NVR：机架式 2U 金属机箱，4 个 SATA 硬盘热插拔盘位，
// 前置 5 寸预览液晶与状态指示灯，后置 HDMI/VGA/USB/网口/报警端子/电源。
// 单位：厘米(cm)。外形 44(宽 X) × 8.8(高 Y) × 40(深 Z)。
// 朝向：前面板朝 +Z，侧面 ±X，后面板 −Z；root 最终绕 Y 转 180° 让正面朝向观察者。
// 支持「查看内部」：顶盖 + U 型下机壳标为 shell，隐藏后露出主板/硬盘/电源/散热器。

function nvrApplyColorSpace(tex, THREE) {
  if (!tex) return tex;
  if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function nvrRoundedRectShape(THREE, w, h, r) {
  const shape = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  const cr = Math.min(r, hw, hh);
  shape.moveTo(-hw + cr, -hh);
  shape.lineTo(hw - cr, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  shape.lineTo(hw, hh - cr);
  shape.quadraticCurveTo(hw, hh, hw - cr, hh);
  shape.lineTo(-hw + cr, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  shape.lineTo(-hw, -hh + cr);
  shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  return shape;
}

function createFrontPanelTexture(THREE) {
  // 画布比例必须与面板平面一致(43.6 × 8.4 cm),否则文字会被横向/纵向拉伸,
  // 而且文字坐标要和 3D 硬件位置对得上,所以统一用「模型局部厘米」换算像素。
  const PLANE_W = 43.6, PLANE_H = 8.4;
  const CW = 2048, CH = Math.round(CW * PLANE_H / PLANE_W);   // ≈ 395
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  const PX = x => (x / PLANE_W + 0.5) * CW;
  const PY = y => (0.5 - y / PLANE_H) * CH;

  // 深灰拉丝底
  const grad = ctx.createLinearGradient(0, 0, CW, CH);
  grad.addColorStop(0, '#1f2329'); grad.addColorStop(0.5, '#252a31'); grad.addColorStop(1, '#1b1f24');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, CW, CH);

  // 细拉丝纹理
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
  for (let y = 0; y < CH; y += 3) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
  }

  // 顶部安防红装饰条
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(PX(-21.8), PY(4.16), PX(21.8) - PX(-21.8), 5);

  const text = (str, x, y, opt) => {
    const o = opt || {};
    ctx.save();
    ctx.font = (o.weight || 'bold') + ' ' + (o.px || 14) + 'px ' +
      (o.mono === false ? 'Inter, Arial, sans-serif' : '"JetBrains Mono", monospace');
    ctx.fillStyle = o.color || '#cbd5e1';
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, PX(x), PY(y));
    ctx.restore();
  };

  // —— 顶部品牌带(y > 3.15,硬件最高只到 3.1,不会压字) ——
  text('HIKVISION', -21.6, 3.70, { px: 30, color: '#f8fafc', mono: false });
  text('DS-7732NI-K4  ·  32-CH NVR  ·  4×SATA', -17.2, 3.68, { px: 14, color: '#94a3b8' });
  text('4K H.265+  ·  PoE 8-port  ·  2U Rack', 21.6, 3.68, { px: 13, color: '#94a3b8', align: 'right' });

  // —— 左侧状态灯标签(与 3D LED 同坐标: x=-20.6, y=2.2-i*0.52) ——
  const ledNames = ['PWR', 'SYS', 'NET', 'ALM', 'HDD1', 'HDD2', 'HDD3', 'HDD4'];
  ledNames.forEach((lbl, i) => {
    text(lbl, -19.9, 2.2 - i * 0.52, { px: 9, color: '#94a3b8' });
  });
  text('USB 3.0', -17.2, -2.32, { px: 8, color: '#0ea5e9', align: 'center' });

  // —— 底部资产铭牌(y < -3.8,电源/USB 最低到 -3.7) ——
  text('CE · FCC · RoHS · 100-240V~ 50/60Hz 4.0A MAX · ASSET: SEC-BLDG-A3-RACK02-NVR01',
    0, -4.00, { px: 10, color: '#64748b', align: 'center' });

  const tex = new THREE.CanvasTexture(canvas);
  return nvrApplyColorSpace(tex, THREE);
}

function createRearPanelTexture(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#181c24'; ctx.fillRect(0, 0, 2048, 512);

  const X = wx => (0.5 - wx / 44) * canvas.width;   // 世界 X -> 画布 (镜像)
  const Y = wy => (0.5 - wy / 8.8) * canvas.height;
  const label = (text, wx, wy, opt) => {
    const o = opt || {};
    ctx.save();
    ctx.font = (o.weight || 'bold') + ' ' + (o.px || 13) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = o.color || '#cbd5e1';
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, X(wx), Y(wy));
    ctx.restore();
  };

  // 端口区标签
  label('HDMI 1 (MAIN)', -18.5, 2.6, { px: 12, color: '#e2e8f0' });
  label('HDMI 2 (SPOT)', -14.0, 2.6, { px: 12, color: '#e2e8f0' });
  label('VGA', -9.5, 2.6, { px: 12, color: '#e2e8f0' });
  label('USB 2.0 ×2', -5.0, 2.6, { px: 12, color: '#e2e8f0' });
  label('RJ45 LAN1 (PoE)', 0.5, 2.6, { px: 12, color: '#38bdf8' });
  label('RJ45 LAN2', 5.0, 2.6, { px: 12, color: '#38bdf8' });
  label('eSATA', 9.0, 2.6, { px: 12, color: '#f59e0b' });
  label('AUDIO IN/OUT', 13.5, 2.6, { px: 12, color: '#a78bfa' });
  label('ALARM I/O (16 in / 4 out)', 18.5, 2.6, { px: 11, color: '#ef4444' });

  // 下排硬件(电源/开关/风扇)上方留有一条空带,标签放这里,避免压在硬件上
  label('AC INPUT  100-240V~  4.0A', -17.0, -0.95, { px: 13, color: '#e2e8f0' });
  label('POWER', -12.5, -0.95, { px: 13, color: '#e2e8f0' });
  label('EXHAUST FAN ×2', -4.0, -0.95, { px: 13, color: '#94a3b8' });
  label('SERIAL: NS202610290011A', 6.0, -0.95, { px: 12, color: '#94a3b8' });
  label('6kV SURGE PROT.', 13.0, -0.95, { px: 12, color: '#facc15' });

  // 接地符号
  const gx = X(18.5), gy = Y(-0.2);
  ctx.save();
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = Math.max(2, 44 / 44 * 2);
  ctx.lineCap = 'round';
  [[0.3, -0.12], [0.2, 0.12], [0.1, 0.34]].forEach(([half, dy]) => {
    const y0 = gy + dy * (canvas.height / 8.8);
    ctx.beginPath();
    ctx.moveTo(gx - half * (canvas.width / 44), y0);
    ctx.lineTo(gx + half * (canvas.width / 44), y0);
    ctx.stroke();
  });
  ctx.restore();
  label('GND', 20.2, -0.2, { px: 12, color: '#facc15' });

  const tex = new THREE.CanvasTexture(canvas);
  return nvrApplyColorSpace(tex, THREE);
}

function createLcdTexture(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#05080e'; ctx.fillRect(0, 0, 640, 360);
  // 4 grid
  const chColors = ['#22c55e', '#3b82f6', '#f59e0b', '#a78bfa'];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const gx = c * 320, gy = r * 180;
      ctx.fillStyle = '#0a1018'; ctx.fillRect(gx + 2, gy + 2, 316, 176);
      // 模拟画面：渐变 + 噪点
      const g = ctx.createLinearGradient(gx, gy, gx + 316, gy + 176);
      g.addColorStop(0, 'rgba(30,40,55,0.6)'); g.addColorStop(1, 'rgba(10,14,20,0.9)');
      ctx.fillStyle = g; ctx.fillRect(gx + 2, gy + 2, 316, 176);
      ctx.strokeStyle = 'rgba(56,189,248,0.4)'; ctx.lineWidth = 1;
      ctx.strokeRect(gx + 2, gy + 2, 316, 176);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`CH ${r * 2 + c + 1}`, gx + 10, gy + 20);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('● REC  25fps  4K', gx + 200, gy + 20);
      // 简单"场景"几何：几条线模拟画面内容
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(gx + 20, gy + 60 + i * 30);
        ctx.lineTo(gx + 290, gy + 50 + i * 25);
        ctx.stroke();
      }
    }
  }
  // 中央十字分割线
  ctx.strokeStyle = 'rgba(56,189,248,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(320, 0); ctx.lineTo(320, 360); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 180); ctx.lineTo(640, 180); ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  return nvrApplyColorSpace(tex, THREE);
}

function buildNVR(THREE) {
  const root = new THREE.Group();
  root.name = 'NVR_4Bay';

  // Sub-groups
  const chassisBaseGroup = new THREE.Group(); chassisBaseGroup.name = 'ChassisBaseGroup';
  const topCoverGroup = new THREE.Group(); topCoverGroup.name = 'TopCoverGroup';
  const frontPanelGroup = new THREE.Group(); frontPanelGroup.name = 'FrontPanelGroup';
  const rearPanelGroup = new THREE.Group(); rearPanelGroup.name = 'RearPanelGroup';
  const rackEarsGroup = new THREE.Group(); rackEarsGroup.name = 'RackEarsGroup';
  const internalsGroup = new THREE.Group(); internalsGroup.name = 'InternalsGroup';
  const hddGroup = new THREE.Group(); hddGroup.name = 'HddGroup';
  root.add(chassisBaseGroup, topCoverGroup, frontPanelGroup, rearPanelGroup, rackEarsGroup, internalsGroup, hddGroup);

  // Materials
  const matChassis = new THREE.MeshPhysicalMaterial({ name: 'ChassisPowderCoatMat', color: 0x1a1d22, metalness: 0.7, roughness: 0.45, clearcoat: 0.12 });
  const matTopCover = new THREE.MeshPhysicalMaterial({ name: 'TopCoverMat', color: 0x1e2228, metalness: 0.7, roughness: 0.42, clearcoat: 0.14 });
  const matRackEar = new THREE.MeshPhysicalMaterial({ name: 'RackEarSteelMat', color: 0x16191e, metalness: 0.8, roughness: 0.38 });
  const matFrontBezel = new THREE.MeshPhysicalMaterial({ name: 'FrontBezelMat', color: 0x14171c, metalness: 0.55, roughness: 0.4 });
  const matBlackPlastic = new THREE.MeshStandardMaterial({ name: 'BlackPlasticMat', color: 0x0f1114, roughness: 0.7, metalness: 0.1 });
  const matShield = new THREE.MeshPhysicalMaterial({ name: 'ShieldNickelMat', color: 0xcbd5e1, metalness: 0.9, roughness: 0.22 });
  const matGold = new THREE.MeshPhysicalMaterial({ name: 'GoldContactMat', color: 0xfbbf24, metalness: 0.95, roughness: 0.15 });
  const matCopper = new THREE.MeshPhysicalMaterial({ name: 'CopperBrassMat', color: 0xd97706, metalness: 0.9, roughness: 0.25 });
  const matRubber = new THREE.MeshStandardMaterial({ name: 'RubberMat', color: 0x0a0b0d, roughness: 0.9 });
  const matHeatsink = new THREE.MeshPhysicalMaterial({ name: 'HeatsinkAlumMat', color: 0x2a2f36, metalness: 0.85, roughness: 0.3 });
  const matPcb = new THREE.MeshStandardMaterial({ name: 'PcbMat', color: 0x0b3d2a, roughness: 0.6, metalness: 0.15 });
  const matHdd = new THREE.MeshPhysicalMaterial({ name: 'HddCaseMat', color: 0x2a2e34, metalness: 0.6, roughness: 0.45 });
  const matHddLabel = new THREE.MeshStandardMaterial({ name: 'HddLabelMat', color: 0x94a3b8, roughness: 0.5 });
  const matPsu = new THREE.MeshPhysicalMaterial({ name: 'PsuAlumMat', color: 0x94a3b8, metalness: 0.85, roughness: 0.32 });
  const matGlass = new THREE.MeshPhysicalMaterial({ name: 'LcdGlassMat', color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.12, clearcoat: 0.5 });

  // Dimensions (cm)
  const W = 44.0, H = 8.8, D = 40.0;
  const wallT = 0.16;
  const hw = W / 2, hh = H / 2, hd = D / 2;

  function tagPart(mesh, title, desc, geoName, matName) {
    mesh.userData = Object.assign(mesh.userData || {}, { partTitle: title, partDesc: desc, geoType: geoName, matType: matName });
    return mesh;
  }

  // -----------------------------------------------------------------------
  // 1. U-CHASSIS BODY
  // -----------------------------------------------------------------------
  const uShape = new THREE.Shape();
  uShape.moveTo(-hw, hh - 0.12);
  uShape.lineTo(-hw, -hh + 0.1);
  uShape.quadraticCurveTo(-hw, -hh, -hw + 0.1, -hh);
  uShape.lineTo(hw - 0.1, -hh);
  uShape.quadraticCurveTo(hw, -hh, hw, -hh + 0.1);
  uShape.lineTo(hw, hh - 0.12);
  uShape.lineTo(hw - wallT, hh - 0.12);
  uShape.lineTo(hw - wallT, -hh + wallT);
  uShape.lineTo(-hw + wallT, -hh + wallT);
  uShape.lineTo(-hw + wallT, hh - 0.12);
  uShape.closePath();
  const uExtrude = new THREE.ExtrudeGeometry(uShape, { depth: D - 0.4, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  uExtrude.translate(0, 0, -(D - 0.4) / 2);
  const uChassis = new THREE.Mesh(uExtrude, matChassis);
  uChassis.name = 'Chassis_UBody';
  uChassis.castShadow = true; uChassis.receiveShadow = true;
  tagPart(uChassis, '2U 钢制 U 型下机壳', '冷轧钢板折弯 U 型下机壳，表面深灰静电粉末烤漆，提供结构刚性与 EMI 屏蔽。', 'Shape+ExtrudeGeometry', 'PowderCoat');
  chassisBaseGroup.add(uChassis);

  // 4 橡胶脚垫
  const footGeo = new THREE.CylinderGeometry(0.9, 0.8, 0.28, 20);
  [[-hw + 4, -hh - 0.14, D / 2 - 4], [hw - 4, -hh - 0.14, D / 2 - 4],
   [-hw + 4, -hh - 0.14, -D / 2 + 4], [hw - 4, -hh - 0.14, -D / 2 + 4]].forEach((fc, i) => {
    const foot = new THREE.Mesh(footGeo, matRubber);
    foot.position.set(fc[0], fc[1], fc[2]);
    foot.name = `RubberFoot_${i + 1}`;
    chassisBaseGroup.add(foot);
  });

  // -----------------------------------------------------------------------
  // 2. TOP COVER (shell)
  // -----------------------------------------------------------------------
  const topShape = nvrRoundedRectShape(THREE, W - 0.1, D - 0.3, 0.22);
  const topExtrude = new THREE.ExtrudeGeometry(topShape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  topExtrude.rotateX(Math.PI / 2);
  const topCover = new THREE.Mesh(topExtrude, matTopCover);
  topCover.position.set(0, hh, 0);
  topCover.name = 'TopCover_Lid';
  topCover.castShadow = true; topCover.receiveShadow = true;
  tagPart(topCover, '可拆卸顶盖板', '顶盖带冲孔散热格栅与加强筋，支持透视/爆炸拆解查看内部。', 'Shape+ExtrudeGeometry', 'PowderCoat');
  topCoverGroup.add(topCover);

  // 顶盖加强筋
  const ribGeo = new THREE.BoxGeometry(12, 0.05, 0.4);
  for (let r = -1; r <= 1; r += 2) {
    for (let z = -10; z <= 10; z += 10) {
      const rib = new THREE.Mesh(ribGeo, matTopCover);
      rib.position.set(r * 12, hh + 0.03, z);
      topCoverGroup.add(rib);
    }
  }

  // -----------------------------------------------------------------------
  // 3. RACK EARS
  // -----------------------------------------------------------------------
  const screwHeadGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12);
  screwHeadGeo.rotateZ(Math.PI / 2);
  for (let side of [-1, 1]) {
    const earGroup = new THREE.Group();
    earGroup.name = side < 0 ? 'RackEar_Left' : 'RackEar_Right';
    const sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, H - 0.12, 6), matRackEar);
    sidePlate.position.set(side * (hw + 0.12), 0, D / 2 - 3.2);
    tagPart(sidePlate, '19 英寸机柜挂耳侧板', '冷轧钢折弯挂耳侧板。', 'BoxGeometry', 'HeavySteel');
    earGroup.add(sidePlate);

    const flangeShape = new THREE.Shape();
    const fw = 2.0, fh = H - 0.12;
    flangeShape.moveTo(0, -fh / 2);
    flangeShape.lineTo(fw - 0.18, -fh / 2);
    flangeShape.quadraticCurveTo(fw, -fh / 2, fw, -fh / 2 + 0.18);
    flangeShape.lineTo(fw, fh / 2 - 0.18);
    flangeShape.quadraticCurveTo(fw, fh / 2, fw - 0.18, fh / 2);
    flangeShape.lineTo(0, fh / 2);
    flangeShape.closePath();
    for (let hy of [-1.6, 1.6]) {
      const hole = new THREE.Path();
      hole.absellipse(1.0, hy, 0.4, 0.24, 0, Math.PI * 2, false, 0);
      flangeShape.holes.push(hole);
    }
    const flangeGeo = new THREE.ExtrudeGeometry(flangeShape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    const flange = new THREE.Mesh(flangeGeo, matRackEar);
    if (side < 0) { flange.rotation.y = Math.PI; flange.position.set(-hw, 0, D / 2 - 0.12); }
    else { flange.position.set(hw, 0, D / 2 - 0.36); }
    earGroup.add(flange);

    for (let sz of [D / 2 - 1.2, D / 2 - 3.0, D / 2 - 4.8]) {
      for (let sy of [-1.0, 1.0]) {
        const sc = new THREE.Mesh(screwHeadGeo, matShield);
        sc.position.set(side * (hw + 0.26), sy, sz);
        earGroup.add(sc);
      }
    }
    rackEarsGroup.add(earGroup);
  }

  // -----------------------------------------------------------------------
  // 4. FRONT PANEL
  // -----------------------------------------------------------------------
  const frontZ = D / 2;
  const frontBezelShape = nvrRoundedRectShape(THREE, W + 0.04, H + 0.02, 0.18);
  const frontBezelGeo = new THREE.ExtrudeGeometry(frontBezelShape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
  frontBezelGeo.translate(0, 0, -0.18);
  const frontBezel = new THREE.Mesh(frontBezelGeo, matFrontBezel);
  frontBezel.position.set(0, 0, frontZ);
  frontBezel.name = 'FrontBezel';
  frontBezel.castShadow = true;
  tagPart(frontBezel, '前面板装饰边框', '带倒角的铝合金/工程塑胶前面板总成。', 'ExtrudeGeometry', 'FrontBezel');
  frontPanelGroup.add(frontBezel);

  // 丝印面板
  const frontSilkTex = createFrontPanelTexture(THREE);
  const frontSilkMat = new THREE.MeshStandardMaterial({ name: 'FrontSilkscreenMat', map: frontSilkTex, roughness: 0.38, metalness: 0.35 });
  const faceplate = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, H - 0.4), frontSilkMat);
  faceplate.position.set(0, 0, frontZ + 0.22);
  faceplate.name = 'FrontPanel_Silkscreen';
  tagPart(faceplate, '前面板 2K 丝印', 'Canvas 生成的前面板丝印：品牌/型号/状态灯/USB/电源/硬盘盘位/LCD 预览区。', 'PlaneGeometry+CanvasTexture', 'Silkscreen');
  frontPanelGroup.add(faceplate);

  // 电源按钮(深色按钮 + 绿色指示灯环,避免与 USB 口重叠)
  const pwrRing = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.16, 24), matShield);
  pwrRing.rotation.x = Math.PI / 2;
  pwrRing.position.set(-19.8, -2.5, frontZ + 0.28);
  const pwrBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.22, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1d22, emissive: 0x0b3d1f, emissiveIntensity: 0.5, roughness: 0.35 })
  );
  pwrBtn.rotation.x = Math.PI / 2;
  pwrBtn.position.set(-19.8, -2.5, frontZ + 0.36);
  pwrBtn.name = 'PowerButton';
  const pwrLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.2, roughness: 0.2 })
  );
  pwrLed.rotation.x = Math.PI / 2;
  pwrLed.position.set(-19.8, -2.5, frontZ + 0.48);
  frontPanelGroup.add(pwrRing, pwrBtn, pwrLed);

  // 状态 LED 点
  const ledColors = [0x22c55e, 0x3b82f6, 0x06b6d4, 0xef4444, 0xf59e0b, 0xf59e0b, 0xf59e0b, 0xf59e0b];
  ledColors.forEach((col, i) => {
    const led = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.0, roughness: 0.2 }));
    led.rotation.x = Math.PI / 2;
    led.position.set(-20.6, 2.2 - i * 0.52, frontZ + 0.28);
    led.name = `StatusLED_${i + 1}`;
    frontPanelGroup.add(led);
  });

  // USB 3.0 口
  const usbHousing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.6), matShield);
  usbHousing.position.set(-17.2, -3.0, frontZ + 0.12);
  const usbHole = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.7), matBlackPlastic);
  usbHole.position.set(-17.2, -3.0, frontZ + 0.28);
  frontPanelGroup.add(usbHousing, usbHole);

  // 前置 5 寸 LCD 预览屏
  const lcdTex = createLcdTexture(THREE);
  const lcdHousing = new THREE.Mesh(new THREE.BoxGeometry(9.0, 5.4, 0.5), matBlackPlastic);
  lcdHousing.position.set(-6.5, -0.3, frontZ + 0.18);
  const lcdScreenMat = new THREE.MeshBasicMaterial({ name: 'LcdPreviewMat', map: lcdTex });
  const lcdScreen = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 4.6), lcdScreenMat);  // 16:9
  lcdScreen.position.set(-6.5, -0.3, frontZ + 0.46);
  const lcdGlass = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.8), matGlass);
  lcdGlass.position.set(-6.5, -0.3, frontZ + 0.48);
  tagPart(lcdScreen, '前置 5 寸预览液晶', '实时 4 分屏预览画面，Canvas 生成模拟画面。', 'PlaneGeometry+CanvasTexture', 'LCD');
  frontPanelGroup.add(lcdHousing, lcdScreen, lcdGlass);

  // 4 个硬盘热插拔盘位
  const bayW = 9.2, bayH = 2.4;
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const bx = 6.2 + col * 10.2;
    const by = 1.9 - row * 3.0;
    const bayFrame = new THREE.Mesh(new THREE.BoxGeometry(bayW, bayH, 0.6), matShield);
    bayFrame.position.set(bx, by, frontZ + 0.18);
    const bayDoor = new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.4, bayH - 0.4, 0.25), matBlackPlastic);
    bayDoor.position.set(bx, by, frontZ + 0.55);
    const bayHandle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.35), matShield);
    bayHandle.position.set(bx + bayW / 2 - 0.6, by, frontZ + 0.72);
    const bayLed = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.0, roughness: 0.2 }));
    bayLed.rotation.x = Math.PI / 2;
    bayLed.position.set(bx - bayW / 2 + 0.5, by + bayH / 2 - 0.4, frontZ + 0.72);
    tagPart(bayDoor, `HDD ${i + 1} 热插拔盘位门`, '3.5 英寸 SATA 硬盘热插拔托架与锁扣把手。', 'BoxGeometry', 'Hot-Swap Tray');
    frontPanelGroup.add(bayFrame, bayDoor, bayHandle, bayLed);
  }

  // -----------------------------------------------------------------------
  // 5. REAR PANEL
  // -----------------------------------------------------------------------
  const rearZ = -D / 2;
  const rearSilkTex = createRearPanelTexture(THREE);
  const rearPlateMat = new THREE.MeshStandardMaterial({ name: 'RearPanelSilkscreenMat', map: rearSilkTex, roughness: 0.45, metalness: 0.65 });
  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(W - 0.16, H - 0.16, 0.22), rearPlateMat);
  rearPlate.position.set(0, 0, rearZ + 0.11);
  rearPlate.name = 'RearPanel_MainPlate';
  tagPart(rearPlate, '后面板总成', '集成 HDMI/VGA/USB/RJ45/eSATA/音频/报警/电源/风扇/接地。', 'BoxGeometry+CanvasTexture', 'RearPanel');
  rearPanelGroup.add(rearPlate);

  // HDMI ×2
  for (let i = 0; i < 2; i++) {
    const hx = -18.5 + i * 4.5;
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.9), matShield);
    housing.position.set(hx, 1.6, rearZ + 0.22);
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.95), matBlackPlastic);
    cavity.position.set(hx, 1.6, rearZ + 0.18);
    rearPanelGroup.add(housing, cavity);
  }
  // VGA
  const vgaHousing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.9), matShield);
  vgaHousing.position.set(-9.5, 1.6, rearZ + 0.22);
  const vgaCavity = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.95), matBlackPlastic);
  vgaCavity.position.set(-9.5, 1.6, rearZ + 0.18);
  rearPanelGroup.add(vgaHousing, vgaCavity);

  // USB ×2
  for (let i = 0; i < 2; i++) {
    const ux = -5.0 + i * 2.2;
    const uh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.6), matShield);
    uh.position.set(ux, 1.6, rearZ + 0.18);
    const uhole = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), matBlackPlastic);
    uhole.position.set(ux, 1.6, rearZ + 0.28);
    rearPanelGroup.add(uh, uhole);
  }
  // RJ45 ×2
  for (let i = 0; i < 2; i++) {
    const rx = 0.5 + i * 4.5;
    const rh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 1.4), matShield);
    rh.position.set(rx, 1.6, rearZ - 0.2);
    const rc = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.65, 1.45), matBlackPlastic);
    rc.position.set(rx, 1.6, rearZ - 0.12);
    rearPanelGroup.add(rh, rc);
    // 8 金针
    for (let p = 0; p < 8; p++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.5), matGold);
      pin.position.set(rx - 0.35 + p * 0.1, 1.85, rearZ + 0.1);
      rearPanelGroup.add(pin);
    }
  }
  // eSATA
  const esataH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.0), matShield);
  esataH.position.set(9.0, 1.6, rearZ + 0.18);
  const esataC = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.05), matBlackPlastic);
  esataC.position.set(9.0, 1.6, rearZ + 0.22);
  rearPanelGroup.add(esataH, esataC);

  // Audio
  const audioH = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.8), matShield);
  audioH.position.set(13.5, 1.6, rearZ + 0.18);
  rearPanelGroup.add(audioH);
  for (let a = 0; a < 2; a++) {
    const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), matBlackPlastic);
    jack.rotation.x = Math.PI / 2;
    jack.position.set(12.6 + a * 1.8, 1.6, rearZ + 0.42);
    rearPanelGroup.add(jack);
  }

  // Alarm terminal block
  const alarmBlock = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.6, 1.0), matBlackPlastic);
  alarmBlock.position.set(18.5, 1.6, rearZ + 0.18);
  rearPanelGroup.add(alarmBlock);
  for (let t = 0; t < 8; t++) {
    const term = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.35), matCopper);
    term.position.set(16.5 + t * 0.5, 1.6, rearZ + 0.42);
    rearPanelGroup.add(term);
  }

  // AC inlet + switch
  const iecH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.9), matBlackPlastic);
  iecH.position.set(-17.0, -2.6, rearZ + 0.22);
  const iecCav = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.6, 0.6), new THREE.MeshBasicMaterial({ color: 0x050608 }));
  iecCav.position.set(-17.0, -2.6, rearZ + 0.1);
  rearPanelGroup.add(iecH, iecCav);
  const swH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.45), matBlackPlastic);
  swH.position.set(-12.5, -2.6, rearZ + 0.06);
  const swRocker = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.4), new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.4, roughness: 0.3 }));
  swRocker.position.set(-12.5, -2.6, rearZ - 0.1);
  swRocker.rotation.x = 0.15;
  rearPanelGroup.add(swH, swRocker);

  // Fan ×2
  const fanXs = [-4.0, 1.5];
  const fanRotors = [];
  fanXs.forEach((fx, fIdx) => {
    const fanGroup = new THREE.Group();
    fanGroup.name = `RearFan_${fIdx + 1}`;
    fanGroup.position.set(fx, -2.4, rearZ + 0.2);
    const fFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 1.1), matBlackPlastic);
    fFrame.position.set(0, 0, 0.4);
    fanGroup.add(fFrame);
    const fTunnel = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.15, 24), new THREE.MeshBasicMaterial({ color: 0x070a0f }));
    fTunnel.rotation.x = Math.PI / 2;
    fTunnel.position.set(0, 0, 0.38);
    fanGroup.add(fTunnel);
    const rotor = new THREE.Group();
    rotor.position.set(0, 0, 0.2);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.6, 16), matBlackPlastic);
    hub.rotation.x = Math.PI / 2;
    rotor.add(hub);
    const bladeGeo = new THREE.BoxGeometry(0.9, 0.38, 0.07);
    for (let b = 0; b < 7; b++) {
      const ang = (b / 7) * Math.PI * 2;
      const bp = new THREE.Group(); bp.rotation.z = ang;
      const bm = new THREE.Mesh(bladeGeo, matBlackPlastic);
      bm.position.set(1.05, 0, 0); bm.rotation.x = 0.5;
      bp.add(bm); rotor.add(bp);
    }
    fanRotors.push(rotor);
    fanGroup.add(rotor);
    for (let r of [0.7, 1.15, 1.55]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 8, 24), matShield);
      ring.position.set(0, 0, -0.2);
      fanGroup.add(ring);
    }
    rearPanelGroup.add(fanGroup);
  });

  // 接地柱
  const gndWasher = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 18), matCopper);
  gndWasher.rotation.x = Math.PI / 2;
  gndWasher.position.set(18.5, -0.4, rearZ - 0.05);
  const gndStud = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 14), matCopper);
  gndStud.rotation.x = Math.PI / 2;
  gndStud.position.set(18.5, -0.4, rearZ - 0.5);
  rearPanelGroup.add(gndWasher, gndStud);

  // -----------------------------------------------------------------------
  // 6. INTERNALS
  // -----------------------------------------------------------------------
  // 主板 PCB
  const pcbTex = new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0b3d2a'; ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#107c55'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) {
      const y = 10 + i * 6;
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(260, y); ctx.lineTo(290, y + (i % 2 ? 12 : -12)); ctx.lineTo(490, y + (i % 2 ? 12 : -12)); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 14px monospace';
    ctx.fillText('NVR MAINBOARD REV 3.1  ·  PoE 8-port PSE', 20, 240);
    return c;
  })());
  applyColorSpace(pcbTex, THREE);
  const mainPcbMat = new THREE.MeshStandardMaterial({ name: 'MainboardPcbMat', map: pcbTex, roughness: 0.4, metalness: 0.2 });
  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 22), mainPcbMat);
  mainPcb.position.set(-4, -2.6, -2);
  mainPcb.name = 'Internal_Mainboard';
  tagPart(mainPcb, 'NVR 主板 PCB', '承载 SoC、内存、PoE PSE、SATA 控制器的多层电路板。', 'BoxGeometry+PCBTexture', 'FR-4');
  internalsGroup.add(mainPcb);

  // 散热器
  const hsBase = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 5.5), matHeatsink);
  hsBase.position.set(-6, -2.2, -3);
  internalsGroup.add(hsBase);
  const finGeo = new THREE.BoxGeometry(0.12, 1.3, 5.5);
  for (let f = 0; f < 12; f++) {
    const fin = new THREE.Mesh(finGeo, matHeatsink);
    fin.position.set(-9.2 + f * 0.58, -1.5, -3);
    internalsGroup.add(fin);
  }

  // 硬盘笼：3 块竖隔板 + 每块硬盘的托架，避免硬盘悬空
  for (const cx of [1.0, 11.4, 21.7]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.8, 15), matHdd);
    plate.position.set(cx, 0.4, 12.2);
    plate.name = 'Internal_HddCage_SidePlate';
    hddGroup.add(plate);
  }

  // 4 块硬盘 (3.5" SATA 10.2×2.6×14.6,长轴沿 Z，正对前面板盘位)
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const hx = 6.2 + col * 10.2;
    const hy = 1.9 - row * 3.0;
    const hz = 12.2;

    const tray = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.16, 14.8), matHdd);
    tray.position.set(hx, hy - 1.38, hz);
    hddGroup.add(tray);

    const hdd = new THREE.Mesh(new THREE.BoxGeometry(10.2, 2.6, 14.6), matHdd);
    hdd.position.set(hx, hy, hz);
    hdd.name = `Internal_HDD_${i + 1}`;
    tagPart(hdd, `HDD ${i + 1} (3.5" SATA 4TB)`, '热插拔 SATA 硬盘，RAID 5 阵列成员。', 'BoxGeometry', 'HddCase');
    hddGroup.add(hdd);

    // 硬盘顶部标签贴纸
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), matHddLabel);
    lbl.rotation.x = -Math.PI / 2;
    lbl.position.set(hx, hy + 1.31, hz);
    hddGroup.add(lbl);
  }

  // 电源模块(放在机箱右后部，避免与前置硬盘笼冲突)
  const psu = new THREE.Mesh(new THREE.BoxGeometry(9.5, 3.0, 12), matPsu);
  psu.position.set(15.8, -1.4, -10);
  psu.name = 'Internal_PSU';
  tagPart(psu, '内置 200W 电源模块', '为 NVR 主板与 4 块硬盘提供稳定直流供电。', 'BoxGeometry', 'PSU');
  internalsGroup.add(psu);
  // 电容
  const capGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.0, 16);
  for (let c = 0; c < 2; c++) {
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35 }));
    cap.position.set(12 + c * 2.2, 0.9, -6);
    internalsGroup.add(cap);
  }

  // -----------------------------------------------------------------------
  // shell tagging
  // -----------------------------------------------------------------------
  [topCoverGroup, chassisBaseGroup].forEach(g => {
    g.traverse(o => { if (o.isMesh) o.userData.shell = true; });
  });

  // explode (optional, not wired to UI but harmless)
  root.userData = {
    groups: { chassisBaseGroup, topCoverGroup, frontPanelGroup, rearPanelGroup, rackEarsGroup, internalsGroup, hddGroup },
    setExplodeFactor: (t) => {
      topCoverGroup.position.set(0, t * 6, 0);
      chassisBaseGroup.position.set(0, -t * 2, 0);
      internalsGroup.position.set(0, t * 1, 0);
      frontPanelGroup.position.set(0, 0, t * 4);
      rearPanelGroup.position.set(0, 0, -t * 4);
      hddGroup.position.set(0, 0, t * 2);
    }
  };

  // front (+Z) -> faces camera after 180°
  root.rotation.y = Math.PI;
  return root;
}