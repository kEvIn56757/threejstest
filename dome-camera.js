// dome-camera.js — 海康威视 4MP 红外半球网络摄像机
// 吸顶安装：白色塑胶外壳 + 烟灰色透明球罩，内部可见镜头模组、红外灯环与主板。
// 单位：厘米(cm)。外形约 φ15.6 × 11.2 cm。镜头朝下并略向前倾。
function buildDomeCamera(THREE) {
  const { roundedRectShape, canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'HikvisionDomeCamera';

  const shellGroup = new THREE.Group(); shellGroup.name = 'DomeShellGroup';
  const internalsGroup = new THREE.Group(); internalsGroup.name = 'DomeInternalsGroup';
  root.add(shellGroup, internalsGroup);

  // ---------- materials ----------
  const matShell = mat(THREE, 'physical', 'DomeShellWhite', {
    color: 0xf1f3f4, metalness: 0.05, roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.4,
  });
  const matTrim = mat(THREE, 'physical', 'DomeTrimGray', {
    color: 0x9aa3ab, metalness: 0.55, roughness: 0.4,
  });
  const matDome = mat(THREE, 'physical', 'DomeSmokedGlass', {
    color: 0x1b2733, metalness: 0.15, roughness: 0.06,
    transparent: true, opacity: 0.42, clearcoat: 1.0,
  });
  const matBlack = mat(THREE, 'standard', 'DomeBlackPlastic', {
    color: 0x0e1013, metalness: 0.1, roughness: 0.65,
  });
  const matLensGlass = mat(THREE, 'physical', 'DomeLensGlass', {
    color: 0x07131f, metalness: 0.35, roughness: 0.04, clearcoat: 1.0,
  });
  const matPcb = mat(THREE, 'standard', 'DomePcbGreen', {
    color: 0x0b3d2a, metalness: 0.15, roughness: 0.62,
  });
  const matGold = mat(THREE, 'physical', 'DomeGoldPin', {
    color: 0xfbbf24, metalness: 0.95, roughness: 0.15,
  });
  const matIr = mat(THREE, 'standard', 'DomeIrLed', {
    color: 0x3a0a0a, emissive: 0x7f1d1d, emissiveIntensity: 0.45, roughness: 0.25,
  });
  const matRubber = mat(THREE, 'standard', 'DomeRubberGasket', {
    color: 0x16181b, roughness: 0.9,
  });

  // ---------- side logo band texture ----------
  const { c: bandC, ctx: bandCtx } = canvas(1024, 128);
  bandCtx.fillStyle = '#f1f3f4'; bandCtx.fillRect(0, 0, 1024, 128);
  bandCtx.fillStyle = '#c7ccd1'; bandCtx.fillRect(0, 0, 1024, 6); bandCtx.fillRect(0, 122, 1024, 6);
  // 4 组循环，任意观察角度都能看到一组完整的品牌字样
  for (let k = 0; k < 4; k++) {
    const ox = k * 256;
    bandCtx.fillStyle = '#dc2626'; bandCtx.fillRect(ox + 18, 42, 4, 44);
    label(bandCtx, 'HIKVISION', ox + 30, 54, { px: 18, color: '#1f2937', mono: false });
    label(bandCtx, '4MP IR DOME · IP67 · PoE', ox + 30, 86, { px: 11, color: '#6b7280' });
  }
  const bandTex = canvasTexture(THREE, bandC);
  const matBand = mat(THREE, 'standard', 'DomeLogoBand', {
    map: bandTex, roughness: 0.42, metalness: 0.05,
  });

  // ---------- ceiling mount plate ----------
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(7.8, 7.8, 0.55, 48), matShell);
  plate.position.y = 0.28;
  plate.castShadow = true; plate.receiveShadow = true;
  plate.name = 'Dome_CeilingPlate';
  tag(plate, '吸顶安装底盘', 'φ15.6cm 白色塑胶吸顶底盘，内含走线孔与三颗固定螺钉。', 'CylinderGeometry', 'ABS');
  shellGroup.add(plate);

  const plateRing = new THREE.Mesh(new THREE.TorusGeometry(7.55, 0.12, 8, 48), matTrim);
  plateRing.rotation.x = Math.PI / 2;
  plateRing.position.y = 0.02;
  shellGroup.add(plateRing);

  // 4 mounting screws
  const screwGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 12);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const sc = new THREE.Mesh(screwGeo, matTrim);
    sc.position.set(Math.cos(a) * 6.6, 0.55, Math.sin(a) * 6.6);
    shellGroup.add(sc);
  }

  // ---------- main housing ----------
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 3.2, 48), matShell);
  housing.position.y = -1.9;
  housing.castShadow = true; housing.receiveShadow = true;
  housing.name = 'Dome_MainHousing';
  tag(housing, '半球摄像机主壳体', '白色阻燃塑胶外壳，侧面丝印品牌与型号，内部容纳镜头模组与主板。', 'CylinderGeometry', 'ABS + PC');
  shellGroup.add(housing);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(7.21, 7.21, 1.5, 48, 1, true), matBand);
  band.position.y = -2.0;
  band.name = 'Dome_LogoBand';
  shellGroup.add(band);

  // seam ring + bottom trim
  const seam = new THREE.Mesh(new THREE.TorusGeometry(7.12, 0.09, 8, 48), matTrim);
  seam.rotation.x = Math.PI / 2;
  seam.position.y = -1.45;
  shellGroup.add(seam);

  const trim = new THREE.Mesh(new THREE.TorusGeometry(7.08, 0.18, 10, 48), matTrim);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = -3.48;
  shellGroup.add(trim);

  // ---------- smoked dome ----------
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(6.95, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    matDome
  );
  dome.position.y = -3.4;
  dome.name = 'Dome_SmokedCover';
  tag(dome, '烟灰色透明球罩', 'φ13.9cm 烟灰色 PC 球罩，透光率约 42%，兼顾红外补光与隐蔽性。', 'SphereGeometry (half)', 'Smoked PC');
  shellGroup.add(dome);

  const domeGasket = new THREE.Mesh(new THREE.TorusGeometry(6.98, 0.1, 8, 48), matRubber);
  domeGasket.rotation.x = Math.PI / 2;
  domeGasket.position.y = -3.38;
  shellGroup.add(domeGasket);

  // ---------- internal lens module (tilted down-forward) ----------
  const lensGroup = new THREE.Group();
  lensGroup.name = 'Dome_LensModule';
  lensGroup.position.set(0, -4.7, 0.75);
  lensGroup.rotation.x = 2.18;
  internalsGroup.add(lensGroup);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 3.1, 32), matBlack);
  barrel.position.y = 0.2;
  tag(barrel, '4MP 定焦镜头筒', '金属镜头筒，内置 2.8mm 广角定焦镜头与红外截止滤光片。', 'CylinderGeometry', 'Aluminum + Glass');
  lensGroup.add(barrel);

  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.12, 10, 32), matTrim);
  lensRing.rotation.x = Math.PI / 2;
  lensRing.position.y = 1.78;
  lensGroup.add(lensRing);

  const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.12, 32), matLensGlass);
  lensGlass.position.y = 1.76;
  lensGroup.add(lensGlass);

  // IR LED ring: 12 emitters
  const irGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.16, 10);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const led = new THREE.Mesh(irGeo, matIr);
    led.position.set(Math.cos(a) * 2.35, 1.62, Math.sin(a) * 2.35);
    lensGroup.add(led);
  }
  const irRing = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.09, 8, 36), matBlack);
  irRing.rotation.x = Math.PI / 2;
  irRing.position.y = 1.58;
  lensGroup.add(irRing);

  // ---------- internal boards & cabling ----------
  const sensorPcb = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 5.2), matPcb);
  sensorPcb.position.set(0, -3.95, 0.4);
  sensorPcb.rotation.x = 0.22;
  sensorPcb.name = 'Dome_SensorPcb';
  tag(sensorPcb, '图像传感器板', '1/2.7" CMOS 图像传感器与 ISP 处理电路。', 'BoxGeometry', 'FR-4');
  internalsGroup.add(sensorPcb);

  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.28, 6.6), matPcb);
  mainPcb.position.set(0, -1.2, 0);
  mainPcb.name = 'Dome_MainPcb';
  tag(mainPcb, '主控板', '海思 SoC、以太网变压器、PoE 受电模块与存储芯片。', 'BoxGeometry', 'FR-4');
  internalsGroup.add(mainPcb);

  // PCB components
  const icGeo = new THREE.BoxGeometry(1.2, 0.3, 1.2);
  for (let i = 0; i < 3; i++) {
    const ic = new THREE.Mesh(icGeo, matBlack);
    ic.position.set(-2.6 + i * 2.4, -1.0, 1.6);
    internalsGroup.add(ic);
  }
  const pinGeo = new THREE.BoxGeometry(0.06, 0.16, 0.5);
  for (let i = 0; i < 8; i++) {
    const pin = new THREE.Mesh(pinGeo, matGold);
    pin.position.set(-3.5 + i * 0.9, -0.95, -2.1);
    internalsGroup.add(pin);
  }

  // ribbon cable from sensor to main board
  const ribbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -3.95, 0.3),
    new THREE.Vector3(0.3, -3.0, 0.1),
    new THREE.Vector3(0.1, -1.6, -0.2),
    new THREE.Vector3(0, -1.2, -0.6),
  ]);
  const ribbon = new THREE.Mesh(new THREE.TubeGeometry(ribbonCurve, 18, 0.28, 8, false), matBlack);
  internalsGroup.add(ribbon);

  // cable gland on top
  const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.1, 20), matTrim);
  gland.position.set(-4.2, 0.9, -3.6);
  shellGroup.add(gland);

  // tamper screw at bottom rim
  const tamper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12), matTrim);
  tamper.position.set(0, -3.62, 6.2);
  shellGroup.add(tamper);

  markShell(shellGroup);

  root.userData = { groups: { shellGroup, internalsGroup } };
  return root;
}
