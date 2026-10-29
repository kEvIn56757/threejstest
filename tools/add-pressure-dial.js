const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { createModelStore } = require('../project-model-store');

async function main() {
  const directory = path.resolve(__dirname, '..');
  const id = 'd6b7bee9-ca9b-4f34-8335-d72ed3cc755d';
  const folder = path.join(directory, 'assets/imported-models', id);
  const store = createModelStore(path.dirname(folder));
  const saved = await store.read(id);
  assert(!saved.scene.object.children?.some(o => o.name === '指针'), '请使用未添加指针的模型');
  const THREE = await import(pathToFileURL(path.join(directory, 'vendor/three.module.js')).href);
  const root = await new THREE.ObjectLoader().parseAsync(saved.scene);
  assert(!root.getObjectByName('指针'), '已有指针，停止重复添加');
  const face = root.getObjectByName('压力表_表盘');
  assert(face?.isMesh);
  face.geometry.computeBoundingBox();
  const center = face.geometry.boundingBox.getCenter(new THREE.Vector3());
  const size = face.geometry.boundingBox.getSize(new THREE.Vector3());
  assert(size.z < 1e-5, '表盘应位于自身 XY 平面');
  const radius = Math.min(size.x, size.y) / 2;
  const uv = new Float32Array(face.geometry.attributes.position.count * 2);
  const p = face.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = .5 + (p.getX(i) - center.x) / (2 * radius);
    uv[i * 2 + 1] = .5 + (p.getY(i) - center.y) / (2 * radius);
  }
  face.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  face.material = face.material.clone();
  face.material.name = '压力表_刻度贴图';
  face.material.color.set('#ffffff'); face.material.metalness = 0; face.material.roughness = .62;

  // The mesh's own local origin is the spindle center. Its local Z points out
  // of the dial; rotate this mesh around local Z to animate the reading.
  const shape = new THREE.Shape();
  shape.moveTo(-radius * .015, -radius * .15);
  shape.lineTo(-radius * .034, -radius * .06);
  shape.lineTo(-radius * .014, radius * .72);
  shape.lineTo(0, radius * .84);
  shape.lineTo(radius * .014, radius * .72);
  shape.lineTo(radius * .034, -radius * .06);
  shape.lineTo(radius * .015, -radius * .15);
  shape.closePath();
  const body = new THREE.ExtrudeGeometry(shape, { depth: radius * .012, bevelEnabled: false });
  const cap = new THREE.CylinderGeometry(radius * .065, radius * .065, radius * .024, 32);
  cap.rotateX(Math.PI / 2); cap.translate(0, 0, radius * .012);
  const needleGeometry = new THREE.BufferGeometry();
  const geometries = [body, cap.index ? cap.toNonIndexed() : cap];
  for (const name of ['position', 'normal', 'uv']) {
    const itemSize = geometries[0].attributes[name].itemSize;
    const arrays = geometries.map(g => g.attributes[name].array);
    const array = new Float32Array(arrays.reduce((sum, a) => sum + a.length, 0));
    let offset = 0; arrays.forEach(a => { array.set(a, offset); offset += a.length; });
    needleGeometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  }
  const material = new THREE.MeshStandardMaterial({ color: '#c82127', metalness: .15, roughness: .38 });
  material.name = '指针_红色烤漆';
  const needle = new THREE.Mesh(needleGeometry, material);
  needle.name = '指针';
  needle.position.copy(center); needle.position.z += radius * .008;
  needle.rotation.z = (225 - .6 / 1.6 * 270 - 90) * Math.PI / 180;
  needle.castShadow = false; needle.receiveShadow = false;
  needle.userData = { preservePivot: true, rotationAxis: 'local Z', minValue: 0, maxValue: 1.6,
    unit: 'MPa', zeroAngleDegrees: 135, fullScaleAngleDegrees: -135, displayValue: .6,
    note: 'localRotation Z = 135 - 270 * pressureMPa / 1.6' };
  face.parent.add(needle); root.updateMatrixWorld(true);
  const faceCenterWorld = face.localToWorld(center.clone());
  const pivotWorld = needle.getWorldPosition(new THREE.Vector3());
  const dialNormal = new THREE.Vector3(0, 0, 1).transformDirection(face.matrixWorld);
  const gap = pivotWorld.clone().sub(faceCenterWorld);
  assert(gap.clone().addScaledVector(dialNormal, -gap.dot(dialNormal)).length() < 1e-6);
  const originalPivot = pivotWorld.clone();
  for (const angle of [135, 0, -135]) {
    needle.rotation.z = angle * Math.PI / 180; root.updateMatrixWorld(true);
    assert(needle.getWorldPosition(new THREE.Vector3()).distanceTo(originalPivot) < 1e-8);
  }
  needle.rotation.z = 33.75 * Math.PI / 180; root.updateMatrixWorld(true);
  const scene = root.toJSON();
  const png = await fs.readFile(path.join(folder, 'textures/pressure-dial.png'));
  const texture = new THREE.Texture(); texture.name = 'pressure-dial'; texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const textureJSON = texture.toJSON(); delete textureJSON.metadata;
  scene.textures = [textureJSON];
  scene.images = [{ uuid: textureJSON.image, url: 'data:image/png;base64,' + png.toString('base64') }];
  scene.materials.find(m => m.uuid === face.material.uuid).map = texture.uuid;

  const backup = path.join(folder, 'backups', 'before-dial-and-pointer-' + new Date().toISOString().replace(/[:.]/g, '-'));
  await fs.mkdir(backup, { recursive: true });
  for (const file of ['model.json', 'metadata.json']) await fs.copyFile(path.join(folder, file), path.join(backup, file));
  let meshes = 0, triangles = 0, vertices = 0;
  root.traverse(o => { if (o.isMesh) { meshes++; triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3; vertices += o.geometry.attributes.position.count; } });
  saved.scene = scene;
  saved.stats = { ...saved.stats, meshes, triangles, vertices, materials: scene.materials.length, textured: 1, texturesProvided: 1 };
  saved.notes = saved.notes.filter(n => !n.startsWith('保留全部') && !n.startsWith('原 2 个网格'));
  saved.notes.push('表盘已添加 0–1.6 MPa 刻度贴图，指针为独立节点“指针”；锚点位于表盘中心，绕局部 Z 轴旋转。',
    '指针默认显示 0.6 MPa；角度公式为 Z = 135° - 270° × 压力 / 1.6。FBX/GLB 保留指针局部轴与中心锚点。');
  await store.save(saved);
  const output = await require('./export-pressure-dial')(saved);
  console.log(JSON.stringify({ meshes, triangles, pivotWorldCm: originalPivot.toArray(), localRotationAxis: 'Z',
    rangeMPa: [0, 1.6], defaultReadingMPa: .6, backup, output }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
