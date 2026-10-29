// Classify the saved horizontal separator without moving or deleting triangles.
// Compound shell geometry is partitioned into metallic shell / process pipe / drain pipe.
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID, createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const { createModelStore } = require('../project-model-store');

async function main() {
  const id = process.argv[2];
  const rootPath = path.resolve(__dirname, '../assets/imported-models');
  const store = createModelStore(rootPath);
  const current = await store.read(id);
  const directory = path.join(rootPath, id);
  let before = current;
  if (process.argv[3]) {
    assert.match(process.argv[3], /^[a-zA-Z0-9_.-]+$/);
    before = JSON.parse(await fs.readFile(path.join(directory, 'backups', process.argv[3], 'model.json'), 'utf8'));
    assert.equal(before.id, id);
  }
  const recipe = JSON.parse(await fs.readFile(path.join(directory, 'separator-materials.json'), 'utf8'));
  assert.equal(recipe.modelId, id);
  assert.ok(!before.scene.materials.some(m => m.name === recipe.materials.yellow.name), '分离器配色已应用');
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  const originalRoot = await new THREE.ObjectLoader().parseAsync(before.scene);
  originalRoot.updateMatrixWorld(true);
  const composite = originalRoot.getObjectByName(recipe.compositeShell);
  assert.ok(composite?.isMesh, '未找到复合罐体网格');
  const data = structuredClone(before);
  const nodes = [];
  const walk = node => { nodes.push(node); for (const c of node.children || []) walk(c); };
  walk(data.scene.object);
  const sourceNode = nodes.find(n => n.name === recipe.compositeShell);
  const source = data.scene.geometries.find(g => g.uuid === sourceNode.geometry);
  assert.ok(source.data.attributes.position && !source.data.morphAttributes);
  const sourceIndex = source.data.index?.array;
  const sourceAttributes = source.data.attributes;
  const sourceCorners = sourceIndex || Array.from({ length: sourceAttributes.position.array.length / 3 }, (_, i) => i);
  assert.equal(sourceCorners.length % 3, 0);
  const triangleCount = sourceCorners.length / 3;

  const materialIds = {};
  for (const [key, spec] of Object.entries(recipe.materials)) {
    const mat = new THREE.MeshStandardMaterial({
      color: spec.color, metalness: spec.metalness, roughness: spec.roughness, envMapIntensity: 1,
    });
    mat.name = spec.name;
    materialIds[key] = mat.uuid;
    data.scene.materials.push(mat.toJSON());
  }
  const originalMaterials = new Map(before.scene.materials.map(m => [m.uuid, m]));
  for (const node of nodes) {
    if (!node.geometry || node === sourceNode) continue;
    if (recipe.ladderNodes.includes(node.name)) node.material = materialIds.ladder;
    else if (recipe.yellowPipeNodes.includes(node.name)) node.material = materialIds.yellow;
    else if (originalMaterials.get(node.material)?.name !== 'L1_GLQFLQ_01_BL') node.material = materialIds.valve;
  }

  // Connect triangles at coincident positions, including non-indexed UV/normal seams.
  const parents = Array.from({ length: triangleCount }, (_, i) => i);
  const find = i => { while (parents[i] !== i) { parents[i] = parents[parents[i]]; i = parents[i]; } return i; };
  const welded = new Map();
  const p = new THREE.Vector3();
  const position = composite.geometry.attributes.position;
  for (let t = 0; t < triangleCount; t++) {
    for (let corner = 0; corner < 3; corner++) {
      p.fromBufferAttribute(position, sourceCorners[t * 3 + corner]).applyMatrix4(composite.matrixWorld);
      const key = p.toArray().map(v => Math.round(v * 10000)).join(',');
      if (welded.has(key)) parents[find(t)] = find(welded.get(key));
      else welded.set(key, t);
    }
  }
  const components = new Map();
  for (let t = 0; t < triangleCount; t++) {
    const key = find(t);
    if (!components.has(key)) components.set(key, { triangles: [], box: new THREE.Box3() });
    const component = components.get(key);
    component.triangles.push(t);
    for (let corner = 0; corner < 3; corner++) {
      component.box.expandByPoint(p.fromBufferAttribute(position, sourceCorners[t * 3 + corner]).applyMatrix4(composite.matrixWorld));
    }
  }

  const categories = { vessel: [], yellow: [], drain: [] };
  const componentReport = [];
  for (const component of components.values()) {
    const size = component.box.getSize(new THREE.Vector3());
    const center = component.box.getCenter(new THREE.Vector3());
    const sorted = [size.x, size.y, size.z].sort((a, b) => a - b);
    const tank = size.x > 100 && size.y > 18 && size.y < 35 && size.z > 18 && size.z < 35;
    const saddlePlate = component.triangles.length === 106 && size.x > 3 && size.x < 4 && size.y < 1.5 && size.z > 20;
    const structuralBox = component.triangles.length <= 12;
    const tube = !saddlePlate && !structuralBox && sorted[0] > 0.65 && sorted[2] > 6 && sorted[2] / sorted[0] > 3.8 && sorted[2] / sorted[1] > 1.6;
    // The short inline outlet on the main process run is wider than it is long.
    const outlet = Math.abs(center.y - 3.37) < 0.1 && center.x > 65 && size.x > 8 && size.y > 8 && size.z > 8;
    let category = 'vessel';
    if (!tank && (tube || outlet)) {
      category = component.box.max.y < -18 && component.box.min.z < -25 ? 'drain' : 'yellow';
    }
    categories[category].push(...component.triangles);
    if (category !== 'vessel') componentReport.push({ category, triangles: component.triangles.length,
      center: center.toArray().map(v => +v.toFixed(2)), size: size.toArray().map(v => +v.toFixed(2)) });
  }
  assert.ok(categories.vessel.length > 0 && categories.yellow.length > 0 && categories.drain.length > 0);
  assert.equal(Object.values(categories).reduce((sum, list) => sum + list.length, 0), triangleCount);

  const addedNodeIds = new Set();
  const newGeometry = [];
  function geometryFor(triangles, uuid, name) {
    const geometry = { uuid, type: 'BufferGeometry', name, data: { attributes: {} } };
    for (const [key, attr] of Object.entries(sourceAttributes)) {
      const array = [];
      for (const t of triangles) for (let corner = 0; corner < 3; corner++) {
        const vertex = sourceCorners[t * 3 + corner];
        for (let i = 0; i < attr.itemSize; i++) array.push(attr.array[vertex * attr.itemSize + i]);
      }
      geometry.data.attributes[key] = { ...attr, array };
    }
    return geometry;
  }
  const vesselGeometry = geometryFor(categories.vessel, source.uuid, source.name || sourceNode.name);
  data.scene.geometries[data.scene.geometries.indexOf(source)] = vesselGeometry;
  sourceNode.material = materialIds.vessel;
  for (const [category, label] of [['yellow', '工艺管道_黄色'], ['drain', '底部排污管道_红色']]) {
    const geometry = geometryFor(categories[category], randomUUID(), label);
    data.scene.geometries.push(geometry);
    newGeometry.push(geometry);
    const uuid = randomUUID();
    addedNodeIds.add(uuid);
    sourceNode.children ||= [];
    sourceNode.children.push({
      uuid, type: 'Mesh', name: label, layers: sourceNode.layers || 1,
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      geometry: geometry.uuid, material: materialIds[category],
      userData: { sourceMesh: sourceNode.name, materialRegion: category },
    });
  }

  // Compare the complete triangle attribute multiset, not merely the number of faces.
  function triangleSignatures(geometry) {
    const attrs = geometry.data.attributes;
    const keys = Object.keys(attrs).sort();
    const corners = geometry.data.index?.array || Array.from({ length: attrs.position.array.length / 3 }, (_, i) => i);
    const signatures = [];
    for (let t = 0; t < corners.length; t += 3) {
      const values = [];
      for (const key of keys) for (let c = 0; c < 3; c++) {
        const a = attrs[key], start = corners[t + c] * a.itemSize;
        for (let j = 0; j < a.itemSize; j++) values.push(a.array[start + j]);
      }
      signatures.push(createHash('sha256').update(JSON.stringify(values)).digest('hex'));
    }
    return signatures;
  }
  assert.deepEqual([vesselGeometry, ...newGeometry].flatMap(triangleSignatures).sort(), triangleSignatures(source).sort());
  const cleanedObject = object => {
    const copy = structuredClone(object);
    const clean = n => {
      delete n.material;
      if (n.children) {
        n.children = n.children.filter(c => !addedNodeIds.has(c.uuid));
        n.children.forEach(clean);
        if (!n.children.length) delete n.children;
      }
    };
    clean(copy); return copy;
  };
  assert.deepEqual(cleanedObject(data.scene.object), cleanedObject(before.scene.object));
  const referenced = new Set();
  let meshCount = 0;
  function count(node) {
    if (node.geometry) { meshCount++; [node.material].flat().forEach(id => referenced.add(id)); }
    (node.children || []).forEach(count);
  }
  count(data.scene.object);
  data.scene.materials = data.scene.materials.filter(m => referenced.has(m.uuid));
  data.stats.meshes = meshCount;
  data.stats.materials = data.scene.materials.length;
  data.notes = data.notes.filter(n => !n.startsWith('已补全 PBR 金属材质：') && !n.startsWith('卧式分离器配色：'));
  data.notes.push('卧式分离器配色：罐体与楼梯金属，工艺管道黄漆，底部排污管道红漆，阀门深灰铸钢。');
  data.notes.push('复合罐体网格增加两个材质子节点；所有原部件、顶点、法线及三角面均保留。');
  const afterRoot = await new THREE.ObjectLoader().parseAsync(data.scene);
  afterRoot.updateMatrixWorld(true);
  const beforeBox = new THREE.Box3().setFromObject(originalRoot);
  const afterBox = new THREE.Box3().setFromObject(afterRoot);
  assert.ok(beforeBox.min.distanceTo(afterBox.min) < 1e-5 && beforeBox.max.distanceTo(afterBox.max) < 1e-5);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8);
  const backup = path.join(directory, 'backups', 'before-separator-colors-' + stamp);
  await fs.mkdir(backup, { recursive: true });
  await fs.copyFile(path.join(directory, 'model.json'), path.join(backup, 'model.json'));
  await fs.copyFile(path.join(directory, 'metadata.json'), path.join(backup, 'metadata.json'));
  await store.save(data);
  console.log(JSON.stringify({ name: data.name, originalPartsPreserved: nodes.filter(n => n.geometry).length,
    meshes: meshCount, triangles: data.stats.triangles, materials: data.scene.materials.map(m => m.name),
    regionTriangles: Object.fromEntries(Object.entries(categories).map(([key, list]) => [key, list.length])),
    coloredComponents: componentReport, backup }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
