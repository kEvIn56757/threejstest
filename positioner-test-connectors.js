// 定位器检测线接头（无线）— 红黑香蕉插头、应力护套及鳄鱼夹。
// 单位 cm；中间线缆由 Unity 生成。四组根节点均可独立移动/旋转。
function buildPositionerTestConnectors(THREE) {
  const root = new THREE.Group();
  root.name = 'positioner_test_connectors_no_cable';

  function mat(name, color, roughness = 0.65, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.name = name;
    return m;
  }
  const red = mat('test_positive_red', 0xc92f29, 0.72);
  const black = mat('test_common_black', 0x14191b, 0.78);
  const steel = mat('test_clip_stainless_steel', 0xabb8bd, 0.27, 0.85);
  const gold = mat('test_plug_contact_brass', 0xd5aa48, 0.28, 0.8);
  const dark = mat('test_clip_grip_dark', 0x252d30, 0.78);

  function add(geo, material, name, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, material);
    m.name = name;
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cylinder(r, length, material, name, parent, x = 0, y = 0, z = 0) {
    const g = new THREE.CylinderGeometry(r, r, length, 48);
    g.rotateZ(-Math.PI / 2);
    return add(g, material, name, parent, x, y, z);
  }
  function ring(r, tube, material, name, parent, x) {
    const g = new THREE.TorusGeometry(r, tube, 10, 48);
    g.rotateY(Math.PI / 2);
    return add(g, material, name, parent, x);
  }

  function makePlug(sign, material, position) {
    const g = new THREE.Group();
    g.name = `${sign}_banana_plug_assembly`;
    g.position.fromArray(position);
    root.add(g);
    // Local -X is the instrument-facing 4 mm pin; local +X is the cable socket.
    cylinder(0.15, 1.16, gold, `${sign}_4mm_contact_pin`, g, -1.43);
    for (let i = 0; i < 5; i++) ring(0.15, 0.027, gold,
      `${sign}_spring_contact_${i}`, g, -1.80 + i * 0.18);
    cylinder(0.32, 0.30, steel, `${sign}_plug_shoulder`, g, -0.78);
    cylinder(0.40, 1.25, material, `${sign}_insulated_plug`, g, -0.02);
    cylinder(0.29, 1.22, material, `${sign}_strain_relief`, g, 1.20);
    for (let i = 0; i < 6; i++) ring(0.29, 0.05, material,
      `${sign}_strain_relief_rib_${i}`, g, 0.77 + i * 0.19);
    cylinder(0.18, 0.07, dark, `${sign}_cable_socket`, g, 1.84);
    g.userData.cableAnchor = [1.88, 0, 0];
    g.userData.pinAnchor = [-2.01, 0, 0];
  }

  function makeClip(sign, material, position, tilt) {
    const g = new THREE.Group();
    g.name = `${sign}_alligator_clip_assembly`;
    g.position.fromArray(position);
    g.rotation.z = tilt;
    root.add(g);
    add(new THREE.BoxGeometry(0.64, 2.18, 0.70), material,
      `${sign}_insulated_clip_body`, g);
    add(new THREE.BoxGeometry(0.43, 1.32, 0.48), steel,
      `${sign}_metal_jaw_upper`, g, 0, 1.58);
    add(new THREE.BoxGeometry(0.44, 0.18, 0.50), dark,
      `${sign}_jaw_opening`, g, 0, 1.62);
    const pivot = cylinder(0.26, 0.82, steel, `${sign}_jaw_pivot`, g, 0, 0.65);
    pivot.rotation.y = Math.PI / 2;
    for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.68, 0.075, 0.73), dark,
      `${sign}_finger_grip_${i}`, g, 0, -0.66 + i * 0.21);
    // Exposed rear cable-entry ferrule, no cable geometry.
    const ferrule = cylinder(0.24, 0.46, steel, `${sign}_rear_cable_ferrule`, g, 0, -1.30);
    ferrule.rotation.z = Math.PI / 2;
    cylinder(0.14, 0.025, dark, `${sign}_rear_cable_socket`, g, 0, -1.54).rotation.z = Math.PI / 2;
    g.userData.cableAnchor = [0, -1.56, 0];
    g.userData.jawAnchor = [0, 2.24, 0];
  }

  makePlug('positive', red, [-4.0, 3.6, 0]);
  makePlug('common', black, [-4.0, 0.8, 0]);
  makeClip('positive', red, [3.5, 3.6, 0], -0.12);
  makeClip('common', black, [3.5, 0.4, 0], 0.12);

  root.userData.description = '红黑检测线接头，无中间线缆；插头局部 +X、夹子局部 -Y 为 Unity 线缆连接方向。';
  root.userData.cableEndpoints = {
    positive: { plug: 'positive_banana_plug_assembly', clip: 'positive_alligator_clip_assembly' },
    common: { plug: 'common_banana_plug_assembly', clip: 'common_alligator_clip_assembly' },
  };
  return root;
}
