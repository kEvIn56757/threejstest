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
