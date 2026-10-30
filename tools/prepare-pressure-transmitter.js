// Restore PBR surfaces and separate the imported transmitter's connected parts.
// Whole triangles and their original position/normal/UV attributes are preserved.
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { createModelStore } = require('../project-model-store');

async function main() {
  const directory = path.resolve(__dirname, '..');
  const library = path.join(directory, 'assets/imported-models');
  const store = createModelStore(library);
  const id = process.argv[2] || 'd6b7bee9-ca9b-4f34-8335-d72ed3cc755d';
  const saved = await store.read(id);
  const THREE = await import(pathToFileURL(path.join(directory, 'vendor/three.module.js')).href);
  const root = await new THREE.ObjectLoader().parseAsync(saved.scene);
  root.updateMatrixWorld(true);
  const originalBox = new THREE.Box3().setFromObject(root, true);
  const body = root.getObjectByName('压力变送器_0');
  const face = root.getObjectByName('压力变送器_1');
  assert(body?.isMesh && face?.isMesh, '仅适用于未拆分的压力变送器原模型');
  assert.equal(body.geometry.attributes.position.count, 5318 * 3);
  assert(!body.geometry.index);
  assert.deepEqual(body.matrix.toArray(), face.matrix.toArray());

  const p = body.geometry.attributes.position, count = p.count / 3;
  const parent = Array.from({ length: count }, (_, i) => i);
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const vertices = new Map(), v = new THREE.Vector3();
  for (let t = 0; t < count; t++) for (let c = 0; c < 3; c++) {
    v.fromBufferAttribute(p, t * 3 + c).applyMatrix4(body.matrixWorld);
    const key = v.toArray().map(n => Math.round(n * 1e4)).join(',');
    if (vertices.has(key)) parent[find(t)] = find(vertices.get(key));
    else vertices.set(key, t);
  }
  const components = new Map();
  for (let t = 0; t < count; t++) {
    const componentId = find(t);
    if (!components.has(componentId)) components.set(componentId, { faces: [], box: new THREE.Box3() });
    const component = components.get(componentId);
    component.faces.push(t);
    for (let c = 0; c < 3; c++) component.box.expandByPoint(v.fromBufferAttribute(p, t * 3 + c).applyMatrix4(body.matrixWorld));
  }
  const parts = [...components.values()].sort((a, b) => b.faces.length - a.faces.length);
  assert.equal(parts.length, 77, '原模型连通部件发生变化，请重新检查分类');
  assert.deepEqual(parts.slice(0, 5).map(c => c.faces.length), [572, 432, 360, 356, 336]);

  const makeMaterial = (name, color, metalness, roughness) => {
    const material = new THREE.MeshStandardMaterial({ color, metalness, roughness, envMapIntensity: 1.1 });
    material.name = name;
    return material;
  };
  const palette = {
    stainless: makeMaterial('不锈钢_仪表与引压管', '#b5c1c9', .9, .3),
    support: makeMaterial('金属_立柱底座', '#88959f', .8, .45),
    blue: makeMaterial('工业蓝漆_变送器外壳', '#236a9c', .2, .43),
    valve: makeMaterial('金属_仪表阀组', '#586671', .75, .42),
    rubber: makeMaterial('黑色橡胶_线缆', '#20252a', .02, .82),
    dial: makeMaterial('表盘_浅色面板', '#e5e4d7', 0, .5),
    dark: makeMaterial('深色_操作件', '#22272b', .35, .45),
  };
  const categories = ['压力表总成', '仪表阀组', '引压管路', '变送器总成', '线缆与接头', '立柱与底座'];
  const categoryParts = [
    [0, 13, 24, 29],
    [], // The remaining small components are the instrument valve assembly.
    [2, 16, 18, 49, 51],
    [3, 8, 14, 26, 27, 28, 31, 32, 35, 36, 44, 45, 46, 47, 72],
    [4, 9, 30, 37, 38, 39, 40, 48, 62],
    [1, 10, 15, 42, 43, 64, 65, 70, 71, 73, 74, 75, 76],
  ];
  const assignments = new Map();
  categoryParts.forEach((ids, category) => ids.forEach(i => { assert(!assignments.has(i)); assignments.set(i, category); }));
  const labels = {
    0: '压力表_表壳', 1: '立柱_固定环', 2: '引压管_弯管',
    3: '变送器_电子外壳', 4: '线缆_弯曲护套', 5: '阀组_横向操作杆',
    6: '阀组_操作杆_01', 7: '阀组_操作杆_02', 8: '变送器_下壳盖',
    9: '线缆_防水接头', 10: '立柱_底部套筒', 13: '压力表_过程接头',
    14: '变送器_过程接口', 15: '立柱_支撑管', 16: '引压管_下端接头',
    18: '引压管_上端接头', 24: '压力表_中心件_01', 26: '变送器_连接座',
    27: '变送器_连接螺纹件', 29: '压力表_中心件_02', 30: '线缆_下引段',
    49: '引压管_下直段', 51: '引压管_上直段', 70: '支架_线缆固定片',
    71: '支架_仪表安装板', 72: '变送器_连接块', 73: '底座_安装底板',
    74: '底座_加强筋_01', 75: '底座_加强筋_02', 76: '底座_加强筋_03',
  };

  const container = new THREE.Group();
  container.uuid = body.uuid;
  container.name = '压力变送器_可拆部件';
  container.userData = { originalName: body.name, splitMethod: 'whole connected components; no triangle clipping' };
  body.matrix.decompose(container.position, container.quaternion, container.scale);
  const groups = categories.map(name => { const g = new THREE.Group(); g.name = name; container.add(g); return g; });
  const manifest = [];
  parts.forEach((component, i) => {
    const category = assignments.get(i) ?? 1;
    const geometry = new THREE.BufferGeometry();
    for (const [name, attribute] of Object.entries(body.geometry.attributes)) {
      const array = new attribute.array.constructor(component.faces.length * 3 * attribute.itemSize);
      component.faces.forEach((t, j) => array.set(attribute.array.subarray(t * 3 * attribute.itemSize, (t + 1) * 3 * attribute.itemSize), j * 3 * attribute.itemSize));
      geometry.setAttribute(name, new THREE.BufferAttribute(array, attribute.itemSize, attribute.normalized));
    }
    let material = palette.stainless;
    if (category === 1) material = palette.valve;
    if (category === 5) material = palette.support;
    if ([3, 8].includes(i)) material = palette.blue;
    if ([4, 30].includes(i)) material = palette.rubber;
    if ([5, 6, 7, 24, 29].includes(i)) material = palette.dark;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = labels[i] || categories[category] + '_连接件_' + String(i + 1).padStart(2, '0');
    mesh.userData = { originalName: body.name, sourceConnectedPart: i, functionalGroup: categories[category] };
    mesh.castShadow = true; mesh.receiveShadow = true;
    groups[category].add(mesh);
    manifest.push({ name: mesh.name, group: categories[category], material: material.name,
      triangles: component.faces.length, center: component.box.getCenter(new THREE.Vector3()).toArray() });
  });
  face.removeFromParent();
  face.position.set(0, 0, 0); face.quaternion.identity(); face.scale.set(1, 1, 1);
  face.name = '压力表_表盘'; face.material = palette.dial;
  groups[0].add(face);
  manifest.push({ name: face.name, group: categories[0], material: face.material.name, triangles: 22 });
  root.remove(body); root.add(container); root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root, true);
  assert(box.min.distanceTo(originalBox.min) < 1e-7 && box.max.distanceTo(originalBox.max) < 1e-7, '部件位置或尺寸发生变化');
  assert.equal(manifest.reduce((sum, c) => sum + c.triangles, 0), 5340);
  // Attribute-level comparison includes position, normals, UV and winding.
  const fingerprints = geometries => {
    const faces = [];
    geometries.forEach(geometry => {
      const names = Object.keys(geometry.attributes).sort();
      for (let t = 0; t < geometry.attributes.position.count / 3; t++) {
        const attrs = names.map(name => [name, Array.from(geometry.attributes[name].array.subarray(t * 3 * geometry.attributes[name].itemSize, (t + 1) * 3 * geometry.attributes[name].itemSize))]);
        faces.push(createHash('sha256').update(JSON.stringify(attrs)).digest('hex'));
      }
    });
    return faces.sort();
  };
  const originalFaces = fingerprints([body.geometry, face.geometry]);
  const newGeometries = []; root.traverse(o => { if (o.isMesh) newGeometries.push(o.geometry); });
  assert.deepEqual(fingerprints(newGeometries), originalFaces);
  const scene = root.toJSON();
  const reloaded = await new THREE.ObjectLoader().parseAsync(scene);
  const reloadBox = new THREE.Box3().setFromObject(reloaded, true);
  assert(reloadBox.min.distanceTo(box.min) < 1e-7 && reloadBox.max.distanceTo(box.max) < 1e-7);
  const backup = path.join(library, id, 'backups', 'before-materials-and-split-' + new Date().toISOString().replace(/[:.]/g, '-'));
  await fs.mkdir(backup, { recursive: true });
  for (const file of ['model.json', 'metadata.json']) await fs.copyFile(path.join(library, id, file), path.join(backup, file));
  saved.scene = scene;
  saved.stats = { ...saved.stats, meshes: 78, materials: 7, textured: 0 };
  saved.notes = ['已补全 PBR 材质：工业蓝变送器外壳、不锈钢仪表和引压管、金属立柱底座、黑色线缆、浅色表盘。',
    '原 2 个网格拆分为 78 个独立网格，按压力表、仪表阀组、引压管路、变送器、线缆和支架底座分为 6 组。',
    '保留全部 5,340 个三角面、原 UV、法线、尺寸和组装位置；没有新增或推测内部结构。'];
  await store.save(saved);
  await fs.writeFile(path.join(library, id, 'parts-manifest.json'), JSON.stringify(manifest, null, 2));
  const exporter = vm.runInNewContext(await fs.readFile(path.join(directory, 'fbx-exporter.js'), 'utf8') + '\n({exportGLB,exportFBX});',
    { TextEncoder, Uint8Array, Uint32Array, Float32Array, Float64Array, Int32Array, DataView, ArrayBuffer, console });
  const output = path.join(directory, 'exports', '压力变送器_材质与拆分');
  await fs.mkdir(output, { recursive: true });
  const writeExports = async (object, name) => {
    object.updateMatrixWorld(true);
    const glb = Buffer.from(exporter.exportGLB(object));
    const fbx = exporter.exportFBX(object);
    await fs.writeFile(path.join(output, name + '.glb'), glb);
    await fs.writeFile(path.join(output, name + '.fbx'), fbx.bytes);
    return glb;
  };
  const fullGLB = await writeExports(root, '压力变送器_完整装配');
  for (const group of groups) {
    const standalone = new THREE.Group(), clone = group.clone(true);
    group.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
    standalone.add(clone); standalone.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(standalone).getCenter(new THREE.Vector3());
    clone.position.sub(center); standalone.name = group.name;
    await writeExports(standalone, group.name);
  }
  const jsonLength = fullGLB.readUInt32LE(12);
  const exported = JSON.parse(fullGLB.subarray(20, 20 + jsonLength).toString('utf8'));
  assert.equal(exported.meshes.length, 78);
  const triangleCount = exported.meshes.reduce((sum, m) => sum + exported.accessors[m.primitives[0].attributes.POSITION].count / 3, 0);
  assert.equal(triangleCount, 5340);
  console.log(JSON.stringify({ model: saved.name, meshes: 78, triangles: triangleCount, materials: 7,
    groups: groups.map(g => ({ name: g.name, parts: g.children.length })), originalAttributesPreserved: true,
    assemblyPositionPreserved: true, backup, output }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
