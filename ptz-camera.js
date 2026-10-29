// ptz-camera.js — 7 寸红外网络球机（PTZ 高速球）
// 壁装支架 + 白色金属球体 + 烟灰球罩；镜头朝 +Z，root 旋转 180° 后正对观察者。
// 内部可见云台电机、解码板、镜头模组与红外灯环。单位：厘米(cm)。
function buildPTZCamera(THREE) {
  const { canvasTexture, canvas, label, tag, mat, markShell } = MK;

  const root = new THREE.Group();
  root.name = 'HikvisionPTZCamera';

  const shellGroup = new THREE.Group(); shellGroup.name = 'PtzShellGroup';
  const internalsGroup = new THREE.Group(); internalsGroup.name = 'PtzInternalsGroup';
  root.add(shellGroup, internalsGroup);

  // ---------- materials ----------
  const matShell = mat(THREE, 'physical', 'PtzShellWhite', {
    color: 0xeef1f3, metalness: 0.18, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.35,
  });
  const matMetal = mat(THREE, 'physical', 'PtzBracketMetal', {
    color: 0xb9c0c6, metalness: 0.75, roughness: 0.3,
  });
  const matDome = mat(THREE, 'physical', 'PtzSmokedDome', {
    color: 0x18242f, metalness: 0.15, roughness: 0.05,
    transparent: true, opacity: 0.38, clearcoat: 1.0,
  });
  const matBlack = mat(THREE, 'standard', 'PtzBlackPlastic', {
    color: 0x0d0f12, metalness: 0.12, roughness: 0.62,
  });
  const matLens = mat(THREE, 'physical', 'PtzLensGlass', {
    color: 0x081420, metalness: 0.4, roughness: 0.03, clearcoat: 1.0,
  });
  const matPcb = mat(THREE, 'standard', 'PtzPcbGreen', {
    color: 0x0b3d2a, metalness: 0.15, roughness: 0.6,
  });
  const matGold = mat(THREE, 'physical', 'PtzGoldPin', {
    color: 0xfbbf24, metalness: 0.95, roughness: 0.15,
  });
  const matIr = mat(THREE, 'standard', 'PtzIrLed', {
    color: 0x3a0a0a, emissive: 0x7f1d1d, emissiveIntensity: 0.5, roughness: 0.25,
  });
  const matRubber = mat(THREE, 'standard', 'PtzRubber', {
    color: 0x141619, roughness: 0.9,
  });

  // ---------- side logo band ----------
  const { c: bandC, ctx: bandCtx } = canvas(1024, 128);
  bandCtx.fillStyle = '#eef1f3'; bandCtx.fillRect(0, 0, 1024, 128);
  bandCtx.fillStyle = '#d3d8dc'; bandCtx.fillRect(0, 0, 1024, 5);
  // 4 组循环，任意观察角度都能看到一组完整的品牌字样
  for (let k = 0; k < 4; k++) {
    const ox = k * 256;
    bandCtx.fillStyle = '#dc2626'; bandCtx.fillRect(ox + 18, 42, 4, 44);
    label(bandCtx, 'HIKVISION', ox + 30, 54, { px: 18, color: '#1f2937', mono: false });
    label(bandCtx, '4MP 30× PTZ · IR 150m · IP66', ox + 30, 86, { px: 11, color: '#6b7280' });
  }
  const bandTex = canvasTexture(THREE, bandC);
  const matBand = mat(THREE, 'standard', 'PtzLogoBand', { map: bandTex, roughness: 0.4, metalness: 0.1 });

  // ---------- wall bracket ----------
  const wallPlate = new THREE.Mesh(new THREE.BoxGeometry(16, 15, 1.2), matMetal);
  wallPlate.position.set(0, 7, -17);
  wallPlate.castShadow = true; wallPlate.receiveShadow = true;
  wallPlate.name = 'Ptz_WallPlate';
  tag(wallPlate, '壁装支架底盘', '16×15cm 压铸铝壁装底盘，四角 M8 膨胀螺栓固定。', 'BoxGeometry', 'Die-cast Aluminum');
  shellGroup.add(wallPlate);

  const boltGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.55, 12);
  boltGeo.rotateX(Math.PI / 2);
  for (const bx of [-5.8, 5.8]) {
    for (const by of [2.4, 11.6]) {
      const bolt = new THREE.Mesh(boltGeo, matMetal);
      bolt.position.set(bx, by, -16.2);
      shellGroup.add(bolt);
    }
  }

  const arm = new THREE.Mesh(new THREE.BoxGeometry(6.2, 6.2, 10.5), matShell);
  arm.position.set(0, 7, -11.2);
  arm.castShadow = true;
  arm.name = 'Ptz_WallArm';
  tag(arm, '壁装横臂', '6.2cm 方管横臂，内部走网络与电源线。', 'BoxGeometry', 'Aluminum');
  shellGroup.add(arm);

  const joint = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 2.6, 24), matShell);
  joint.position.set(0, 6.0, -6.2);
  shellGroup.add(joint);

  // ---------- main ball body ----------
  const body = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 7.0, 48), matShell);
  body.position.y = 0;
  body.castShadow = true; body.receiveShadow = true;
  body.name = 'Ptz_BallBody';
  tag(body, '7 寸球机主壳体', '白色喷塑铝合金球体，内置云台电机与解码板。', 'CylinderGeometry', 'Aluminum');
  shellGroup.add(body);

  const topCap = new THREE.Mesh(
    new THREE.SphereGeometry(7.2, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matShell
  );
  topCap.scale.y = 0.34;
  topCap.position.y = 3.5;
  shellGroup.add(topCap);

  const sunShield = new THREE.Mesh(
    new THREE.SphereGeometry(7.9, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2.4),
    matShell
  );
  sunShield.scale.y = 0.30;
  sunShield.position.y = 3.9;
  sunShield.castShadow = true;
  sunShield.name = 'Ptz_SunShield';
  tag(sunShield, '一体化遮阳罩', '外扩式遮阳罩，降低阳光直射导致的机内温升。', 'SphereGeometry cap', 'Aluminum');
  shellGroup.add(sunShield);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(7.21, 7.21, 1.5, 48, 1, true), matBand);
  band.position.y = -2.0;
  shellGroup.add(band);

  // 上下壳体分模线 + 侧面散热槽 + 固定螺钉
  const midSeam = new THREE.Mesh(new THREE.TorusGeometry(7.15, 0.06, 8, 48), matMetal);
  midSeam.rotation.x = Math.PI / 2;
  midSeam.position.y = 0.6;
  shellGroup.add(midSeam);

  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.36), matBlack);
      vent.position.set(side * 7.21, 0.6, -2.0 + i * 0.62);
      shellGroup.add(vent);
    }
  }

  const boltHeadGeo = new THREE.SphereGeometry(0.13, 10, 8);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const bolt = new THREE.Mesh(boltHeadGeo, matMetal);
    bolt.position.set(Math.cos(a) * 7.2, 2.7, Math.sin(a) * 7.2);
    shellGroup.add(bolt);
  }

  const trim = new THREE.Mesh(new THREE.TorusGeometry(7.12, 0.18, 10, 48), matMetal);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = -3.5;
  shellGroup.add(trim);

  const topSeam = new THREE.Mesh(new THREE.TorusGeometry(7.14, 0.08, 8, 48), matMetal);
  topSeam.rotation.x = Math.PI / 2;
  topSeam.position.y = 3.45;
  shellGroup.add(topSeam);

  // 前侧状态灯 + Reset 针孔
  const statusLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.1, roughness: 0.2 })
  );
  statusLed.rotation.x = Math.PI / 2;
  statusLed.position.set(-0.8, -1.0, 7.22);
  shellGroup.add(statusLed);
  const resetHole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), matBlack);
  resetHole.rotation.x = Math.PI / 2;
  resetHole.position.set(1.0, -1.0, 7.22);
  shellGroup.add(resetHole);

  // ---------- smoked dome ----------
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(7.0, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    matDome
  );
  dome.position.y = -3.4;
  dome.name = 'Ptz_SmokedDome';
  tag(dome, '烟灰色透明球罩', '7 寸烟灰 PC 球罩，内置红外补光与 30 倍变焦镜头。', 'SphereGeometry (half)', 'Smoked PC');
  shellGroup.add(dome);

  const domeGasket = new THREE.Mesh(new THREE.TorusGeometry(7.02, 0.11, 8, 48), matRubber);
  domeGasket.rotation.x = Math.PI / 2;
  domeGasket.position.y = -3.38;
  shellGroup.add(domeGasket);

  // ---------- internal pan/tilt & lens ----------
  const panMotor = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.2, 24), matMetal);
  panMotor.position.set(0, 4.2, 0);
  panMotor.name = 'Ptz_PanMotor';
  tag(panMotor, '水平云台电机', '步进电机 + 行星减速箱，支持 360° 连续旋转。', 'CylinderGeometry', 'Steel + Copper');
  internalsGroup.add(panMotor);

  const panGear = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.5, 32), matGold);
  panGear.position.set(0, 3.1, 0);
  internalsGroup.add(panGear);

  const tiltMotor = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.2, 20), matMetal);
  tiltMotor.rotation.z = Math.PI / 2;
  tiltMotor.position.set(-5.2, 0, -2.6);
  tiltMotor.name = 'Ptz_TiltMotor';
  tag(tiltMotor, '垂直云台电机', '-15°~90° 俯仰电机与蜗轮蜗杆自锁机构。', 'CylinderGeometry', 'Steel');
  internalsGroup.add(tiltMotor);

  const tiltGear = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.5, 24), matGold);
  tiltGear.rotation.z = Math.PI / 2;
  tiltGear.position.set(-3.5, 0, -2.6);
  internalsGroup.add(tiltGear);

  // main decoder board (vertical)
  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(8.6, 5.2, 0.28), matPcb);
  mainPcb.position.set(0, 0.6, -4.2);
  mainPcb.name = 'Ptz_MainPcb';
  tag(mainPcb, '云台解码板', '集成云台控制、网络编码、PoE 受电与镜头驱动电路。', 'BoxGeometry', 'FR-4');
  internalsGroup.add(mainPcb);

  const icGeo = new THREE.BoxGeometry(1.1, 1.1, 0.3);
  for (let i = 0; i < 4; i++) {
    const ic = new THREE.Mesh(icGeo, matBlack);
    ic.position.set(-2.7 + i * 1.8, 1.1, -4.0);
    internalsGroup.add(ic);
  }

  // lens assembly
  const lensGroup = new THREE.Group();
  lensGroup.name = 'Ptz_LensModule';
  // 镜头位于球罩中部、朝前，不能藏在不透明的上部球体里
  lensGroup.position.set(0, -3.6, 0.6);
  internalsGroup.add(lensGroup);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 4.8, 32), matBlack);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 2.4;
  tag(barrel, '30 倍光学变焦镜头', '4MP 1/1.8" 传感器 + 30× 光学变焦镜头组。', 'CylinderGeometry', 'Aluminum + Glass');
  lensGroup.add(barrel);

  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.14, 10, 36), matMetal);
  lensRing.position.z = 4.82;
  lensGroup.add(lensRing);

  const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.12, 36), matLens);
  lensGlass.rotation.x = Math.PI / 2;
  lensGlass.position.z = 4.86;
  lensGroup.add(lensGlass);

  // IR ring around lens
  const irGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 10);
  irGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const led = new THREE.Mesh(irGeo, matIr);
    led.position.set(Math.cos(a) * 3.35, Math.sin(a) * 3.35, 4.55);
    lensGroup.add(led);
  }
  const irRing = new THREE.Mesh(new THREE.TorusGeometry(3.35, 0.1, 8, 40), matBlack);
  irRing.position.z = 4.5;
  lensGroup.add(irRing);

  // wiper arm
  const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 4.2), matBlack);
  wiper.position.set(-3.1, 3.1, 4.0);
  wiper.rotation.x = -0.25;
  lensGroup.add(wiper);

  // bracket cable
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 7.2, -16.2),
    new THREE.Vector3(0, 6.2, -13.5),
    new THREE.Vector3(0, 5.2, -9.5),
    new THREE.Vector3(0, 4.6, -6.4),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 20, 0.34, 10, false), matRubber);
  shellGroup.add(cable);

  markShell(shellGroup);

  root.rotation.y = Math.PI;   // 镜头(+Z)转向观察者
  root.userData = { groups: { shellGroup, internalsGroup } };
  return root;
}
