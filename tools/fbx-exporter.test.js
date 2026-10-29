const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

test('GLB JSON and BIN chunks stay byte-aligned with Chinese material and mesh names', async () => {
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  const source = await fs.readFile(path.resolve(__dirname, '../fbx-exporter.js'), 'utf8');
  const exportGLB = vm.runInNewContext(source + '\nexportGLB;', {
    TextEncoder, Uint8Array, Uint32Array, Float32Array, DataView, ArrayBuffer,
  });
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xb2bbc3, metalness: 0.88, roughness: 0.33 });
  material.name = '分离罐金属';
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 5), material);
  mesh.name = '分离罐';
  group.add(mesh);
  group.updateMatrixWorld(true);
  const bytes = Buffer.from(exportGLB(group));
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(jsonLength % 4, 0);
  assert.equal(bytes.length % 4, 0);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  assert.equal(gltf.nodes[0].name, '分离罐');
  assert.equal(gltf.materials[0].name, '分离罐金属');
  assert.equal(gltf.materials[0].pbrMetallicRoughness.metallicFactor, 0.88);
  assert.equal(bytes.readUInt32LE(20 + jsonLength + 4), 0x004e4942);
  assert.equal(bytes.readUInt32LE(20 + jsonLength), bytes.length - 28 - jsonLength);
});

test('opt-in pointer keeps its spindle pivot and local rotation axes in FBX and GLB', async () => {
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  const { FBXLoader } = await import(pathToFileURL(path.resolve(__dirname, '../vendor/addons/FBXLoader.js')).href);
  const source = await fs.readFile(path.resolve(__dirname, '../fbx-exporter.js'), 'utf8');
  const exporters = vm.runInNewContext(source + '\n({exportGLB,exportFBX});', {
    TextEncoder, Uint8Array, Uint32Array, Float32Array, DataView, ArrayBuffer,
  });
  const root = new THREE.Group(); root.position.set(22, -8, 30); root.rotation.y = .75; root.scale.setScalar(.33);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.2, 6, .1).translate(0, 2.5, 0), new THREE.MeshStandardMaterial());
  needle.name = '指针'; needle.position.set(-2, 10, 12); needle.rotation.z = .35; needle.userData.preservePivot = true;
  root.add(needle); root.updateMatrixWorld(true);
  const expectedPivot = needle.getWorldPosition(new THREE.Vector3()).multiplyScalar(.01);
  const expectedAxis = new THREE.Vector3(0, 0, 1).transformDirection(needle.matrixWorld);
  const fbx = Buffer.from(exporters.exportFBX(root).bytes);
  const reloaded = new FBXLoader().parse(fbx.buffer.slice(fbx.byteOffset, fbx.byteOffset + fbx.byteLength), '');
  const importedNeedle = reloaded.getObjectByName('指针'); reloaded.updateMatrixWorld(true);
  assert(importedNeedle.getWorldPosition(new THREE.Vector3()).distanceTo(expectedPivot) < 1e-8);
  assert(new THREE.Vector3(0, 0, 1).transformDirection(importedNeedle.matrixWorld).distanceTo(expectedAxis) < 1e-8);
  const beforePivot = importedNeedle.getWorldPosition(new THREE.Vector3());
  importedNeedle.rotateZ(Math.PI / 2); reloaded.updateMatrixWorld(true);
  assert(importedNeedle.getWorldPosition(new THREE.Vector3()).distanceTo(beforePivot) < 1e-8);
  const bytes = Buffer.from(exporters.exportGLB(root)), jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  const matrix = new THREE.Matrix4().fromArray(json.nodes[0].matrix);
  assert(new THREE.Vector3().setFromMatrixPosition(matrix).distanceTo(expectedPivot) < 1e-8);
  assert(new THREE.Vector3(0, 0, 1).transformDirection(matrix).distanceTo(expectedAxis) < 1e-8);
  const accessor = json.accessors[json.meshes[0].primitives[0].attributes.POSITION];
  const view = json.bufferViews[accessor.bufferView], dataStart = 28 + jsonLength + view.byteOffset;
  const pos = needle.geometry.attributes.position;
  const local = new THREE.Vector3(bytes.readFloatLE(dataStart), bytes.readFloatLE(dataStart + 4), bytes.readFloatLE(dataStart + 8));
  const expectedVertex = new THREE.Vector3().fromBufferAttribute(pos, needle.geometry.index.getX(0)).applyMatrix4(needle.matrixWorld).multiplyScalar(.01);
  assert(local.applyMatrix4(matrix).distanceTo(expectedVertex) < 1e-7);
});

test('embedded dial PNG stays intact and GLB UVs retain upright image orientation', async () => {
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  const source = await fs.readFile(path.resolve(__dirname, '../fbx-exporter.js'), 'utf8');
  const exporters = vm.runInNewContext(source + '\n({exportGLB,exportFBX});', {
    TextEncoder, Uint8Array, Uint32Array, Float32Array, DataView, ArrayBuffer, atob,
  });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAt8AAAAASUVORK5CYII=', 'base64');
  const material = new THREE.MeshStandardMaterial(); material.name = '表盘';
  material.map = new THREE.Texture({ src: 'data:image/png;base64,' + png.toString('base64'), width: 1, height: 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const bytes = Buffer.from(exporters.exportGLB(mesh)), jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  assert.equal(json.images.length, 1);
  const view = json.bufferViews[json.images[0].bufferView], binStart = 28 + jsonLength;
  assert(bytes.subarray(binStart + view.byteOffset, binStart + view.byteOffset + view.byteLength).equals(png));
  const uvAccessor = json.accessors[json.meshes[0].primitives[0].attributes.TEXCOORD_0];
  const uvView = json.bufferViews[uvAccessor.bufferView];
  assert.equal(bytes.readFloatLE(binStart + uvView.byteOffset + 4), 0); // first plane vertex is at V=1 in Three.js
  const fbx = exporters.exportFBX(mesh);
  assert.equal(fbx.images.length, 1);
  assert(Buffer.from(fbx.images[0].bytes).equals(png));
});
