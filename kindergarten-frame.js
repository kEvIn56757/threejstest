// 幼儿园墙挂相框：深棕木构、暖橙细线、米白卡纸和自然绿叶。
// 单位 cm；正面朝 +X，水平向右为 -Z；外框约 88 × 64 × 4.2 cm。
function buildKindergartenFrame(THREE) {
  const group = new THREE.Group();
  group.name = 'kindergarten_wall_picture_frame';
  const W = 88, H = 64, BORDER = 5.2;
  const photoW = 70, photoH = 46;

  function mat(name, color, roughness = 0.75, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.name = name;
    return m;
  }
  function canvasTex(name, w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.name = name;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }
  const timber = mat('frame_warm_walnut', 0xffffff, 0.78);
  timber.map = canvasTex('walnut_long_grain', 1024, 256, (ctx, w, h) => {
    const fill = ctx.createLinearGradient(0, 0, 0, h);
    fill.addColorStop(0, '#52301f'); fill.addColorStop(0.35, '#69412a');
    fill.addColorStop(0.7, '#5c3824'); fill.addColorStop(1, '#492b1d');
    ctx.fillStyle = fill; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 116; i++) {
      const y = i * h / 116;
      ctx.strokeStyle = i % 3 ? 'rgba(30,15,8,0.16)' : 'rgba(220,160,96,0.12)';
      ctx.lineWidth = i % 7 === 0 ? 2.1 : 0.7;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const dy = Math.sin(x * 0.008 + i * 0.79) * (1.6 + i % 3)
          + Math.sin(x * 0.021 + i) * 0.6;
        if (!x) ctx.moveTo(x, y + dy); else ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }
  });
  const orange = mat('frame_honey_orange_trim', 0xc48a42, 0.72);
  const cream = mat('frame_warm_cream_matboard', 0xeee5cf, 0.94);
  const backing = mat('frame_backing_board', 0x796147, 0.98);
  const edge = mat('frame_rear_walnut_edge', 0x3b281d, 0.85);
  const metal = mat('frame_hanging_hardware', 0x747c78, 0.45, 0.55);
  const screwMat = mat('frame_screw_dark', 0x333933, 0.58, 0.45);
  const leafMat = mat('frame_leaf_sage', 0x71945b, 0.83);
  const leafLight = mat('frame_leaf_olive', 0x94a766, 0.85);
  const stemMat = mat('frame_leaf_stem', 0x4d6540, 0.88);

  function add(geo, material, name, x = 0, y = 0, u = 0) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    mesh.position.set(x, y, -u);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function poly(points) {
    const s = new THREE.Shape();
    points.forEach(([u, y], i) => i ? s.lineTo(u, y) : s.moveTo(u, y));
    s.closePath();
    return s;
  }
  function rectangle(w, h) {
    return poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]);
  }
  function frameShape(w, h, iw, ih) {
    const shape = rectangle(w, h);
    const hole = new THREE.Path();
    hole.moveTo(-iw / 2, -ih / 2);
    hole.lineTo(-iw / 2, ih / 2);
    hole.lineTo(iw / 2, ih / 2);
    hole.lineTo(iw / 2, -ih / 2);
    hole.closePath();
    shape.holes.push(hole);
    return shape;
  }
  function extrude(shape, depth, bevel, material, name, x = 0) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 3, curveSegments: 16,
    });
    geo.translate(0, 0, -depth / 2);
    geo.rotateY(Math.PI / 2);
    return add(geo, material, name, x);
  }

  // Four real mitered wooden rails with grain running along each board.
  const hw = W / 2, hh = H / 2, iw = hw - BORDER, ih = hh - BORDER;
  const rails = [
    { name: 'wood_rail_top', vertical: false,
      points: [[-hw, hh], [-iw, ih], [iw, ih], [hw, hh]] },
    { name: 'wood_rail_bottom', vertical: false,
      points: [[-hw, -hh], [hw, -hh], [iw, -ih], [-iw, -ih]] },
    { name: 'wood_rail_left', vertical: true,
      points: [[-hw, -hh], [-iw, -ih], [-iw, ih], [-hw, hh]] },
    { name: 'wood_rail_right', vertical: true,
      points: [[hw, -hh], [hw, hh], [iw, ih], [iw, -ih]] },
  ];
  for (const rail of rails) {
    const mesh = extrude(poly(rail.points), 3.6, 0.14, timber, rail.name);
    const pos = mesh.geometry.attributes.position;
    const uv = mesh.geometry.attributes.uv;
    const minU = Math.min(...rail.points.map(p => p[0]));
    const minY = Math.min(...rail.points.map(p => p[1]));
    for (let i = 0; i < pos.count; i++) {
      const u = -pos.getZ(i), y = pos.getY(i);
      uv.setXY(i, rail.vertical ? (y + hh) / H : (u + hw) / W,
        rail.vertical ? (u - minU) / BORDER : (y - minY) / BORDER);
    }
    uv.needsUpdate = true;
  }

  extrude(frameShape(87.5, 63.5, 75.5, 51.5), 0.50, 0.06,
    edge, 'rear_structural_frame', -1.85);
  extrude(rectangle(77.1, 53.1), 0.42, 0.03,
    backing, 'removable_rear_backing', -1.53);
  extrude(frameShape(78.15, 54.15, 76.25, 52.25), 0.30, 0.055,
    orange, 'honey_orange_inner_bead', 1.60);
  extrude(frameShape(76.3, 52.3, 69.5, 45.5), 0.32, 0.045,
    cream, 'cream_photo_matboard', 1.32);

  // A replaceable, separately named photo insert. No real children's photographs.
  // 独立节点和材质均命名为“照片”，可在 Unity 中替换材质或贴图。
  const insertTex = canvasTex('nature_garden_placeholder', 1680, 1104, (ctx, w, h) => {
    ctx.fillStyle = '#eee9d9'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e5ddc6';
    ctx.beginPath(); ctx.arc(w * 0.78, h * 0.26, 123, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b4c19a';
    ctx.beginPath(); ctx.moveTo(0, h * 0.83);
    ctx.bezierCurveTo(w * 0.23, h * 0.59, w * 0.48, h * 1.02, w, h * 0.69);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#849769';
    ctx.beginPath(); ctx.moveTo(0, h * 0.91);
    ctx.bezierCurveTo(w * 0.33, h * 1.04, w * 0.71, h * 0.72, w, h * 0.89);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b4b695'; ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, w - 112, h - 112);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5f7050'; ctx.font = '40px Georgia, serif';
    ctx.fillText('N A T U R E   E X P L O R E R S', w / 2, h * 0.34);
    ctx.fillStyle = '#5b4937';
    ctx.font = '86px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('我们的自然发现', w / 2, h * 0.49);
    ctx.fillStyle = '#7b7b63';
    ctx.font = '33px "Microsoft YaHei", sans-serif';
    ctx.fillText('观察 · 探索 · 快乐成长', w / 2, h * 0.61);
    // Simple botanical accents belong to the sample insert, not the frame opening.
    ctx.strokeStyle = '#72825a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(154, h - 183); ctx.quadraticCurveTo(212, h - 267, 179, h - 367); ctx.stroke();
    ctx.fillStyle = '#8a9d70';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.ellipse(180 + (i % 2 ? 22 : -12), h - 223 - i * 32,
        28, 12, i % 2 ? -0.62 : 0.62, 0, Math.PI * 2); ctx.fill();
    }
  });
  const insertMat = mat('照片', 0xffffff, 0.94);
  insertMat.map = insertTex;
  const photoGeo = new THREE.PlaneGeometry(photoW, photoH);
  photoGeo.rotateY(Math.PI / 2);
  const photo = add(photoGeo, insertMat, '照片', 1.16);
  photo.castShadow = false;
  photo.userData.photoWidthCm = photoW;
  photo.userData.photoHeightCm = photoH;

  // Restrained raised botanical detail at one corner ties into the garden setting.
  function leaf(u, y, angle, length, material, name) {
    const s = new THREE.Shape();
    s.moveTo(0, -length / 2);
    s.bezierCurveTo(length * 0.47, -length * 0.22, length * 0.38, length * 0.28, 0, length / 2);
    s.bezierCurveTo(-length * 0.38, length * 0.28, -length * 0.47, -length * 0.22, 0, -length / 2);
    const mesh = extrude(s, 0.16, 0.055, material, name, 2.02);
    mesh.position.y = y; mesh.position.z = -u;
    mesh.rotation.x = -angle;
    return mesh;
  }
  const stemPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.02, -29.4, 40.5),
    new THREE.Vector3(2.02, -26.4, 40.8),
    new THREE.Vector3(2.02, -23.3, 41.0),
    new THREE.Vector3(2.02, -20.1, 40.3),
  ]);
  add(new THREE.TubeGeometry(stemPath, 20, 0.10, 6, false), stemMat, 'botanical_corner_stem');
  leaf(-39.8, -27.7, -0.85, 3.5, leafMat, 'corner_leaf_01');
  leaf(-41.7, -25.0, 0.85, 3.3, leafLight, 'corner_leaf_02');
  leaf(-39.6, -22.8, -0.9, 3.2, leafMat, 'corner_leaf_03');
  leaf(-40.4, -20.4, 0.28, 2.9, leafLight, 'corner_leaf_04');

  // Backside turn tabs, screws and two D-ring hanging mounts.
  for (const [u, y] of [[-34, 0], [34, 0], [-20, 24.9], [20, 24.9], [-20, -24.9], [20, -24.9]]) {
    add(new THREE.BoxGeometry(0.14, 0.85, 2.35), metal,
      'backing_turn_tab_' + u + '_' + y, -1.86, y, u);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.10, 20), screwMat);
    screw.rotation.z = -Math.PI / 2;
    screw.name = 'turn_tab_screw_' + u + '_' + y;
    screw.position.set(-1.99, y, -u);
    group.add(screw);
  }
  for (const u of [-27, 27]) {
    add(new THREE.BoxGeometry(0.18, 2.65, 1.45), metal,
      'wall_hanger_plate_' + u, -2.18, 19.9, u);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.12, 8, 28), metal);
    ring.name = 'wall_hanging_ring_' + u;
    ring.rotation.y = Math.PI / 2;
    ring.scale.y = 1.2;
    ring.position.set(-2.39, 21.5, -u);
    group.add(ring);
  }
  group.userData.dimensionsCm = { width: W, height: H, depth: 4.4 };
  group.userData.usage = 'wall-mounted landscape display frame';
  return group;
}
