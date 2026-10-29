// 定位器调试信号源 — 通用工业手持式过程校验仪外观。
// 单位 cm，正面 +X、背面 -X；无指定型号/图纸，尺寸与内部布局均为示意。
function buildPositionerSignalSource(THREE) {
  const root = new THREE.Group();
  root.name = 'positioner_signal_source';

  const material = (name, color, roughness = 0.65, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.name = name;
    return m;
  };
  const orange = material('safety_orange_rubber', 0xe87818, 0.86);
  const orangeDark = material('rubber_recess_orange', 0x9e4310, 0.9);
  const graphite = material('graphite_front_panel', 0x252e33, 0.73);
  const edge = material('case_seam_black', 0x11191d, 0.85);
  const keyMat = material('keypad_dark_elastomer', 0x465159, 0.8);
  const paleKey = material('navigation_key_grey', 0x98a3a5, 0.67);
  const black = material('socket_and_cable_black', 0x111719, 0.78);
  const red = material('positive_terminal_red', 0xc8332d, 0.62);
  const green = material('hart_terminal_green', 0x3d8e64, 0.67);
  const steel = material('stainless_hardware', 0xa5b2b6, 0.28, 0.82);
  const gold = material('gold_plated_contacts', 0xd5aa48, 0.3, 0.75);
  const pcb = material('main_pcb_green', 0x175c46, 0.7);
  const chip = material('ic_package_black', 0x1a2226, 0.75);
  const battery = material('battery_wrap_blue', 0x246b91, 0.7);
  const white = material('component_print_white', 0xdde8e5, 0.8);

  function mesh(geo, mat, name, parent = root, x = 0, y = 0, u = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, -u);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function roundRect(w, h, r) { return MK.roundedRectShape(THREE, w, h, r); }
  function slab(shape, depth, bevel, mat, name, x, y = 0, u = 0, parent = root) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelSize: bevel,
      bevelThickness: bevel, bevelSegments: 3, curveSegments: 12,
    });
    g.translate(0, 0, -depth / 2);
    g.rotateY(Math.PI / 2);
    return mesh(g, mat, name, parent, x, y, u);
  }
  function cylinder(r, length, mat, name, x, y, u, parent = root, segments = 48) {
    const g = new THREE.CylinderGeometry(r, r, length, segments);
    g.rotateZ(-Math.PI / 2);
    return mesh(g, mat, name, parent, x, y, u);
  }
  function torus(r, tube, mat, name, x, y, u, parent = root) {
    const g = new THREE.TorusGeometry(r, tube, 10, 48);
    g.rotateY(Math.PI / 2);
    return mesh(g, mat, name, parent, x, y, u);
  }
  function texture(name, w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.name = name;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  function print(tex, name, w, h, x, y, u = 0, back = false, parent = root) {
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: tex, transparent: true, depthWrite: false,
      roughness: 0.72, polygonOffset: true, polygonOffsetFactor: -2,
    });
    m.name = name + '_ink';
    const g = new THREE.PlaneGeometry(w, h);
    g.rotateY(back ? -Math.PI / 2 : Math.PI / 2);
    const p = mesh(g, m, name, parent, x, y, u);
    p.castShadow = false;
    p.renderOrder = 2;
    return p;
  }
  function cable(points, mat, name, radius = 0.12) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, 100, radius, 10, false);
    return mesh(g, mat, name);
  }

  const housing = new THREE.Group();
  housing.name = 'external_housing_and_controls';
  root.add(housing);

  // Thick shockproof boot, dark front insert and a continuous rear case seam.
  slab(roundRect(9.7, 20.8, 1.35), 3.70, 0.20, orange,
    'orange_shockproof_boot', 0, 0, 0, housing);
  slab(roundRect(9.12, 20.15, 1.08), 3.79, 0.09, edge,
    'case_perimeter_seam', 0.02, 0, 0, housing);
  slab(roundRect(8.82, 19.78, 0.91), 0.20, 0.075, graphite,
    'front_control_panel', 1.96, 0, 0, housing);
  slab(roundRect(8.54, 19.40, 0.82), 0.20, 0.05, orangeDark,
    'rear_battery_cover', -1.95, 0, 0, housing);

  // Rubber corner bumpers and side grip ribs.
  for (const y of [-8.60, 8.60]) {
    for (const u of [-4.12, 4.12]) {
      slab(roundRect(1.20, 2.10, 0.43), 3.92, 0.12, orange,
        `corner_bumper_${y}_${u}`, 0, y, u, housing);
    }
  }
  for (const u of [-4.63, 4.63]) {
    for (let i = 0; i < 10; i++) {
      slab(roundRect(0.27, 0.78, 0.11), 2.56, 0.055, orangeDark,
        `side_grip_${u}_${i}`, -0.05, -4.2 + i * 0.90, u, housing);
    }
  }

  // Recessed backlit LCD. Readout corresponds to a 50% valve-position test.
  slab(roundRect(7.80, 5.38, 0.38), 0.20, 0.065, edge,
    'lcd_outer_bezel', 2.10, 5.57, 0, housing);
  slab(roundRect(7.31, 4.91, 0.24), 0.13, 0.035, keyMat,
    'lcd_inner_bezel', 2.22, 5.57, 0, housing);
  const lcdTex = texture('positioner_loop_display', 1400, 900, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#b4d2c0'); bg.addColorStop(1, '#789e91');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#193d39';
    ctx.font = 'bold 49px Arial'; ctx.fillText('LOOP  /  SOURCE', 62, 76);
    ctx.textAlign = 'right'; ctx.fillText('24V', 1327, 76);
    ctx.fillRect(60, 109, 1280, 5);
    ctx.textAlign = 'left'; ctx.font = 'bold 238px "Courier New", monospace';
    ctx.fillText('12.000', 54, 371);
    ctx.font = 'bold 91px Arial'; ctx.fillText('mA', 1120, 366);
    ctx.font = 'bold 54px Arial'; ctx.fillText('VALVE POSITION DEMAND', 65, 467);
    ctx.font = 'bold 103px Arial'; ctx.fillText('50.0 %', 64, 594);
    ctx.strokeStyle = '#254d45'; ctx.lineWidth = 8;
    ctx.strokeRect(64, 650, 1270, 67);
    ctx.fillStyle = '#254d45'; ctx.fillRect(75, 661, 625, 45);
    ctx.font = 'bold 47px Arial';
    ctx.fillText('HART', 65, 812);
    ctx.fillText('●  LOOP POWER ON', 287, 812);
    ctx.textAlign = 'right'; ctx.fillText('0—25mA', 1332, 812);
    const sheen = ctx.createLinearGradient(0, 0, 0, 310);
    sheen.addColorStop(0, 'rgba(255,255,255,.22)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen; ctx.fillRect(0, 0, w, 310);
  });
  const lcdMat = new THREE.MeshBasicMaterial({ map: lcdTex, color: 0xffffff });
  lcdMat.name = 'backlit_loop_lcd';
  // LCD uses a dedicated UV plane: a textured ExtrudeGeometry would shrink the readout
  // into its cap UVs and make the text visible only at grazing angles.
  const lcdPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.03, 4.63), lcdMat);
  lcdPlane.geometry.rotateY(Math.PI / 2);
  lcdPlane.position.set(2.36, 5.57, 0);
  lcdPlane.name = 'active_lcd_12mA';
  lcdPlane.renderOrder = 3;
  housing.add(lcdPlane);

  const headerTex = texture('signal_source_header', 1400, 180, ctx => {
    ctx.fillStyle = '#f2a13b'; ctx.font = 'bold 78px Arial';
    ctx.fillText('PROCESS  /  420', 20, 93);
    ctx.fillStyle = '#c7d1d3'; ctx.font = 'bold 36px "Microsoft YaHei", Arial';
    ctx.fillText('定位器调试信号源', 31, 151);
    ctx.textAlign = 'right'; ctx.font = 'bold 46px Arial';
    ctx.fillText('mA  •  HART', 1370, 128);
  });
  print(headerTex, 'instrument_brand_and_title', 7.95, 1.02, 2.105, 8.74, 0, false, housing);

  // Four soft keys below the display and five-button navigation cluster.
  [-2.75, -0.93, 0.93, 2.75].forEach((u, i) => {
    slab(roundRect(1.48, 0.64, 0.18), 0.17, 0.045, edge,
      `softkey_well_${i}`, 2.11, 2.26, u, housing);
    slab(roundRect(1.32, 0.49, 0.13), 0.20, 0.035, i === 3 ? orange : keyMat,
      `softkey_${i}`, 2.24, 2.26, u, housing);
  });
  cylinder(1.47, 0.14, edge, 'navigation_recess', 2.09, -0.22, 0, housing);
  cylinder(1.29, 0.19, keyMat, 'navigation_ring', 2.23, -0.22, 0, housing);
  cylinder(0.63, 0.26, paleKey, 'navigation_enter_key', 2.39, -0.22, 0, housing);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const arrow = new THREE.Shape();
    arrow.moveTo(0, 0.30); arrow.lineTo(-0.22, -0.16); arrow.lineTo(0.22, -0.16); arrow.closePath();
    const m = slab(arrow, 0.06, 0.015, paleKey, `navigation_arrow_${i}`,
      2.36, -0.22 + Math.cos(a) * 0.98, Math.sin(a) * 0.98, housing);
    m.rotation.x = -a;
  }
  // Dedicated 0/25/100% step-test keys for valve stroke checks.
  [-2.63, 0, 2.63].forEach((u, i) => {
    slab(roundRect(2.04, 0.90, 0.24), 0.19, 0.055, i === 1 ? paleKey : keyMat,
      `valve_step_key_${[0, 50, 100][i]}`, 2.23, -2.75, u, housing);
  });
  cylinder(0.42, 0.20, red, 'power_button', 2.20, -4.35, -3.03, housing);
  slab(roundRect(4.60, 0.66, 0.18), 0.14, 0.035, keyMat,
    'hart_mode_key', 2.20, -4.38, 0.64, housing);

  // Recessed 4 mm safety sockets: mA source, common and HART communication.
  const ports = [
    { u: -2.62, color: green, id: 'HART' },
    { u: 0, color: black, id: 'COM' },
    { u: 2.62, color: red, id: 'mA' },
  ];
  ports.forEach(({ u, color, id }) => {
    cylinder(0.69, 0.12, edge, `${id}_socket_recess`, 2.105, -7.46, u, housing);
    torus(0.48, 0.11, color, `${id}_safety_collar`, 2.24, -7.46, u, housing);
    cylinder(0.34, 0.14, black, `${id}_socket_hole`, 2.23, -7.46, u, housing);
    cylinder(0.15, 0.16, gold, `${id}_socket_contact`, 2.20, -7.46, u, housing);
  });
  // Four visible Torx-style front screws.
  for (const y of [-8.96, 8.95]) for (const u of [-3.83, 3.83]) {
    cylinder(0.19, 0.08, edge, `front_screw_well_${y}_${u}`, 2.105, y, u, housing, 24);
    cylinder(0.135, 0.06, steel, `front_screw_${y}_${u}`, 2.15, y, u, housing, 24);
    const slot = mesh(new THREE.BoxGeometry(0.02, 0.035, 0.18), edge,
      `front_screw_slot_${y}_${u}`, housing, 2.19, y, u);
    slot.rotation.x = Math.PI / 4;
  }

  const panelTex = texture('signal_source_panel_legends', 1200, 2600, (ctx, w, h) => {
    const px = u => (u + 4.5) / 9 * w;
    const py = y => (10 - y) / 20 * h;
    const text = (s, u, y, size = 33, color = '#d9e0df') => {
      ctx.fillStyle = color; ctx.font = `bold ${size}px Arial, "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, px(u), py(y));
    };
    ['STEP', 'RANGE', '24V', 'SETUP'].forEach((s, i) => text(s, [-2.75, -0.93, 0.93, 2.75][i], 2.26, 28));
    text('0 %', -2.63, -2.75, 38); text('50 %', 0, -2.75, 38, '#203137'); text('100 %', 2.63, -2.75, 38);
    text('ENTER', 0, -0.22, 22, '#24343a');
    text('POWER', -3.03, -3.62, 22); text('HART  /  POSITIONER', 0.64, -4.38, 26);
    text('HART', -2.62, -6.47, 29, '#75b598'); text('COM', 0, -6.47, 29); text('mA  +', 2.62, -6.47, 29, '#ed8271');
    text('250 Ω', -2.62, -8.60, 24, '#9faeae'); text('−', 0, -8.60, 37); text('4—20 mA', 2.62, -8.60, 24, '#d6dddd');
    text('⏻', -3.03, -4.35, 38);
    text('ISOLATED LOOP CALIBRATOR', 0, -9.40, 21, '#8e9c9e');
  });
  print(panelTex, 'front_panel_legends', 9, 20, 2.155, 0, 0, false, housing);

  // Rear folding support, screw and battery label (also shell-managed).
  slab(roundRect(5.56, 10.1, 0.48), 0.18, 0.065, edge,
    'rear_stand_recess', -2.10, -1.7, 0, housing);
  slab(roundRect(5.16, 9.68, 0.40), 0.30, 0.075, graphite,
    'rear_folding_stand', -2.27, -1.7, 0, housing);
  cylinder(0.39, 5.00, edge, 'rear_stand_hinge', -2.28, 3.20, 0, housing).rotation.y = Math.PI / 2;
  const rearTex = texture('signal_source_rear_label', 800, 1000, ctx => {
    ctx.fillStyle = '#d5dbd7'; ctx.fillRect(0, 0, 800, 1000);
    ctx.strokeStyle = '#283238'; ctx.lineWidth = 12; ctx.strokeRect(25, 25, 750, 950);
    ctx.fillStyle = '#283238'; ctx.textAlign = 'center';
    ctx.font = 'bold 64px Arial'; ctx.fillText('PROCESS / 420', 400, 130);
    ctx.font = 'bold 41px "Microsoft YaHei", Arial'; ctx.fillText('定位器调试信号源', 400, 210);
    ctx.font = '32px Arial';
    ['OUTPUT   0—25 mA DC', 'LOOP POWER   24 V DC', 'HART   250 Ω', '', '通用外观设计 · 尺寸示意', '', '巡检 / 维护 / 行程校验'].forEach((s, i) => ctx.fillText(s, 400, 330 + i * 68));
    for (let i = 0; i < 49; i++) ctx.fillRect(115 + i * 11, 830, i % 3 ? 3 : 7, 80);
  });
  print(rearTex, 'rear_specification_label', 4.20, 5.25, -2.445, -1.3, 0, true, housing);
  MK.markShell(housing);

  // Internal assembly: two stacked PCBs, display module, battery and wiring.
  const internal = new THREE.Group(); internal.name = 'internal_electronics'; root.add(internal);
  slab(roundRect(7.86, 10.70, 0.48), 0.15, 0.02, pcb,
    'main_logic_pcb', -0.42, 4.05, 0, internal);
  slab(roundRect(6.82, 4.70, 0.20), 0.32, 0.02, edge,
    'lcd_driver_module', 0.35, 5.53, 0, internal);
  slab(roundRect(6.46, 4.30, 0.14), 0.14, 0.015, pcb,
    'lcd_driver_pcb', 0.57, 5.53, 0, internal);
  slab(roundRect(1.72, 1.72, 0.12), 0.50, 0.035, chip,
    'microcontroller', 0.00, 0.50, -0.70, internal);
  slab(roundRect(1.10, 1.10, 0.09), 0.38, 0.025, chip,
    'hart_modem', 0.00, -0.62, -1.6, internal);
  slab(roundRect(1.48, 0.76, 0.08), 0.42, 0.025, chip,
    'isolated_dac', 0.00, 2.57, -1.70, internal);
  // Loop-power transformer, HART resistor and terminal block.
  slab(roundRect(1.65, 1.65, 0.10), 1.30, 0.035, chip,
    'isolation_transformer', -0.04, 2.32, 1.63, internal);
  slab(roundRect(2.32, 0.56, 0.08), 0.42, 0.025, material('precision_resistor_blue', 0x457f99),
    'hart_250ohm_resistor', 0.03, -1.30, 1.80, internal);
  [-2.45, 0, 2.45].forEach((u, i) => {
    slab(roundRect(1.72, 1.15, 0.12), 1.0, 0.035, i === 0 ? green : (i === 2 ? red : black),
      `internal_terminal_${i}`, -0.15, -6.82, u, internal);
    cylinder(0.25, 0.12, steel, `terminal_screw_${i}`, 0.40, -6.82, u, internal);
  });
  // Four AA cells, split into two pairs with visible metal caps.
  for (let i = 0; i < 4; i++) {
    const u = -2.55 + i * 1.70;
    cylinder(0.68, 5.58, battery, `AA_battery_${i + 1}`, -1.05, -5.20, u, internal, 32).rotation.y = Math.PI / 2;
    // Cylinder was X-aligned, turn its axis into Y without moving its centre.
    const capTop = cylinder(0.36, 0.16, steel, `AA_positive_cap_${i + 1}`, -1.05, -2.33, u, internal, 24);
    capTop.rotation.z = Math.PI / 2;
    const capBottom = cylinder(0.51, 0.12, steel, `AA_negative_cap_${i + 1}`, -1.05, -8.07, u, internal, 24);
    capBottom.rotation.z = Math.PI / 2;
  }
  // Battery cradle on the rear half leaves the front board components visible.
  slab(roundRect(7.00, 6.78, 0.32), 0.18, 0.035, black,
    'battery_cradle_base', -1.65, -5.20, 0, internal);
  for (const u of [-3.45, 3.45]) slab(roundRect(0.24, 6.78, 0.10), 0.82, 0.035, black,
    `battery_cradle_rail_${u}`, -1.37, -5.20, u, internal);
  for (let i = 0; i < 14; i++) {
    const y = -4.6 + (i % 7) * 1.38, u = i < 7 ? -3.55 : 3.55;
    slab(roundRect(0.35, 0.65, 0.035), 0.18, 0.01, gold,
      `pcb_test_pad_${i}`, -0.28, y, u, internal);
  }
  // Ribbon and power leads remain with the internal assembly.
  cable([[0.65,3.1,-2.8],[0.65,3.6,-1.4],[0.25,3.7,0],[0.0,2.8,1.7]], white, 'lcd_ribbon_cable', 0.18);
  cable([[-0.65,-3.1,2.3],[-0.2,-4.2,2.4],[0.0,-5.4,2.5],[-0.15,-6.3,2.5]], red, 'internal_positive_wire', 0.075);
  cable([[-0.65,-3.1,-2.3],[-0.2,-4.2,-2.4],[0.0,-5.4,-2.5],[-0.15,-6.3,-2.5]], black, 'internal_common_wire', 0.075);

  // Plugged-in silicone leads with strain reliefs and relaxed service loops.
  function addTestLead(sign, mat, u, side) {
    cylinder(0.34, 1.04, mat, `${sign}_banana_plug`, 2.72, -7.46, u);
    cylinder(0.24, 1.10, mat, `${sign}_strain_relief`, 3.67, -7.46, u);
    for (let i = 0; i < 5; i++) torus(0.245, 0.045, mat, `${sign}_relief_rib_${i}`, 3.25 + i * 0.19, -7.46, u);
    const zu = -u;
    // Cable geometry is intentionally omitted: Unity generates it between the two
    // exported endpoints. Only the plug, strain relief and alligator clip remain.
    root.userData[`${sign}_plug_end`] = [4.22, -7.46, zu];
    root.userData[`${sign}_clip_end`] = [2.45, -5.86, -(zu + side * 6.5)];
    // Insulated alligator clip pointing upward, with exposed jaw and spring pivot.
    const clip = new THREE.Group(); clip.name = `${sign}_alligator_clip`; root.add(clip);
    const cx = 2.45, cy = -4.85, cz = -(zu + side * 6.5);
    const body = mesh(new THREE.BoxGeometry(0.62, 2.18, 0.66), mat,
      `${sign}_clip_insulated_body`, clip, cx, cy, cz);
    body.rotation.z = side * 0.10;
    mesh(new THREE.BoxGeometry(0.42, 1.32, 0.47), steel,
      `${sign}_clip_metal_jaw`, clip, cx, cy + 1.58, cz);
    mesh(new THREE.BoxGeometry(0.43, 0.20, 0.48), edge,
      `${sign}_clip_jaw_gap`, clip, cx, cy + 1.65, cz);
    cylinder(0.26, 0.76, steel, `${sign}_clip_pivot`, cx, cy + 0.68, cz, clip).rotation.y = Math.PI / 2;
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(0.65, 0.08, 0.70), edge,
      `${sign}_clip_grip_${i}`, clip, cx, cy - 0.60 + i * 0.20, cz);
  }
  addTestLead('positive', red, 2.62, 1);
  addTestLead('common', black, 0, -1);

  root.userData.description = '通用定位器调试信号源：4–20mA / 24V回路 / HART；无指定实机图纸，内部结构与尺寸为示意。';
  return root;
}
