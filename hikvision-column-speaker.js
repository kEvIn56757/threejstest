// hikvision-column-speaker.js — 海康威视网络音柱程序化模型
// 参考实拍与官方网络音柱外形尺寸：约 446.8(H) × 160(W) × 160(D) mm。
// 单位：厘米(cm)。朝向：黑色网罩朝 +X，左右为 ±Z，安装背板位于 -X。
function buildHikvisionColumnSpeaker(THREE) {
  const group = new THREE.Group();
  group.name = 'hikvision_column_speaker';

  const H = 44.68;
  const W = 16;
  const D = 16;
  const capH = 1.05;
  const halfW = 7.15;

  // Shared horizontal profile: the end caps follow the grille, including its
  // curved return to the white side panels. Dimensions are in the X/Z plane.
  function grilleX(z) {
    const q = Math.min(1, Math.abs(z) / halfW);
    return 4.75 + 3.05 * Math.pow(1 - q * q, 0.72);
  }

  // ---------- materials ----------
  const matWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf3f4f2, roughness: 0.38, metalness: 0.02,
    clearcoat: 0.22, clearcoatRoughness: 0.45,
  });
  matWhite.name = 'speaker_shell_white';

  const matWhiteEdge = new THREE.MeshStandardMaterial({ color: 0xe3e5e2, roughness: 0.48 });
  matWhiteEdge.name = 'speaker_shell_seam';
  const matBaffle = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.92 });
  matBaffle.name = 'speaker_baffle_black';
  const matCone = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.9 });
  matCone.name = 'speaker_cone';
  const matSurround = new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.82 });
  matSurround.name = 'speaker_surround';
  const matDust = new THREE.MeshStandardMaterial({ color: 0x171a1d, roughness: 0.72 });
  matDust.name = 'speaker_dust_cap';
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x9ba0a3, roughness: 0.3, metalness: 0.78 });
  matMetal.name = 'mounting_hardware';
  const matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x33373a, roughness: 0.48, metalness: 0.5 });
  matDarkMetal.name = 'mounting_slot';
  const matLed = new THREE.MeshStandardMaterial({
    color: 0x70f0a5, emissive: 0x35e77d, emissiveIntensity: 1.8, roughness: 0.25,
  });
  matLed.name = 'status_led_green';

  // ---------- helpers ----------
  function rrShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function slabX(w, h, r, depth, mat, name, x, y, z, bevel = 0.22) {
    const geo = new THREE.ExtrudeGeometry(rrShape(w, h, r), {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 12,
    });
    geo.translate(0, 0, -depth / 2);
    geo.rotateY(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function cylX(rTop, rBottom, length, mat, name, x, y, z, seg = 40) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, length, seg), mat);
    mesh.name = name;
    mesh.rotation.z = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }

  function markShell(mesh) {
    mesh.userData.shell = true;
    return mesh;
  }

  // Dense honeycomb-like grille texture. A real hole is represented by a dark core
  // plus a small metallic highlight; the slightly transparent grille reveals the drivers.
  function makeGrilleTexture() {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 1536;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#17191b';
    ctx.fillRect(0, 0, c.width, c.height);
    const step = 10;
    for (let row = -1; row < c.height / step + 1; row++) {
      const yy = row * step;
      const off = (row & 1) ? step / 2 : 0;
      for (let xx = -step; xx < c.width + step; xx += step) {
        const x = xx + off;
        ctx.fillStyle = '#44484b';
        ctx.beginPath();
        ctx.arc(x - 0.7, yy - 0.7, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#050607';
        ctx.beginPath();
        ctx.arc(x, yy, 2.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.name = 'speaker_grille_holes';
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function makeLogoTexture() {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 192;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#25282a';
    const r = 34;
    ctx.beginPath();
    ctx.moveTo(r, 12);
    ctx.lineTo(c.width - r, 12);
    ctx.quadraticCurveTo(c.width - 10, 12, c.width - 10, r);
    ctx.lineTo(c.width - 10, c.height - r);
    ctx.quadraticCurveTo(c.width - 10, c.height - 12, c.width - r, c.height - 12);
    ctx.lineTo(r, c.height - 12);
    ctx.quadraticCurveTo(10, c.height - 12, 10, c.height - r);
    ctx.lineTo(10, r);
    ctx.quadraticCurveTo(10, 12, r, 12);
    ctx.fill();
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2 + 5);
    ctx.transform(1, 0, -0.16, 1, 0, 0);
    ctx.fillStyle = '#f0f1ef';
    ctx.font = 'bold 96px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HIKVISION', 0, 0);
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.name = 'hikvision_badge';
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function makeInfoTexture() {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f1f1ee';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#4f5354';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText('HIKVISION', 34, 55);
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('NETWORK COLUMN SPEAKER', 34, 98);
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('100–240 V~   50/60 Hz', 34, 140);
    ctx.strokeStyle = '#777b7d';
    ctx.strokeRect(32, 165, 220, 54);
    for (let i = 0; i < 18; i++) {
      const x = 290 + i * 14;
      ctx.fillRect(x, 168, (i % 3) + 2, 50);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.name = 'speaker_product_label';
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---------- enclosure ----------
  // Rear shell stops before the front so the curved grille can wrap outwards.
  const rearShell = slabX(W - 0.45, H - 2 * capH, 0.12, 12.4, matWhite,
    'rear_enclosure', -1.78, 0, 0, 0.10);
  markShell(rearShell);

  // Thin horizontal molded caps, rather than a rounded slab extruded along X.
  // Shape coordinates are (Z, X); after extrusion they map to (X, Y, Z).
  // Only a 0.07 cm lip extends past the mesh; the bevel rounds the outer edge.
  function makeEndCap(name, y) {
    const lip = 0.07;
    const side = W / 2 - 0.10;
    const back = -D / 2 + 0.10;
    const shape = new THREE.Shape();
    shape.moveTo(-side + 0.8, back);
    shape.lineTo(side - 0.8, back);
    shape.quadraticCurveTo(side, back, side, back + 0.8);
    shape.lineTo(side, 3.8);
    shape.quadraticCurveTo(side, 4.55, halfW, grilleX(halfW) + lip);
    for (let i = 1; i <= 104; i++) {
      const z = halfW - (2 * halfW * i) / 104;
      shape.lineTo(z, grilleX(z) + lip);
    }
    shape.quadraticCurveTo(-side, 4.55, -side, 3.8);
    shape.lineTo(-side, back + 0.8);
    shape.quadraticCurveTo(-side, back, -side + 0.8, back);
    shape.closePath();
    const bevel = 0.08;
    const depth = capH - 2 * bevel;
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 3, curveSegments: 16,
    });
    geo.translate(0, 0, -depth / 2);
    geo.rotateX(-Math.PI / 2);
    geo.rotateY(-Math.PI / 2);
    const cap = new THREE.Mesh(geo, matWhite);
    cap.name = name;
    cap.position.y = y;
    cap.castShadow = true;
    cap.receiveShadow = true;
    group.add(cap);
    return markShell(cap);
  }
  makeEndCap('top_cap', H / 2 - capH / 2);
  makeEndCap('bottom_cap', -H / 2 + capH / 2);

  // ---------- internal baffle and drivers ----------
  const baffle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 37.0, 13.25), matBaffle);
  baffle.name = 'internal_baffle';
  baffle.position.set(4.7, 0, 0);
  baffle.castShadow = true;
  group.add(baffle);

  const driverYs = [13.8, 4.6, -4.6, -13.8];
  driverYs.forEach((y, i) => {
    cylX(4.0, 4.0, 0.34, matSurround, 'woofer_surround_' + (i + 1), 5.12, y, 0, 56);
    cylX(1.5, 3.72, 0.62, matCone, 'woofer_cone_' + (i + 1), 5.48, y, 0, 56);
    const dust = new THREE.Mesh(new THREE.SphereGeometry(1.35, 36, 18), matDust);
    dust.name = 'woofer_dust_cap_' + (i + 1);
    dust.scale.set(0.34, 1, 1);
    dust.position.set(5.92, y, 0);
    group.add(dust);
  });

  // ---------- curved perforated grille ----------
  const grilleTex = makeGrilleTexture();
  const matGrille = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: grilleTex,
    roughness: 0.68,
    metalness: 0.34,
    transparent: true,
    opacity: 0.965,
    side: THREE.DoubleSide,
  });
  matGrille.name = 'perforated_metal_grille';

  const cols = 52, rows = 92;
  const y0 = -H / 2 + capH - 0.03;
  const y1 = H / 2 - capH + 0.03;
  const pos = [], uv = [], idx = [];
  for (let iy = 0; iy <= rows; iy++) {
    const v = iy / rows;
    const y = y0 + (y1 - y0) * v;
    for (let iz = 0; iz <= cols; iz++) {
      const u = iz / cols;
      const z = -halfW + halfW * 2 * u;
      pos.push(grilleX(z), y, z);
      uv.push(u, v);
    }
  }
  for (let iy = 0; iy < rows; iy++) {
    for (let iz = 0; iz < cols; iz++) {
      const a = iy * (cols + 1) + iz;
      const b = a + 1;
      const c = a + cols + 2;
      const d = a + cols + 1;
      idx.push(a, d, c, a, c, b);
    }
  }
  const grilleGeo = new THREE.BufferGeometry();
  grilleGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  grilleGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  grilleGeo.setIndex(idx);
  grilleGeo.computeVertexNormals();
  const grille = new THREE.Mesh(grilleGeo, matGrille);
  grille.name = 'curved_front_grille';
  grille.castShadow = true;
  grille.renderOrder = 1;
  group.add(grille);
  markShell(grille);

  // Raised HIKVISION badge on the lower grille.
  const badgeBack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.72, 6.75), matBaffle);
  badgeBack.name = 'hikvision_badge_back';
  badgeBack.position.set(grilleX(0) + 0.06, -15.25, 0);
  group.add(badgeBack);
  markShell(badgeBack);

  const logoMat = new THREE.MeshBasicMaterial({
    map: makeLogoTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  logoMat.name = 'hikvision_logo';
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), logoMat);
  logo.name = 'hikvision_logo_plate';
  logo.rotation.y = Math.PI / 2;
  logo.position.set(grilleX(0) + 0.19, -15.25, 0);
  logo.renderOrder = 3;
  group.add(logo);
  markShell(logo);

  // The photographs show the indicator and microphone on the bottom cap face.
  const status = cylX(0.17, 0.17, 0.10, matLed, 'front_status_led', 3.8, -H / 2 - 0.015, 0, 20);
  status.rotation.z = 0;
  markShell(status);
  const mic = cylX(0.095, 0.095, 0.08, matDarkMetal, 'front_microphone', 3.8, -H / 2 - 0.015, 1.15, 16);
  mic.rotation.z = 0;
  markShell(mic);

  // Product label on the lower portion of the rear shell.
  const infoMat = new THREE.MeshBasicMaterial({ map: makeInfoTexture(), side: THREE.DoubleSide });
  infoMat.name = 'product_label_print';
  const info = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 3.2), infoMat);
  info.name = 'rear_product_label';
  info.rotation.y = -Math.PI / 2;
  info.position.set(-8.13, -13.0, 0);
  group.add(info);
  markShell(info);

  // ---------- wall-mount bracket ----------
  const wallPlate = slabX(5.5, 34.8, 1.05, 0.62, matWhite,
    'wall_mount_plate', -12.05, 0, 0, 0.12);
  const armYs = [18.2, -18.2];
  armYs.forEach((y, i) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.05, 4.6), matWhite);
    arm.name = i === 0 ? 'mount_arm_top' : 'mount_arm_bottom';
    arm.position.set(-8.65, y, 0);
    arm.castShadow = true;
    group.add(arm);

    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 5.0, 28), matMetal);
    bolt.name = i === 0 ? 'pivot_bolt_top' : 'pivot_bolt_bottom';
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(-5.4, y, 0);
    group.add(bolt);
    const washerA = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.16, 32), matMetal);
    washerA.name = 'pivot_washer_' + (i + 1);
    washerA.rotation.x = Math.PI / 2;
    washerA.position.set(-5.4, y, -2.55);
    group.add(washerA);
  });

  // Two dark elongated fixing recesses on the wall plate.
  [10.5, -10.5].forEach((y, i) => {
    const slot = slabX(1.05, 4.2, 0.5, 0.10, matDarkMetal,
      'wall_slot_' + (i + 1), -12.39, y, 0, 0);
    slot.castShadow = false;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.45, 28), matMetal);
    screw.name = 'wall_screw_' + (i + 1);
    screw.rotation.z = -Math.PI / 2;
    screw.position.set(-12.53, y - (i === 0 ? 1.2 : -1.2), 0);
    group.add(screw);
  });

  // Cable gland at the lower rear, as seen in the installation photo.
  const gland = cylX(0.7, 0.7, 0.9, matWhiteEdge, 'cable_gland', -7.95, -18.3, 4.15, 30);
  gland.rotation.z = -Math.PI / 2;
  cylX(0.36, 0.36, 0.96, matDarkMetal, 'cable_gland_core', -8.05, -18.3, 4.15, 24);

  return group;
}
