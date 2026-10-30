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
  function cylinderZ(r, length, material, name, x, y, z = 0, parent = root) {
    const g = new THREE.CylinderGeometry(r, r, length, 32);
    g.rotateX(Math.PI / 2);
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

  // The shroud sits above the cap rather than cutting through its knurling.
  // A short central seat joins the two; the front overhang carries the trigger.
  const housingShape = new THREE.Shape();
  housingShape.moveTo(-2.12, 15.54);
  housingShape.bezierCurveTo(-2.47, 15.57, -2.62, 15.94, -2.47, 16.50);
  housingShape.lineTo(-2.30, 16.95);
  housingShape.quadraticCurveTo(-2.15, 17.24, -1.65, 17.24);
  housingShape.lineTo(1.55, 17.24);
  housingShape.quadraticCurveTo(2.18, 17.22, 2.40, 16.78);
  housingShape.lineTo(2.62, 16.12);
  housingShape.quadraticCurveTo(2.87, 15.66, 2.50, 15.54);
  housingShape.lineTo(-2.12, 15.54);
  const housingGeo = new THREE.ExtrudeGeometry(housingShape, {
    depth: 2.38, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12,
    bevelSegments: 5, curveSegments: 24,
  });
  housingGeo.translate(0, 0, -1.19);
  add(housingGeo, white, 'pump_main_housing', shell);
  cylinder(1.24, 1.24, 0.28, whiteDark, 'pump_lower_joint', 15.44, 0, 0, shell);

  // Coaxial nested sleeves. The end is an annulus with a recessed bore, not
  // overlapping solid disks or a metal pin projecting out of the spray opening.
  const nozzleY = 16.42;
  cylinderX(0.72, 2.50, white, 'nozzle_barrel', 3.00, nozzleY, 0, shell);
  cylinderX(0.80, 0.20, whiteDark, 'nozzle_barrel_joint', 4.25, nozzleY, 0, shell);
  const nozzleProfile = [
    [0.73, -0.64], [0.80, -0.55], [0.80, 0.45], [0.73, 0.58],
    [0.16, 0.58], [0.16, 0.25], [0.60, 0.25], [0.60, -0.64], [0.73, -0.64],
  ].map(p => new THREE.Vector2(...p));
  const nozzleGeo = new THREE.LatheGeometry(nozzleProfile, 64);
  nozzleGeo.rotateZ(-Math.PI / 2);
  add(nozzleGeo, black, 'adjustable_nozzle', shell, 4.82, nozzleY);
  for (let i = 0; i < 28; i++) {
    const a = i * Math.PI * 2 / 28;
    const rib = add(new THREE.BoxGeometry(0.82, 0.05, 0.09), black,
      `nozzle_grip_rib_${i}`, shell, 4.82, nozzleY + Math.cos(a) * 0.797, Math.sin(a) * 0.797);
    rib.rotation.x = a;
  }
  torusX(0.21, 0.035, whiteDark, 'spray_orifice_ring', 5.405, nozzleY, 0, shell);
  cylinderX(0.17, 0.035, rubber, 'spray_orifice', 5.03, nozzleY, 0, shell);

  // The whole blade is forward of the closure/shoulder, leaving finger clearance.
  // Geometry is local to the hinge so its exported pivot remains useful.
  const triggerPivot = new THREE.Vector3(2.42, 15.74, 0);
  const triggerAssembly = new THREE.Group();
  triggerAssembly.name = 'trigger_hinged_assembly';
  triggerAssembly.position.copy(triggerPivot); shell.add(triggerAssembly);
  const triggerShape = new THREE.Shape();
  triggerShape.moveTo(2.27, 15.84);
  triggerShape.lineTo(2.67, 15.84);
  triggerShape.quadraticCurveTo(2.95, 15.69, 2.99, 15.31);
  triggerShape.bezierCurveTo(3.08, 14.60, 3.52, 13.58, 4.32, 12.72);
  triggerShape.quadraticCurveTo(4.58, 12.45, 4.53, 12.20);
  triggerShape.quadraticCurveTo(4.50, 11.98, 4.25, 12.11);
  triggerShape.bezierCurveTo(3.34, 12.63, 2.67, 13.72, 2.35, 14.78);
  triggerShape.lineTo(2.42, 15.33);
  triggerShape.quadraticCurveTo(2.21, 15.63, 2.27, 15.84);
  const triggerGeo = new THREE.ExtrudeGeometry(triggerShape, {
    depth: 1.08, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.045,
    bevelSegments: 3, curveSegments: 28,
  });
  triggerGeo.translate(-triggerPivot.x, -triggerPivot.y, -0.54);
  const trigger = add(triggerGeo, black, 'continuous_curved_trigger_blade', triggerAssembly);
  trigger.userData.preservePivot = true;
  // Small integral grip ribs follow the actual contact curve and are seated
  // slightly into the blade, rather than floating across its side faces.
  const contactCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(2.99, 15.31, 0), new THREE.Vector3(3.08, 14.60, 0),
    new THREE.Vector3(3.52, 13.58, 0), new THREE.Vector3(4.32, 12.72, 0));
  for (let i = 0; i < 4; i++) {
    const t = 0.35 + i * 0.14;
    const p = contactCurve.getPoint(t), tangent = contactCurve.getTangent(t);
    const outward = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    p.addScaledVector(outward, -0.018).sub(triggerPivot);
    tube([[p.x, p.y, -0.47], [p.x, p.y, 0], [p.x, p.y, 0.47]],
      0.03, rubber, `trigger_finger_groove_${i}`, triggerAssembly, 8);
  }
  cylinderZ(0.17, 2.68, black, 'trigger_pivot_pin', triggerPivot.x, triggerPivot.y, 0, shell);
  for (const z of [-1.35, 1.35]) {
    cylinderZ(0.22, 0.07, whiteDark, `trigger_hinge_boss_${z}`, triggerPivot.x, triggerPivot.y, z, shell);
  }

  // Rear pressure vent and small safety lock on the pump housing.
  cylinderX(0.23, 0.12, whiteDark, 'rear_pressure_vent', -2.49, 16.34, 0, shell);
  cylinderX(0.10, 0.05, rubber, 'vent_opening', -2.575, 16.34, 0, shell);
  roundSlab(0.68, 0.30, 0.14, 0.08, black, 'trigger_safety_lock', -0.33, 16.74, 1.34, shell);

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
  cylinderX(0.24, 3.7, whiteDark, 'internal_liquid_channel', 2.25, nozzleY, 0, internals);
  cylinderX(0.10, 4.5, tubeMat, 'nozzle_feed_channel', 2.55, nozzleY, 0, internals);
  tube([[0,13.85,0],[0,12.65,0],[0.14,10.85,0],[0.38,7.3,0],[0.78,3.1,0],[1.16,1.25,0]],
    0.13, tubeMat, 'flexible_dip_tube', internals, 96);
  const filterAssembly = new THREE.Group(); filterAssembly.name = 'dip_tube_filter_assembly';
  filterAssembly.position.set(1.21, 1.20, 0); filterAssembly.rotation.z = -0.20; internals.add(filterAssembly);
  cylinder(0.37, 0.37, 0.85, whiteDark, 'dip_tube_filter', 0, 0, 0, filterAssembly, 32);
  for (let i = 0; i < 6; i++) torusY(0.35, 0.035, steel, `filter_slot_${i}`, -0.29 + i * 0.105, 0, 0, filterAssembly);
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
