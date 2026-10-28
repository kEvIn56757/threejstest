// 数字万用表2 — 依据用户提供的 FLUKE 117C 正反面照片建模。
// 单位 cm，正面 +X，背面 -X；整体尺寸约 17.5 × 8.5 × 4.2 cm（照片估算）。
function buildMultimeter2(THREE) {
  const group = new THREE.Group();
  group.name = 'digital_multimeter_2';
  const FRONT = 2.02;
  const BACK = -1.98;
  const material = (name, color, roughness = 0.65, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.name = name;
    return m;
  };
  const yellow = material('fluke_yellow_rubber', 0xe6ad08, 0.85);
  const darkYellow = material('holster_recess_yellow', 0xb88507, 0.9);
  const panel = material('front_graphite', 0x303a42, 0.72);
  const panelEdge = material('case_seam_dark', 0x171d21, 0.8);
  const knobMat = material('selector_graphite', 0x2d353b, 0.63);
  const ridgeMat = material('selector_ridges', 0x374148, 0.69);
  const black = material('socket_recess_black', 0x080b0c, 0.9);
  const red = material('input_socket_red', 0xaa2430, 0.6);
  const silver = material('hardware_steel', 0x939da0, 0.32, 0.75);
  const lavender = material('hold_button_lavender', 0x7b8fc2, 0.65);
  const keyYellow = material('function_button_yellow', 0xefb400, 0.56);

  function add(geo, mat, name, x = 0, y = 0, u = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, -u);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function roundRect(w, h, r) {
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
  function profile(scale = 1) {
    const s = new THREE.Shape();
    const p = (u, y) => [u * scale, y * scale];
    s.moveTo(...p(-3.35, 8.15));
    s.quadraticCurveTo(...p(0, 8.75), ...p(3.35, 8.15));
    s.quadraticCurveTo(...p(4.15, 8.08), ...p(4.13, 6.75));
    s.bezierCurveTo(...p(4.12, 3.9), ...p(3.18, 0.2), ...p(3.40, -2.6));
    s.lineTo(...p(3.65, -6.85));
    s.quadraticCurveTo(...p(3.73, -8.35), ...p(2.65, -8.40));
    s.quadraticCurveTo(...p(0, -8.78), ...p(-2.65, -8.40));
    s.quadraticCurveTo(...p(-3.73, -8.35), ...p(-3.65, -6.85));
    s.lineTo(...p(-3.40, -2.6));
    s.bezierCurveTo(...p(-3.18, 0.2), ...p(-4.12, 3.9), ...p(-4.13, 6.75));
    s.quadraticCurveTo(...p(-4.15, 8.08), ...p(-3.35, 8.15));
    return s;
  }
  function slab(shape, depth, bevel, mat, name, x, y = 0, u = 0) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelSize: bevel,
      bevelThickness: bevel, bevelSegments: 4, curveSegments: 16,
    });
    geo.translate(0, 0, -depth / 2);
    geo.rotateY(Math.PI / 2);
    return add(geo, mat, name, x, y, u);
  }
  function cylinder(radius, length, mat, name, x, y, u, segments = 64) {
    const geo = new THREE.CylinderGeometry(radius, radius, length, segments);
    geo.rotateZ(-Math.PI / 2);
    return add(geo, mat, name, x, y, u);
  }
  function ring(radius, tube, mat, name, x, y, u) {
    const geo = new THREE.TorusGeometry(radius, tube, 10, 64);
    geo.rotateY(Math.PI / 2);
    return add(geo, mat, name, x, y, u);
  }
  function canvasTexture(name, width, height, draw) {
    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    draw(c.getContext('2d'), width, height);
    const tex = new THREE.CanvasTexture(c);
    tex.name = name;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }
  function printPlane(tex, name, w, h, x, y, u, back = false) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: tex, transparent: true, opacity: 0.999,
      depthWrite: false, roughness: 0.78, polygonOffset: true,
      polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    mat.name = name + '_ink';
    const geo = new THREE.PlaneGeometry(w, h);
    geo.rotateY(back ? -Math.PI / 2 : Math.PI / 2);
    const mesh = add(geo, mat, name, x, y, u);
    mesh.castShadow = false;
    mesh.renderOrder = 2;
    return mesh;
  }

  // Thick rubber protective boot with a distinct waist and inset instrument case.
  slab(profile(), 3.45, 0.22, yellow, 'yellow_protective_holster', 0);
  slab(profile(0.924), 3.55, 0.10, panelEdge, 'instrument_case', 0.06);
  slab(profile(0.916), 0.16, 0.055, panel, 'front_face_panel', FRONT - 0.12);

  // LCD assembly: broad grey-green blank display and an arched upper bezel.
  slab(roundRect(7.0, 4.35, 0.35), 0.20, 0.08, panelEdge,
    'display_outer_frame', FRONT + 0.01, 5.53);
  slab(roundRect(6.65, 3.25, 0.24), 0.10, 0.04, knobMat,
    'display_inner_frame', FRONT + 0.13, 5.12);
  const lcdTex = canvasTexture('blank_lcd_surface', 1024, 512, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w * 0.15, h);
    gradient.addColorStop(0, '#5a6865');
    gradient.addColorStop(0.25, '#69736b');
    gradient.addColorStop(0.8, '#59635c');
    gradient.addColorStop(1, '#4c5955');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    const reflection = ctx.createLinearGradient(0, 0, 0, h);
    reflection.addColorStop(0, 'rgba(220,230,220,0.05)');
    reflection.addColorStop(0.24, 'rgba(220,230,220,0.10)');
    reflection.addColorStop(0.37, 'rgba(220,230,220,0)');
    ctx.fillStyle = reflection; ctx.fillRect(0, 0, w, h);
  });
  const lcdMat = material('blank_lcd_glass', 0xffffff, 0.3);
  lcdMat.map = lcdTex;
  slab(roundRect(6.13, 2.75, 0.10), 0.035, 0.015, lcdMat,
    'blank_lcd_screen', FRONT + 0.215, 5.12);

  const headerTex = canvasTexture('fluke_117c_header', 1536, 240, (ctx) => {
    ctx.fillStyle = '#d5b149'; ctx.fillRect(20, 66, 520, 114);
    ctx.fillStyle = '#253039'; ctx.font = 'bold 102px Arial';
    ctx.fillText('FLUKE', 48, 158);
    ctx.fillStyle = '#d8dedc'; ctx.font = 'italic bold 82px Arial';
    ctx.fillText('117C', 560, 139);
    ctx.font = 'italic 54px Arial';
    ctx.fillText('TRUE RMS', 805, 111);
    ctx.fillText('MULTIMETER', 805, 170);
  });
  printPlane(headerTex, 'brand_and_model_print', 6.8, 1.05, FRONT + 0.21, 7.12, 0);

  // Four rectangular keys, plus a separate circular backlight button.
  const buttonUs = [-2.53, -0.93, 0.67, 2.27];
  buttonUs.forEach((u, i) => {
    slab(roundRect(1.35, 0.83, 0.16), 0.10, 0.035, black,
      'key_recess_' + i, FRONT + 0.02, 2.57, u);
    slab(roundRect(1.16, 0.65, 0.11), 0.18, 0.035,
      [lavender, knobMat, knobMat, keyYellow][i],
      'function_key_' + i, FRONT + 0.14, 2.57, u);
  });
  cylinder(0.44, 0.16, black, 'backlight_button_recess', FRONT + 0.04, 1.22, 2.5);
  cylinder(0.36, 0.22, knobMat, 'backlight_button', FRONT + 0.16, 1.22, 2.5);

  // Mode switch is offset left, leaving a vertical column of symbols on the right.
  const dialU = -0.9, dialY = -1.58, dialR = 2.40;
  cylinder(dialR + 0.10, 0.16, black, 'selector_recess', FRONT + 0.055, dialY, dialU);
  cylinder(dialR, 0.43, knobMat, 'large_rotary_selector', FRONT + 0.29, dialY, dialU, 96);
  for (let i = 0; i < 56; i++) {
    const angle = i * Math.PI * 2 / 56;
    const tooth = add(new THREE.BoxGeometry(0.30, 0.10, 0.12), ridgeMat,
      'selector_grip_' + String(i).padStart(2, '0'), FRONT + 0.31,
      dialY + Math.cos(angle) * dialR, dialU + Math.sin(angle) * dialR);
    tooth.rotation.x = angle;
  }
  slab(roundRect(0.76, 4.48, 0.19), 0.28, 0.07, ridgeMat,
    'raised_selector_handle', FRONT + 0.60, dialY, dialU);
  cylinder(0.155, 0.045, silver, 'selector_pointer_dot', FRONT + 0.82, dialY + 1.82, dialU, 32);

  // Recessed banana sockets: black wells with two red insulating collars.
  [-2.25, 0, 2.25].forEach((u, i) => {
    cylinder(0.59, 0.12, panelEdge, 'socket_well_' + i, FRONT + 0.055, -6.82, u);
    cylinder(0.46, 0.10, black, 'socket_bore_' + i, FRONT + 0.13, -6.82, u);
    ring(0.335, 0.065, i === 1 ? panelEdge : red,
      'socket_collar_' + i, FRONT + 0.205, -6.82, u);
    cylinder(0.245, 0.025, black, 'socket_hole_' + i, FRONT + 0.22, -6.82, u);
  });

  // All face markings are drawn at their physical positions, so geometry and ink align.
  const faceTex = canvasTexture('117c_front_markings', 1536, 3200, (ctx, w, h) => {
    const px = u => (u + 4.25) / 8.5 * w;
    const py = y => (8.75 - y) / 17.5 * h;
    const text = (label, u, y, size = 0.31, color = '#cbd6d7', bold = true) => {
      ctx.fillStyle = color;
      ctx.font = `${bold ? 'bold ' : ''}${Math.round(size / 8.5 * w)}px Arial, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, px(u), py(y));
    };
    text('VoltAlert', 0, 7.96, 0.26);
    ['HOLD', 'MIN MAX', 'RANGE'].forEach((label, i) => text(label, buttonUs[i], 2.57, i === 1 ? 0.23 : 0.26, '#f1f3f1'));
    text('Lo / Hi', 0.67, 3.08, 0.22, '#858f8f');
    text('AUTO-V', -2.47, 1.49, 0.29);
    text('LoZ', -2.45, 1.13, 0.29);
    text('OFF', -1.13, 1.39, 0.34);
    text('∿', 0.05, 1.49, 0.47);
    text('V', 0.04, 1.10, 0.44);
    text('Hz', 0.64, 1.43, 0.28, '#d2ad3c');
    text('⎓', 1.03, 0.86, 0.43);
    text('V', 1.03, 0.47, 0.43);
    text('∿', 2.0, 0.0, 0.47);
    text('mV', 2.0, -0.43, 0.43);
    text('⎓', 2.76, -0.45, 0.33, '#d2ad3c');
    text('Ω', 2.16, -1.58, 0.56, '#d2dddf', false);
    text('))))', 2.13, -2.68, 0.37, '#d2dddf', false);
    text('→Ι', 1.57, -3.59, 0.38);
    text('─|(─', 2.31, -3.87, 0.32, '#d2ad3c');
    text('Volt', -2.38, -4.22, 0.30);
    text('Alert', -2.38, -4.58, 0.30);
    text('⎓', -1.12, -4.31, 0.41);
    text('A', -1.12, -4.73, 0.45);
    text('∿', 0.16, -4.21, 0.42);
    text('A', 0.16, -4.68, 0.44);
    text('Hz', 0.74, -4.76, 0.27, '#d2ad3c');
    text('A', -2.25, -5.94, 0.35, '#a3b1ae');
    text('COM', 0, -5.94, 0.35, '#a3b1ae');
    text('V Ω )))', 2.25, -5.73, 0.30, '#a3b1ae');
    text('─|(─ →Ι', 2.25, -6.10, 0.27, '#a3b1ae');
    text('10 A', -1.2, -7.37, 0.29);
    text('FUSED', -1.2, -7.69, 0.28);
    text('⚠', 1.1, -6.98, 0.43);
    text('CAT Ⅲ', 1.17, -7.38, 0.29);
    text('600 V', 1.17, -7.72, 0.29);
    text('⏚', 1.17, -8.0, 0.35);
    // Sun icon on the round light key.
    ctx.strokeStyle = '#d9e0e1'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(px(2.5), py(1.22), 22, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(px(2.5) + Math.cos(a) * 32, py(1.22) + Math.sin(a) * 32);
      ctx.lineTo(px(2.5) + Math.cos(a) * 44, py(1.22) + Math.sin(a) * 44);
      ctx.stroke();
    }
  });
  // The face print sits behind protruding controls; button legends use a separate plane.
  printPlane(faceTex, 'face_silkscreen', 8.5, 17.5, FRONT + 0.035, 0, 0);
  const keyTex = canvasTexture('key_legends', 1200, 180, ctx => {
    ctx.fillStyle = '#eef2f2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ['HOLD', 'MIN MAX', 'RANGE'].forEach((label, i) => {
      ctx.font = `bold ${i === 1 ? 43 : 49}px Arial`;
      ctx.fillText(label, 145 + i * 305, 90);
    });
  });
  printPlane(keyTex, 'button_legend_print', 6.3, 0.95, FRONT + 0.28, 2.57, -0.15);
  const lightTex = canvasTexture('backlight_icon', 256, 256, ctx => {
    ctx.strokeStyle = '#d9e0e1'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(128, 128, 38, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(128 + Math.cos(a) * 60, 128 + Math.sin(a) * 60);
      ctx.lineTo(128 + Math.cos(a) * 86, 128 + Math.sin(a) * 86); ctx.stroke();
    }
  });
  printPlane(lightTex, 'backlight_key_icon', 0.62, 0.62, FRONT + 0.28, 1.22, 2.5);

  // Rear boot: physical probe channels, accessory attachment recess, folding stand.
  slab(roundRect(5.75, 5.1, 0.4), 0.08, 0.05, yellow,
    'rear_accessory_panel', BACK - 0.005, 5.34);
  const attachment = roundRect(2.85, 1.85, 0.18);
  const attachmentMat = material('accessory_recess_dark', 0x30363b, 0.8);
  slab(attachment, 0.08, 0.025, attachmentMat,
    'rear_accessory_recess', BACK - 0.12, 5.53);
  // A yellow rim gives the upper accessory recess its characteristic D shape.
  const dRim = new THREE.Shape();
  dRim.moveTo(-1.63, 0.98); dRim.lineTo(1.63, 0.98);
  dRim.lineTo(1.63, 0.30);
  dRim.bezierCurveTo(1.63, -1.05, -1.63, -1.05, -1.63, 0.30);
  dRim.closePath();
  const dInset = new THREE.Path();
  dInset.moveTo(-1.40, 0.75); dInset.lineTo(-1.40, 0.28);
  dInset.bezierCurveTo(-1.40, -0.79, 1.40, -0.79, 1.40, 0.28);
  dInset.lineTo(1.40, 0.75); dInset.closePath();
  dRim.holes.push(dInset);
  slab(dRim, 0.16, 0.025, yellow, 'accessory_D_shaped_rim', BACK - 0.20, 5.50);

  [-3.22, 3.22].forEach((u, i) => {
    slab(roundRect(0.84, 4.8, 0.28), 0.08, 0.025, darkYellow,
      'probe_channel_recess_' + i, BACK - 0.11, 5.47, u);
    for (const offset of [-0.40, 0.40]) {
      slab(roundRect(0.20, 4.9, 0.09), 0.46, 0.065, yellow,
        'probe_channel_rail_' + i + '_' + offset, BACK - 0.22, 5.48, u + offset);
    }
    slab(roundRect(1.0, 0.45, 0.18), 0.10, 0.04, darkYellow,
      'probe_retaining_slot_' + i, BACK - 0.18, 2.92, u);
  });

  slab(roundRect(4.80, 10.3, 0.40), 0.10, 0.06, panelEdge,
    'rear_stand_recess', BACK - 0.08, -2.35);
  const stand = slab(roundRect(4.50, 9.85, 0.33), 0.22, 0.055, knobMat,
    'folding_rear_stand', BACK - 0.22, -2.48);
  slab(roundRect(2.70, 1.40, 0.13), 0.14, 0.06, ridgeMat,
    'rear_stand_hinge', BACK - 0.34, 2.42);
  cylinder(0.31, 0.08, black, 'rear_hinge_screw_well', BACK - 0.47, 2.42, 0, 32);
  cylinder(0.18, 0.05, panelEdge, 'rear_hinge_screw', BACK - 0.53, 2.42, 0, 24);
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const groove = add(new THREE.BoxGeometry(0.02, 0.035, 0.25), black,
      'hinge_screw_cross_' + a, BACK - 0.56, 2.42, 0);
    groove.rotation.x = a;
  }

  const backTex = canvasTexture('rear_stand_instructions', 1024, 2250, (ctx, w) => {
    ctx.fillStyle = '#141b20'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = [
      ['按住下列按钮再', 190, 78], ['拧旋钮开机选择', 300, 78],
      ['MIN MAX  停止哔鸣声', 520, 64], ['停止自动关机', 680, 72],
      ['☼  停止自动关灯', 830, 72], ['⚠', 1040, 100],
      ['AUTO-V  LoZ 意指', 1210, 66], ['自动选择 VAC 或 VDC', 1390, 62],
      ['（低阻抗输入）', 1530, 72], ['只适用于', 1680, 72],
      ['114, 116 & 117 型号', 1840, 62], ['FLUKE', 2090, 100],
    ];
    lines.forEach(([text, y, size]) => {
      ctx.font = `${text === 'FLUKE' ? 'bold ' : ''}${size}px "Microsoft YaHei", Arial, sans-serif`;
      ctx.fillText(text, w / 2, y);
    });
    ctx.strokeStyle = '#141b20'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(80, 930); ctx.lineTo(w - 80, 930); ctx.stroke();
  });
  printPlane(backTex, 'rear_stand_molded_text', 3.98, 8.75,
    BACK - 0.39, -2.69, 0, true);
  const hookTex = canvasTexture('accessory_mount_label', 1024, 160, ctx => {
    ctx.fillStyle = '#b08007'; ctx.textAlign = 'center'; ctx.font = 'bold 98px "Microsoft YaHei", sans-serif';
    ctx.fillText('悬挂附件安装处', 512, 115);
  });
  printPlane(hookTex, 'rear_accessory_molded_text', 4.85, 0.76,
    BACK - 0.10, 7.29, 0, true);

  return group;
}
