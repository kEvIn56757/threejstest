// Inspect saved geometry in world-space centimeters; optional connected-component report.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createModelStore } = require('../project-model-store');

async function inspect() {
  const saved = await createModelStore(path.resolve(__dirname, '../assets/imported-models')).read(process.argv[2]);
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  const root = await new THREE.ObjectLoader().parseAsync(saved.scene);
  root.updateMatrixWorld(true);
  const target = process.argv[3];
  const round = a => a.map(n => +n.toFixed(2));
  const report = [];
  root.traverse(mesh => {
    if (!mesh.isMesh || (target && mesh.name !== target)) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const item = { name: mesh.name, material: mesh.material.name,
      triangles: (mesh.geometry.index?.count || mesh.geometry.attributes.position.count) / 3,
      center: round(box.getCenter(new THREE.Vector3()).toArray()),
      size: round(box.getSize(new THREE.Vector3()).toArray()),
      min: round(box.min.toArray()), max: round(box.max.toArray()) };
    if (target) {
      const position = mesh.geometry.attributes.position;
      const index = mesh.geometry.index;
      const count = (index?.count || position.count) / 3;
      const parents = Array.from({ length: count }, (_, i) => i);
      const find = i => { while (parents[i] !== i) { parents[i] = parents[parents[i]]; i = parents[i]; } return i; };
      const vertices = new Map();
      const v = new THREE.Vector3();
      for (let t = 0; t < count; t++) {
        for (let c = 0; c < 3; c++) {
          const i = index ? index.getX(t * 3 + c) : t * 3 + c;
          v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
          const key = [v.x, v.y, v.z].map(n => Math.round(n * 10000)).join(',');
          const previous = vertices.get(key);
          if (previous === undefined) vertices.set(key, t);
          else parents[find(t)] = find(previous);
        }
      }
      const components = new Map();
      for (let t = 0; t < count; t++) {
        const id = find(t);
        if (!components.has(id)) components.set(id, { triangles: 0, box: new THREE.Box3() });
        const component = components.get(id);
        component.triangles++;
        for (let c = 0; c < 3; c++) {
          const i = index ? index.getX(t * 3 + c) : t * 3 + c;
          component.box.expandByPoint(v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
        }
      }
      item.components = [...components.values()].map(({ triangles, box }) => ({ triangles,
        center: round(box.getCenter(new THREE.Vector3()).toArray()),
        size: round(box.getSize(new THREE.Vector3()).toArray()),
        min: round(box.min.toArray()), max: round(box.max.toArray()),
      })).sort((a, b) => b.triangles - a.triangles);
    }
    report.push(item);
  });
  console.log(JSON.stringify({ name: saved.name, edit: saved.edit, meshes: report }, null, 2));
}
inspect().catch(e => { console.error(e); process.exitCode = 1; });
