// Extract the right-hand drain assembly as a separate library model, without
// changing the separator. Select complete connected parts, never clip faces.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { createModelStore } = require('../project-model-store');

async function main() {
  const library = path.resolve(__dirname, '../assets/imported-models');
  const store = createModelStore(library);
  const id = process.argv[2];
  const saved = await store.read(id);
  const sourceFile = path.join(library, id, 'model.json');
  const digest = async () => createHash('sha256').update(await fs.readFile(sourceFile)).digest('hex');
  const before = await digest();
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  const source = await new THREE.ObjectLoader().parseAsync(saved.scene);
  source.updateMatrixWorld(true);
  // World-space centimeters, around one of the two bottom drain branches.
  const region = new THREE.Box3(new THREE.Vector3(39, -56, -41), new THREE.Vector3(49, -18, -16));
  const assembly = new THREE.Group();
  assembly.name = '排污管道单体';
  assembly.userData = { sourceModelId: id, sourceModelName: saved.name, branch: '右侧底部排污支路' };
  const report = [];
  source.traverse(mesh => {
    if (!mesh.isMesh) return;
    if (Array.isArray(mesh.material)) throw new Error('请先拆分多材质网格');
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    geometry.computeBoundingBox();
    if (!region.intersectsBox(geometry.boundingBox)) return;
    const position = geometry.attributes.position;
    const count = position.count / 3;
    let selected = [];
    let componentCount = 1;
    if (region.containsBox(geometry.boundingBox)) {
      selected = Array.from({ length: count }, (_, i) => i);
    } else {
      const parents = Array.from({ length: count }, (_, i) => i);
      const find = i => { while (parents[i] !== i) { parents[i] = parents[parents[i]]; i = parents[i]; } return i; };
      const vertices = new Map();
      const point = new THREE.Vector3();
      for (let t = 0; t < count; t++) {
        for (let c = 0; c < 3; c++) {
          point.fromBufferAttribute(position, t * 3 + c);
          const key = point.toArray().map(n => Math.round(n * 10000)).join(',');
          if (vertices.has(key)) parents[find(t)] = find(vertices.get(key));
          else vertices.set(key, t);
        }
      }
      const components = new Map();
      for (let t = 0; t < count; t++) {
        const componentId = find(t);
        if (!components.has(componentId)) components.set(componentId, { faces: [], box: new THREE.Box3() });
        const component = components.get(componentId);
        component.faces.push(t);
        for (let c = 0; c < 3; c++) component.box.expandByPoint(point.fromBufferAttribute(position, t * 3 + c));
      }
      const picked = [...components.values()].filter(c => region.containsBox(c.box));
      componentCount = picked.length;
      selected = picked.flatMap(c => c.faces);
    }
    if (!selected.length) return;
    const partGeometry = new THREE.BufferGeometry();
    for (const [key, attribute] of Object.entries(geometry.attributes)) {
      const values = new attribute.array.constructor(selected.length * 3 * attribute.itemSize);
      let offset = 0;
      for (const t of selected) {
        const start = t * 3 * attribute.itemSize;
        values.set(attribute.array.subarray(start, start + 3 * attribute.itemSize), offset);
        offset += 3 * attribute.itemSize;
      }
      partGeometry.setAttribute(key, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
    }
    const part = new THREE.Mesh(partGeometry, mesh.material);
    part.name = mesh.name === 'L1_GLQFLQ_01_M1_13_0' ? '法兰与连接件' : mesh.name === '底部排污管道_红色' ? '排污管道_红色' : mesh.name;
    part.userData = { ...mesh.userData, sourceNodeName: mesh.name };
    part.castShadow = true;
    part.receiveShadow = true;
    assembly.add(part);
    report.push({ name: part.name, material: mesh.material.name, triangles: selected.length, connectedParts: componentCount });
  });
  for (const required of ['排污管道_红色', '法兰与连接件', 'L1_GLQFLQ_01_M10_13', 'L1_GLQFLQ_01_M11_13', 'L1_GLQFLQ_01_M12_13_1']) {
    if (!assembly.getObjectByName(required)) throw new Error('支路不完整，缺少: ' + required);
  }
  const redPipe = report.find(p => p.name === '排污管道_红色');
  if (redPipe.triangles !== 160 || redPipe.connectedParts !== 1) throw new Error('必须恰好提取一根完整红色排污管');
  assembly.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(assembly);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // Bake a useful local origin at the assembly center; retain physical size.
  assembly.children.forEach(part => part.geometry.translate(-center.x, -center.y, -center.z));
  assembly.updateMatrixWorld(true);
  const scene = assembly.toJSON();
  const triangles = report.reduce((sum, p) => sum + p.triangles, 0);
  const stats = { meshes: report.length, triangles, vertices: triangles * 3,
    materials: scene.materials.length, textured: 0, size: size.toArray(),
    unitScaleFactor: 1, scaleApplied: 1, texturesProvided: 0 };
  // Confirm serialized geometry reloads with exactly the same parts and size.
  const roundTrip = await new THREE.ObjectLoader().parseAsync(scene);
  const reloadedSize = new THREE.Box3().setFromObject(roundTrip).getSize(new THREE.Vector3());
  if (reloadedSize.distanceTo(size) > 0.0001) throw new Error('序列化后尺寸变化');
  if (await digest() !== before) throw new Error('原模型发生变化，停止保存');
  const metadata = await store.save({ name: assembly.name, sourceFile: saved.sourceFile,
    stats, scene, basePos: { x: 0, y: 0, z: 0 }, baseScale: 1,
    edit: { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, s: 1 },
    notes: ['从“排污”卧式分离器右侧底部提取的单套排污支路，原分离器未修改。',
      '包含红色管道、两组阀门及手轮、连接法兰紧固件和压力仪表。',
      '保留源模型尺寸和材质；独立节点可继续编辑，原点位于组件中心。'] });
  if (await digest() !== before) throw new Error('原模型校验失败');
  console.log(JSON.stringify({ metadata, sourceUnchanged: true, sourceSha256: before,
    sourceRegion: { min: box.min.toArray(), max: box.max.toArray() }, parts: report }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
