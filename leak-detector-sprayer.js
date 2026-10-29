// 气密性检漏喷壶 — 通用手压式泡沫/喷雾检漏瓶。
// 单位 cm；正面(+X)为喷嘴方向，Y 向上。无指定品牌及图纸，尺寸为示意。
function buildLeakDetectorSprayer(THREE) {
  const root = new THREE.Group();
  root.name = 'leak_detector_sprayer';

  function mat(name, color, roughness = 0.55, metalness = 0, extra = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    m.name = name;
    return m;
  }
  const bottleMat = new THREE.MeshPhysicalMaterial({
    color: 0xe2eeee, roughness: 0.24, metalness: 0,
    transparent: true, opacity: 0.48, transmission: 0.20, thickness: 0.18,
    ior: 1.46, clearcoat: 0.40, clearcoatRoughness: 0.18,
    side: THREE.DoubleSide, depthWrite: false,
  });
  bottleMat.name = 'translucent_hdpe_bottle';
  const bottleEdge = mat('hdpe_molded_edges', 0xc6d9d9, 0.40, 0, { transparent: true, opacity: 0.76 });
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fcbd0, roughness: 0.16, transparent: true, opacity: 0.27,
    transmission: 0.12, thickness: 1.5, depthWrite: false,
  });
  liquidMat.name = 'leak_detection_liquid';
  const white = mat('sprayer_head_white_pp', 0xe4e7e4, 0.48);
  const whiteDark = mat('head_recess_offwhite', 0xb7c1c0, 0.64);
  const black = mat('nozzle_and_trigger_black', 0x1e292b, 0.63);
  const rubber = mat('gasket_black_rubber', 0x151e20, 0.87);
  const steel = mat('pump_spring_stainless', 0xb3bfc0, 0.24, 0.82);
  const tubeMat = new THREE.MeshPhysicalMaterial({
    color: 0xe3e9db, roughness: 0.34, transparent: true, opacity: 0.65,
    transmission: 0.10, depthWrite: false,
  });
  tubeMat.name = 'polyethylene_dip_tube';
  const blue = mat('label_navy_blue', 0x1e596b, 0.7);
  const cyan = mat('label_cyan', 0x2a9ca6, 0.65);

  function add(geo, material, name, parent = root, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, material);
    m.name = name;
    m.position.set(x, y, z);
    m.castShadow = !material.transparent;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cylinder(rt, rb, h, material, name, y, x = 0, z = 0, parent = root, segments = 64) {
    return add(new THREE.CylinderGeometry(rt, rb, h, segments), material, name, parent, x, y, z);
  }
  function cylinderX(r, length, material, name, x, y, z = 0, parent = root) {
    const g = new THREE.CylinderGeometry(r, r, length, 48);
    g.rotateZ(-Math.PI / 2);
    return add(g, material, name, parent, x, y, z);
  }
  function torusY(r, tube, material, name, y, x = 0, z = 0, parent = root) {
    const g = new THREE.TorusGeometry(r, tube, 10, 64);
    g.rotateX(Math.PI / 2);
    return add(g, material, name, parent, x, y, z);
  }
  function torusX(r, tube, material, name, x, y, z = 0, parent = root) {
    const g = new THREE.TorusGeometry(r, tube, 10, 48);
    g.rotateY(Math.PI / 2);
    return add(g, material, name, parent, x, y, z);
  }
  function roundSlab(w, h, depth, r, material, name, x, y, z = 0, parent = root) {
    const g = new THREE.ExtrudeGeometry(MK.roundedRectShape(THREE, w, h, r), {
      depth, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.045,
      bevelSegments: 3, curveSegments: 12,
    });
    g.translate(0, 0, -depth / 2);
    return add(g, material, name, parent, x, y, z);
  }
  function tube(points, radius, material, name, parent = root, segments = 72) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return add(new THREE.TubeGeometry(curve, segments, radius, 12, false), material, name, parent);
  }

  const shell = new THREE.Group(); shell.name = 'bottle_and_external_head'; root.add(shell);
  const internals = new THREE.Group(); internals.name = 'pump_and_dip_tube'; root.add(internals);

  // Hollow revolved HDPE bottle with rounded shoulder, stable base and narrow neck.
  const profile = [
    [0.00, 0.15], [3.45, 0.15], [3.87, 0.30], [4.12, 0.66],
    [4.25, 1.20], [4.25, 9.95], [4.20, 10.65], [4.03, 11.15],
    [3.70, 11.62], [3.15, 12.06], [2.48, 12.45], [1.83, 12.82],
    [1.70, 13.18], [1.70, 14.02], [1.49, 14.02], [1.48, 13.13],
    [1.64, 12.62], [2.34, 12.23], [3.02, 11.84], [3.52, 11.40],
    [3.83, 10.90], [3.97, 10.32], [3.98, 1.23], [3.82, 0.90],
    [3.50, 0.65], [0.00, 0.65],
  ].map(p => new THREE.Vector2(...p));
  add(new THREE.LatheGeometry(profile, 96), bottleMat, 'hollow_translucent_bottle', shell);
  torusY(3.91, 0.12, bottleEdge, 'base_molded_ring', 0.58, 0, 0, shell);
  torusY(4.21, 0.065, bottleEdge, 'lower_body_mold_line', 1.20, 0, 0, shell);
  torusY(1.72, 0.11, whiteDark, 'neck_bead', 13.80, 0, 0, shell);
  // Fine vertical mold seams on the two sides of the bottle.
  for (const z of [-4.17, 4.17]) {
    const seam = add(new THREE.BoxGeometry(0.035, 8.9, 0.045), bottleEdge,
      `bottle_mold_seam_${z}`, shell, 0, 5.73, z);
    seam.castShadow = false;
  }

  // Liquid level stays below the shoulder, with a distinct meniscus.
  cylinder(3.92, 3.92, 6.70, liquidMat, 'leak_detector_liquid_volume', 4.25, 0, 0, internals);
  cylinder(3.93, 3.93, 0.065, liquidMat, 'liquid_meniscus', 7.62, 0, 0, internals);
  torusY(3.82, 0.075, liquidMat, 'meniscus_edge', 7.65, 0, 0, internals);

  // Threaded closure and characteristic white trigger-sprayer body.
  cylinder(2.10, 2.10, 0.24, rubber, 'neck_sealing_gasket', 14.04, 0, 0, shell);
  cylinder(2.17, 2.12, 1.25, white, 'threaded_closure_cap', 14.68, 0, 0, shell);
  for (let i = 0; i < 40; i++) {
    const a = i * Math.PI * 2 / 40;
    const rib = add(new THREE.BoxGeometry(0.105, 0.94, 0.14), whiteDark,
      `closure_grip_rib_${i}`, shell, Math.cos(a) * 2.12, 14.68, Math.sin(a) * 2.12);
    rib.rotation.y = -a;
  }
  torusY(2.14, 0.09, white, 'closure_upper_rim', 15.24, 0, 0, shell);

  // One moulded shroud, not a rectangular box perched on the closure. The rear
  // sweeps down into a palm rest and the lower edge arches over the finger well.
  const housingShape = new THREE.Shape();
  housingShape.moveTo(-2.02, 14.46);
  housingShape.bezierCurveTo(-2.32, 14.65, -2.55, 15.06, -2.49, 15.75);
  housingShape.lineTo(-2.36, 16.36);
  housingShape.quadraticCurveTo(-2.28, 16.82, -1.74, 16.88);
  housingShape.lineTo(1.52, 16.88);
  housingShape.quadraticCurveTo(2.14, 16.85, 2.25, 16.30);
  housingShape.lineTo(2.25, 15.62);
  housingShape.quadraticCurveTo(2.20, 15.12, 1.63, 15.02);
  housingShape.lineTo(0.42, 14.98);
  housingShape.bezierCurveTo(-0.26, 14.89, -0.54, 14.30, -0.73, 13.80);
  housingShape.bezierCurveTo(-0.90, 13.33, -1.22, 13.10, -1.58, 13.16);
  housingShape.bezierCurveTo(-1.94, 13.23, -2.03, 13.76, -2.02, 14.46);
  const housingGeo = new THREE.ExtrudeGeometry(housingShape, {
    depth: 2.70, bevelEnabled: true, bevelSize: 0.16, bevelThickness: 0.16,
    bevelSegments: 5, curveSegments: 24,
  });
  housingGeo.translate(0, 0, -1.35);
  add(housingGeo, white, 'pump_main_housing', shell);
  roundSlab(3.25, 0.34, 2.82, 0.13, whiteDark, 'pump_lower_joint', 0.14, 14.92, 0, shell);
  // Horizontal nozzle barrel, rotary tip and concentric spray outlet.
  cylinderX(1.04, 3.00, white, 'nozzle_barrel', 2.77, 16.12, 0, shell);
  cylinderX(1.14, 0.38, whiteDark, 'nozzle_barrel_joint', 4.20, 16.12, 0, shell);
  cylinderX(1.02, 1.48, black, 'adjustable_nozzle', 4.93, 16.12, 0, shell);
  for (let i = 0; i < 28; i++) {
    const a = i * Math.PI * 2 / 28;
    const rib = add(new THREE.BoxGeometry(1.12, 0.075, 0.10), black,
      `nozzle_grip_rib_${i}`, shell, 4.95, 16.12 + Math.cos(a) * 1.01, Math.sin(a) * 1.01);
    rib.rotation.x = a;
  }
  cylinderX(0.91, 0.15, black, 'nozzle_front_face', 5.72, 16.12, 0, shell);
  torusX(0.40, 0.09, whiteDark, 'spray_orifice_ring', 5.82, 16.12, 0, shell);
  cylinderX(0.23, 0.08, rubber, 'spray_orifice', 5.84, 16.12, 0, shell);
  cylinderX(0.075, 0.09, steel, 'spray_outlet_pin', 5.88, 16.12, 0, shell);

  // Cantilevered two-finger trigger: a short upper crank, a forward-bowed blade
  // and a hooked lower tip. Its thin section leaves a generous rear finger well.
  const triggerShape = new THREE.Shape();
  triggerShape.moveTo(0.35, 15.08);
  triggerShape.lineTo(1.52, 15.16);
  triggerShape.quadraticCurveTo(1.89, 15.14, 1.98, 14.79);
  triggerShape.bezierCurveTo(2.12, 14.05, 2.47, 13.35, 3.11, 12.72);
  triggerShape.bezierCurveTo(3.38, 12.47, 3.53, 12.19, 3.39, 11.99);
  triggerShape.quadraticCurveTo(3.23, 11.78, 2.93, 11.92);
  triggerShape.bezierCurveTo(2.20, 12.28, 1.72, 13.08, 1.31, 13.90);
  triggerShape.lineTo(0.77, 14.87);
  triggerShape.quadraticCurveTo(0.59, 15.10, 0.35, 15.08);
  const triggerGeo = new THREE.ExtrudeGeometry(triggerShape, {
    depth: 1.34, bevelEnabled: true, bevelSize: 0.055, bevelThickness: 0.055,
    bevelSegments: 3, curveSegments: 28,
  });
  triggerGeo.translate(0, 0, -0.67);
  add(triggerGeo, black, 'continuous_curved_trigger_blade', shell);
  // Finger grooves follow the forward contact surface of the lower blade.
  for (let i = 0; i < 4; i++) {
    const groove = roundSlab(0.30, 0.048, 1.30, 0.018, rubber,
      `trigger_finger_groove_${i}`, 2.47 + i * 0.17, 13.07 - i * 0.19, 0, shell);
    groove.rotation.z = -0.73;
  }
  cylinderX(0.18, 1.64, black, 'trigger_pivot_pin', 1.34, 14.95, 0, shell).rotation.y = Math.PI / 2;

  // Rear pressure vent and small safety lock on the pump housing.
  cylinderX(0.31, 0.18, whiteDark, 'rear_pressure_vent', -1.98, 16.10, 0, shell);
  cylinderX(0.12, 0.22, rubber, 'vent_opening', -2.08, 16.10, 0, shell);
  roundSlab(0.68, 0.30, 0.18, 0.08, black, 'trigger_safety_lock', -0.33, 17.17, 1.72, shell);

  // Bottle label is a cylindrical print following the front (+X) curvature.
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1536; labelCanvas.height = 1024;
  const ctx = labelCanvas.getContext('2d');
  ctx.fillStyle = '#edf1e9'; ctx.fillRect(0, 0, 1536, 1024);
  ctx.fillStyle = '#1e596b'; ctx.fillRect(0, 0, 1536, 154);
  ctx.fillStyle = '#2a9ca6'; ctx.fillRect(0, 154, 1536, 22);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 81px Arial'; ctx.fillText('LEAK DETECTOR', 768, 106);
  ctx.fillStyle = '#1e596b'; ctx.font = 'bold 100px "Microsoft YaHei", Arial'; ctx.fillText('气密检漏液', 768, 314);
  ctx.font = 'bold 48px Arial'; ctx.fillText('GAS TIGHTNESS  •  SPRAY', 768, 399);
  ctx.strokeStyle = '#2a9ca6'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(768, 586, 114, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(850, 667); ctx.lineTo(937, 754); ctx.stroke();
  ctx.beginPath(); ctx.arc(768, 586, 59, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#39565d'; ctx.font = '36px "Microsoft YaHei", Arial';
  ctx.fillText('喷涂于可疑接头 · 观察连续气泡', 768, 818);
  ctx.font = 'bold 37px Arial'; ctx.fillText('READY TO USE   /   500 mL', 768, 910);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.name = 'leak_detector_bottle_label'; labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = 8;
  const labelMat = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.64, side: THREE.DoubleSide });
  labelMat.name = 'bottle_label_print';
  // Cylinder theta=0 is +Z; centre the printed arc on +X.
  add(new THREE.CylinderGeometry(4.275, 4.275, 4.75, 64, 1, true, -0.80, 1.60),
    labelMat, 'front_leak_detector_label', shell, 0, 5.40).rotation.y = Math.PI / 2;

  // Moulded volume scale on the exposed right shoulder of the label.
  const scaleCanvas = document.createElement('canvas');
  scaleCanvas.width = 256; scaleCanvas.height = 1200;
  const sc = scaleCanvas.getContext('2d');
  sc.strokeStyle = '#496e73'; sc.fillStyle = '#496e73'; sc.lineWidth = 4;
  sc.font = 'bold 37px Arial'; sc.textAlign = 'left';
  for (let i = 0; i <= 10; i++) {
    const y = 70 + i * 101;
    sc.beginPath(); sc.moveTo(18, y); sc.lineTo(i % 2 ? 78 : 110, y); sc.stroke();
    if (!(i % 2)) sc.fillText(String(500 - i * 50), 123, y + 12);
  }
  sc.font = 'bold 34px Arial'; sc.fillText('mL', 126, 1145);
  const scaleTex = new THREE.CanvasTexture(scaleCanvas); scaleTex.name = 'bottle_volume_graduations';
  scaleTex.colorSpace = THREE.SRGBColorSpace;
  const scaleMat = new THREE.MeshStandardMaterial({ map: scaleTex, transparent: true, depthWrite: false, roughness: 0.65 });
  scaleMat.name = 'volume_scale_ink';
  const scaleGeo = new THREE.PlaneGeometry(1.05, 5.25);
  const scaleMesh = add(scaleGeo, scaleMat, 'bottle_volume_scale', shell, 1.30, 5.72, 4.08);
  scaleMesh.rotation.y = 0.30; scaleMesh.renderOrder = 4;

  // Internal pump: visible after hiding the bottle/head shell.
  cylinder(0.69, 0.69, 2.65, whiteDark, 'pump_cylinder', 14.55, 0, 0, internals);
  cylinder(0.46, 0.46, 2.02, steel, 'piston_rod', 16.0, 0.42, 0, internals);
  torusY(0.62, 0.12, rubber, 'piston_seal', 15.06, 0, 0, internals);
  const springPoints = [];
  for (let i = 0; i <= 240; i++) {
    const t = i / 240, a = t * Math.PI * 2 * 8;
    springPoints.push([0.47 * Math.cos(a), 15.1 + t * 1.58, 0.47 * Math.sin(a)]);
  }
  tube(springPoints, 0.055, steel, 'pump_return_spring', internals, 160);
  cylinderX(0.31, 3.8, whiteDark, 'internal_liquid_channel', 2.2, 16.12, 0, internals);
  cylinderX(0.11, 4.2, tubeMat, 'nozzle_feed_channel', 2.55, 16.12, 0, internals);
  tube([[0,13.85,0],[0,12.65,0],[0.14,10.85,0],[0.38,7.3,0],[0.78,3.1,0],[1.16,1.25,0]],
    0.13, tubeMat, 'flexible_dip_tube', internals, 96);
  const filter = cylinder(0.37, 0.37, 0.85, whiteDark, 'dip_tube_filter', 1.03, 1.21, 0, internals, 32);
  filter.rotation.z = -0.20;
  for (let i = 0; i < 6; i++) torusY(0.35, 0.035, steel, `filter_slot_${i}`, 0.74 + i * 0.105, 1.21, 0, internals);
  cylinder(0.21, 0.21, 0.35, steel, 'inlet_check_ball', 13.39, 0, 0, internals, 24);

  MK.markShell(shell);
  // Translucent bottle is further faded for a clear view of the tube and pump.
  root.userData.onShellToggle = on => {
    bottleMat.opacity = on ? 0.48 : 0.10;
    liquidMat.opacity = on ? 0.27 : 0.12;
  };
  root.userData.description = '通用手压式气密检漏喷壶：500mL、可调喷嘴、扳机泵、回位弹簧、单向阀及进液吸管。尺寸为示意。';
  return root;
}
