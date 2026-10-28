// 空气检测仪 — 按用户提供的 UNI-T UT334G 正反面实拍程序化建模。
// 单位 cm，正面 +X，竖直 +Y，正面画面水平向右为 -Z。
// 尺寸为照片比例估算：机身约 18.5 × 8.4 × 4.5 cm，顶部采气嘴另计。
function buildAirDetector(THREE) {
  const group = new THREE.Group();
  group.name = 'air_detector_ut334g';
  const FRONT = 2.18, REAR = -2.18;
  function material(name, color, roughness = 0.7, metalness = 0) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    mat.name = name;
    return mat;
  }
  const rubber = material('detector_black_rubber', 0x181b1e, 0.86);
  const caseMat = material('detector_case_black', 0x24272b, 0.69);
  const seamMat = material('detector_recess_black', 0x090c0e, 0.9);
  const redMat = material('detector_red_grip', 0xb8192d, 0.77);
  const redRidge = material('detector_red_ribs', 0xcf2337, 0.76);
  const keyMat = material('detector_gray_keys', 0x707779, 0.82);
  const white = material('detector_alarm_windows', 0xc8d0d2, 0.37);
  const steel = material('detector_clip_steel', 0xc5cbce, 0.28, 0.48);
  steel.emissive.setHex(0x3b4246);
  steel.emissiveIntensity = 0.35;
  const metalDark = material('detector_screw_steel', 0x41494b, 0.34, 0.72);
  const gasketMat = material('nozzle_seal', 0x20272a, 0.82);

  function add(geo, mat, name, x = 0, y = 0, u = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, -u);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function polygon(points) {
    const shape = new THREE.Shape();
    points.forEach(([u, y], i) => i ? shape.lineTo(u, y) : shape.moveTo(u, y));
    shape.closePath();
    return shape;
  }
  function rounded(w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  }
  function slab(shape, depth, bevel, mat, name, x, y = 0, u = 0) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 3, curveSegments: 16,
    });
    geo.translate(0, 0, -depth / 2);
    geo.rotateY(Math.PI / 2);
    return add(geo, mat, name, x, y, u);
  }
  function cylX(r, depth, mat, name, x, y, u, segments = 32) {
    const geo = new THREE.CylinderGeometry(r, r, depth, segments);
    geo.rotateZ(-Math.PI / 2);
    return add(geo, mat, name, x, y, u);
  }
  function cylY(top, bottom, height, mat, name, x, y, u = 0) {
    return add(new THREE.CylinderGeometry(top, bottom, height, 64), mat, name, x, y, u);
  }
  function texture(name, w, h, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.name = name;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }
  function decal(tex, name, w, h, x, y, u = 0, back = false) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: tex, transparent: true, opacity: 0.999,
      depthWrite: false, roughness: 0.7,
    });
    mat.name = name + '_ink';
    const geo = new THREE.PlaneGeometry(w, h);
    geo.rotateY(back ? -Math.PI / 2 : Math.PI / 2);
    const mesh = add(geo, mat, name, x, y, u);
    mesh.castShadow = false;
    mesh.renderOrder = 2;
    return mesh;
  }

  // Narrow red center grip, wide angular black head and foot.
  const silhouette = [
    [-3.57, 9.02], [-4.02, 8.50], [-4.15, 7.68], [-4.15, 3.62],
    [-3.52, 2.40], [-3.40, -5.33], [-4.12, -6.50], [-4.12, -8.50],
    [-3.67, -9.08], [3.67, -9.08], [4.12, -8.50], [4.12, -6.50],
    [3.40, -5.33], [3.52, 2.40], [4.15, 3.62], [4.15, 7.68],
    [4.02, 8.50], [3.57, 9.02],
  ];
  slab(rounded(7.93, 17.62, 0.55), 3.64, 0.16, redMat,
    'red_central_protective_boot', 0);
  slab(polygon(silhouette), 4.05, 0.13, rubber, 'black_angular_housing', 0);
  const inset = silhouette.map(([u, y]) => [u * 0.964, y * 0.977]);
  slab(polygon(inset), 0.10, 0.045, caseMat, 'front_case_panel', FRONT - 0.055);
  slab(polygon(inset), 0.10, 0.045, caseMat, 'rear_case_panel', REAR + 0.055);
  // Fine seam follows the housing across both sidewalls.
  [-1, 1].forEach(side => {
    const sideStrip = add(new THREE.BoxGeometry(0.09, 7.55, 0.055), seamMat,
      'side_case_joint_' + side, 0, -1.43, side * 3.55);
    const gripShape = polygon([
      [-0.18, 2.78], [-0.68, 2.38], [-0.68, -4.58], [-0.18, -5.12],
      [0.18, -5.12], [0.68, -4.58], [0.68, 2.38], [0.18, 2.78],
    ]);
    // Side grip strips wrap around the shell; diagonal ribs form visible red teeth.
    const grip = slab(gripShape, 0.21, 0.05, redMat,
      'side_red_grip_' + side, 0, -1.03, side * 3.82);
    grip.rotation.y = Math.PI / 2;
    for (let i = 0; i < 7; i++) {
      const y = -4.65 + i * 1.04;
      const rib = add(new THREE.BoxGeometry(4.10, 0.19, 0.30), redRidge,
        'diagonal_grip_rib_' + side + '_' + i, 0, y, side * 3.91);
      rib.rotation.z = (i < 3 ? 1 : -1) * 0.26;
    }
  });

  // Wide upper display with clipped bottom corners and a dark glass window.
  const displayOutline = [
    [-3.24, 2.86], [-2.55, 2.24], [2.55, 2.24], [3.24, 2.86],
    [3.24, 7.54], [3.07, 7.74], [-3.07, 7.74], [-3.24, 7.54],
  ];
  slab(polygon(displayOutline), 0.10, 0.06, seamMat,
    'display_recess', FRONT + 0.015);
  slab(polygon(displayOutline.map(([u, y]) => [u * 0.972, (y - 5) * 0.972 + 5])),
    0.08, 0.025, rubber, 'display_front_bezel', FRONT + 0.10);
  const screenTex = texture('detector_screen_off', 1024, 1024, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w * 0.15, h);
    gradient.addColorStop(0, '#1e2935');
    gradient.addColorStop(0.34, '#303d4d');
    gradient.addColorStop(0.57, '#26323f');
    gradient.addColorStop(0.72, '#35414d');
    gradient.addColorStop(1, '#202d3a');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    const gleam = ctx.createLinearGradient(0, 0, w, h * 0.65);
    gleam.addColorStop(0, 'rgba(215,225,230,0)');
    gleam.addColorStop(0.48, 'rgba(215,225,230,0.045)');
    gleam.addColorStop(1, 'rgba(215,225,230,0)');
    ctx.fillStyle = gleam; ctx.fillRect(0, 0, w, h);
  });
  const screenMat = material('detector_lcd_glass', 0xffffff, 0.27);
  screenMat.map = screenTex;
  slab(rounded(5.25, 4.15, 0.07), 0.035, 0.012, screenMat,
    'blank_lcd', FRONT + 0.162, 5.21);
  const brandTex = texture('uni_t_ut334g_brand', 1536, 220, ctx => {
    ctx.fillStyle = '#c3293c'; ctx.fillRect(24, 24, 615, 170);
    ctx.fillStyle = '#e8ecec'; ctx.font = 'bold 145px Arial';
    ctx.fillText('UNI-T', 45, 165);
    ctx.font = '67px Arial'; ctx.textAlign = 'right';
    ctx.fillText('UT334G', 1500, 162);
  });
  decal(brandTex, 'front_brand_print', 5.35, 0.77, FRONT + 0.171, 2.73);

  // White windows at the top and at all four corners of the keypad.
  slab(polygon([[-1.78, 0.23], [1.78, 0.23], [1.35, -0.23], [-1.35, -0.23]]),
    0.06, 0.045, white, 'top_alarm_light_window', FRONT + 0.07, 8.16);
  for (const side of [-1, 1]) {
    for (const upper of [true, false]) {
      const triangle = upper
        ? [[-0.42, 0.28], [0.42, 0.28], [side * 0.42, -0.34]]
        : [[-0.42, -0.28], [0.42, -0.28], [side * 0.42, 0.34]];
      slab(polygon(triangle), 0.06, 0.045, white,
        'keypad_corner_window_' + side + '_' + upper,
        FRONT + 0.045, upper ? 2.30 : -3.17, side * 2.91);
    }
  }

  // Grey keys: fan / power / return, and a hexagonal OK navigation cluster.
  function button(points, name, u, y) {
    slab(polygon(points.map(([a, b]) => [a * 1.09, b * 1.09])),
      0.08, 0.035, seamMat, name + '_well', FRONT + 0.03, y, u);
    slab(polygon(points), 0.15, 0.04, keyMat, name,
      FRONT + 0.12, y, u);
  }
  const powerShape = [[-1.05, -0.44], [1.05, -0.44], [1.05, 0.44], [-1.05, 0.44]];
  button(powerShape, 'power_key', 0, 1.45);
  button([[-0.45, -0.44], [0.45, -0.44], [0.45, 0.44], [-0.45, 0.20]], 'fan_key', -1.85, 1.45);
  button([[-0.45, -0.44], [0.45, -0.20], [0.45, 0.44], [-0.45, 0.44]], 'return_key', 1.85, 1.45);
  const navY = -0.80;
  button([[-1.00, -0.56], [0, -1.08], [1.00, -0.56], [1.00, 0.56], [0, 1.08], [-1.00, 0.56]],
    'ok_hexagonal_key', 0, navY);
  button([[-0.45, -0.44], [0.45, -0.12], [0.45, 0.61], [-0.45, 0.31]], 'up_key', -1.68, navY + 0.65);
  button([[-0.45, -0.31], [0.45, -0.61], [0.45, 0.12], [-0.45, 0.44]], 'left_key', -1.68, navY - 0.65);
  button([[-0.45, -0.12], [0.45, -0.44], [0.45, 0.31], [-0.45, 0.61]], 'right_key', 1.68, navY + 0.65);
  button([[-0.45, -0.61], [0.45, -0.31], [0.45, 0.44], [-0.45, 0.12]], 'down_key', 1.68, navY - 0.65);
  const keysTex = texture('detector_key_symbols', 1200, 1200, (ctx, w, h) => {
    const px = u => (u + 3) / 6 * w;
    const py = y => (2.25 - y) / 5 * h;
    ctx.fillStyle = '#414b4f'; ctx.strokeStyle = '#414b4f';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const text = (label, u, y, size) => {
      ctx.font = `${size}px Arial, sans-serif`; ctx.fillText(label, px(u), py(y));
    };
    text('OK', 0, navY, 87);
    text('▲', -1.68, navY + 0.65, 69);
    text('◀', -1.68, navY - 0.65, 69);
    text('▶', 1.68, navY + 0.65, 69);
    text('▼', 1.68, navY - 0.65, 69);
    text('↶', 1.85, 1.45, 110);
    // Pump/fan symbol.
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3;
      ctx.beginPath(); ctx.ellipse(px(-1.85) + Math.cos(a) * 24, py(1.45) + Math.sin(a) * 24,
        27, 19, a, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.stroke();
    }
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(px(0), py(1.45), 51, -Math.PI * 0.36, Math.PI * 1.36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px(0), py(1.45) - 64); ctx.lineTo(px(0), py(1.45) + 4); ctx.stroke();
  });
  decal(keysTex, 'keypad_symbol_print', 6, 5, FRONT + 0.238, -0.25);

  // Large plain inset at the foot of the front panel.
  const lowerPanel = [[-3.12, -4.22], [-2.48, -3.66], [2.48, -3.66], [3.12, -4.22],
    [3.12, -5.94], [2.84, -6.52], [3.10, -7.94], [-3.10, -7.94], [-2.84, -6.52], [-3.12, -5.94]];
  slab(polygon(lowerPanel.map(([u, y]) => [u * 1.015, (y + 5) * 1.015 - 5])),
    0.06, 0.025, seamMat, 'lower_front_panel_seam', FRONT + 0.005);
  slab(polygon(lowerPanel), 0.065, 0.035, rubber, 'lower_front_blank_panel', FRONT + 0.06);
  slab(polygon([[-1.23, 0.20], [1.23, 0.20], [0.95, -0.20], [-0.95, -0.20]]),
    0.17, 0.045, caseMat, 'bottom_front_latch', FRONT + 0.13, -8.55);

  // Top sampling nozzle: tapered black socket, seal, clear filter collar and tip.
  cylY(1.02, 1.25, 1.04, rubber, 'sampling_nozzle_base', 0, 9.42);
  cylY(0.81, 1.02, 0.71, caseMat, 'sampling_nozzle_neck', 0, 10.21);
  cylY(0.88, 0.88, 0.10, gasketMat, 'sampling_nozzle_gasket', 0, 10.60);
  const clearMat = new THREE.MeshPhysicalMaterial({
    color: 0xe3e9ed, transparent: true, opacity: 0.40, roughness: 0.19,
    metalness: 0, clearcoat: 0.8, depthWrite: false, side: THREE.DoubleSide,
  });
  clearMat.name = 'clear_sampling_filter_plastic';
  cylY(0.90, 0.90, 0.63, clearMat, 'transparent_filter_collar', 0, 10.93);
  for (const y of [10.66, 10.82, 11.06, 11.21]) {
    cylY(0.93, 0.93, 0.055, clearMat, 'filter_collar_rib_' + y, 0, y);
  }
  cylY(0.56, 0.61, 0.44, white, 'filter_inner_core', 0, 10.91);
  cylY(0.26, 0.42, 0.42, clearMat, 'sampling_inlet_tip', 0, 11.43);
  cylY(0.12, 0.12, 0.018, gasketMat, 'sampling_inlet_opening', 0, 11.65);

  // Rear upper battery molding, recessed screws and round buzzer perforations.
  slab(polygon([[-3.24, 3.03], [-2.85, 2.58], [2.85, 2.58], [3.24, 3.03],
    [3.24, 7.92], [2.98, 8.15], [-2.98, 8.15], [-3.24, 7.92]]),
    0.12, 0.055, caseMat, 'rear_upper_molding', REAR - 0.07);
  for (const y of [-7.70, 7.65]) {
    for (const u of [-3.16, 3.16]) {
      cylX(0.27, 0.035, seamMat, 'rear_screw_recess_' + y + '_' + u,
        REAR - 0.14, y, u);
      if (y < 0) {
        cylX(0.15, 0.04, metalDark, 'rear_screw_' + u, REAR - 0.17, y, u);
        for (const angle of [0, Math.PI / 2]) {
          const slot = add(new THREE.BoxGeometry(0.015, 0.035, 0.22), seamMat,
            'rear_screw_slot_' + u + '_' + angle, REAR - 0.197, y, u);
          slot.rotation.x = angle;
        }
      }
    }
  }
  for (let row = -4; row <= 4; row++) {
    for (let col = -4; col <= 4; col++) {
      if (row * row + col * col > 19) continue;
      cylX(0.052, 0.02, seamMat, 'buzzer_hole_' + row + '_' + col,
        REAR - 0.055, -6.18 + row * 0.285, col * 0.285, 12);
    }
  }

  // Product plate and a separate non-scannable identification graphic.
  const labelTex = texture('ut334g_rear_product_plate', 1440, 820, (ctx, w, h) => {
    ctx.fillStyle = '#e5e7e5'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#26303c'; ctx.textBaseline = 'middle';
    const labels = [
      '产品名称：泵吸式四合一气体检测仪', '产品型号：UT334G',
      '检测气体：可燃气体、硫化氢、一氧化碳、氧气',
      '防爆型号：CNEx21.5787X', '防爆标志：Ex ib ⅡB T3 Gb',
    ];
    labels.forEach((label, i) => {
      ctx.font = `${i === 0 ? 59 : 53}px "Microsoft YaHei", Arial, sans-serif`;
      ctx.fillText(label, 65, 130 + i * 140);
    });
  });
  slab(rounded(5.25, 2.90, 0.25), 0.04, 0.02, white,
    'rear_product_plate', REAR - 0.045, -2.16);
  decal(labelTex, 'rear_product_plate_print', 5.1, 2.76, REAR - 0.091, -2.16, 0, true);
  const idTex = texture('rear_identification_graphic', 320, 320, (ctx, w, h) => {
    ctx.fillStyle = '#e9ebe6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#26313c';
    // Decorative grid only; no reference-image serial number or scannable QR payload.
    for (let r = 0; r < 17; r++) for (let c = 0; c < 17; c++) {
      if ((r * 11 + c * 7 + r * c) % 9 < 4) ctx.fillRect(35 + c * 14, 20 + r * 14, 12, 12);
    }
    ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.fillText('UT334G', 160, 294);
  });
  decal(idTex, 'rear_identification_label', 1.28, 1.28, REAR - 0.09, 0.05, 0, true);

  // Polished spring clip and D-shaped suspension ring on the upper back.
  slab(rounded(2.50, 3.04, 0.39), 0.14, 0.09, steel,
    'rear_belt_clip', REAR - 0.52, 4.62);
  slab(rounded(2.09, 2.58, 0.23), 0.025, 0.025, steel,
    'belt_clip_center_face', REAR - 0.70, 4.62);
  const hinge = add(new THREE.CylinderGeometry(0.16, 0.16, 2.77, 32), steel,
    'belt_clip_hinge', REAR - 0.48, 6.18, 0);
  hinge.rotation.x = Math.PI / 2;
  const ringPath = new THREE.CurvePath();
  ringPath.add(new THREE.LineCurve3(new THREE.Vector3(REAR - 0.43, 6.13, -1.28),
    new THREE.Vector3(REAR - 0.43, 6.13, 1.28)));
  // Smooth upper D arch, with short vertical sides meeting the hinge.
  const ringPoints = [];
  for (let i = 0; i <= 48; i++) {
    const a = i * Math.PI / 48;
    ringPoints.push(new THREE.Vector3(REAR - 0.43, 6.13 + 1.72 * Math.sin(a), 1.28 * Math.cos(a)));
  }
  for (let i = 1; i < ringPoints.length; i++) {
    ringPath.add(new THREE.LineCurve3(ringPoints[i - 1], ringPoints[i]));
  }
  add(new THREE.TubeGeometry(ringPath, 100, 0.095, 10, true), steel, 'rear_suspension_D_ring');

  // Bottom service opening and protective flap.
  add(new THREE.BoxGeometry(1.10, 0.12, 2.38), seamMat,
    'bottom_service_port_recess', -0.3, -9.12, 0);
  add(new THREE.BoxGeometry(1.20, 0.22, 2.61), rubber,
    'bottom_service_port_cover', -0.3, -9.25, 0);
  return group;
}
