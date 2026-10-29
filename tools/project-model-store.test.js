const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { createModelStore } = require('../project-model-store');
const { createServer } = require('../serve');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threejs-model-save-'));
  t.after(async () => {
    assert.equal(path.dirname(root), os.tmpdir());
    await fs.rm(root, { recursive: true, force: true });
  });
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  const group = new THREE.Group();
  group.name = '排污';
  const mat = new THREE.MeshStandardMaterial({ color: 0x416c94, roughness: 0.27 });
  mat.name = '阀体材质';
  mat.map = new THREE.DataTexture(new Uint8Array([255, 32, 64, 255]), 1, 1);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 15), mat);
  mesh.name = '阀体';
  group.add(mesh);
  const hidden = mesh.clone();
  hidden.name = '隐藏部件'; hidden.visible = false; hidden.userData.noExport = true;
  group.add(hidden);
  group.position.set(12, -2, 3); group.rotation.x = -Math.PI / 2; group.scale.setScalar(2);
  group.updateMatrix();
  const payload = {
    name: '排污', sourceFile: '排污.fbx',
    stats: { meshes: 2, triangles: 24, vertices: 48, materials: 1, textured: 2, size: [10, 20, 30] },
    notes: ['测试保存'], basePos: { x: 10, y: -2, z: 3 }, baseScale: 1,
    edit: { px: 2, py: 0, pz: 0, rx: -90, ry: 0, rz: 0, s: 2 },
    scene: group.toJSON(),
  };
  return { root, THREE, payload };
}

test('project snapshot survives disk reload, preserves parts, transforms, materials and texture bytes', async t => {
  const { root, THREE, payload } = await fixture(t);
  const store = createModelStore(root);
  assert.deepEqual(await store.list(), []);
  const created = await store.save(payload);
  const freshStore = createModelStore(root);
  const snapshot = await freshStore.read(created.id);
  const restored = await new THREE.ObjectLoader().parseAsync(snapshot.scene);
  assert.equal(restored.name, '排污');
  assert.equal(restored.children.length, 2);
  assert.equal(restored.children[1].visible, false);
  assert.equal(restored.children[1].userData.noExport, true);
  assert.equal(restored.children[0].material.name, '阀体材质');
  assert.equal(restored.children[0].material.roughness, 0.27);
  assert.deepEqual([...restored.children[0].material.map.image.data], [255, 32, 64, 255]);
  assert.deepEqual(restored.position.toArray(), [12, -2, 3]);
  assert.equal(restored.scale.x, 2);
  assert.ok(Math.abs(restored.rotation.x + Math.PI / 2) < 1e-10);
  assert.deepEqual(snapshot.edit, payload.edit);
  const updated = await freshStore.save({ ...payload, id: created.id, name: '排污修改版' });
  assert.equal(updated.id, created.id);
  assert.equal(updated.createdAt, created.createdAt);
  assert.equal((await freshStore.list()).length, 1);
  assert.equal((await freshStore.read(created.id)).name, '排污修改版');
  await assert.rejects(() => freshStore.read('../outside'), /模型 ID 无效/);
  await assert.rejects(() => freshStore.save({ ...payload, id: '../outside' }), /模型 ID 无效/);
  await assert.rejects(() => freshStore.save({ ...payload, scene: {} }), /模型数据/);
  assert.equal((await freshStore.read(created.id)).name, '排污修改版');
});

test('local HTTP API lists, saves, restores and rejects foreign origins and invalid input', async t => {
  const { root, payload } = await fixture(t);
  const server = createServer({ root });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (data, origin = base) => fetch(base + '/api/project-models', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: typeof data === 'string' ? data : JSON.stringify(data),
  });
  assert.deepEqual(await (await fetch(base + '/api/project-models')).json(), { models: [] });
  assert.equal((await post(payload, 'https://unrelated.example')).status, 403);
  assert.equal((await post('{')).status, 400);
  assert.equal((await post({ ...payload, edit: { ...payload.edit, s: 0 } })).status, 400);
  const response = await post(payload);
  assert.equal(response.status, 201);
  const { model } = await response.json();
  assert.equal(model.name, '排污');
  const saved = await (await fetch(base + '/api/project-models/' + model.id)).json();
  assert.equal(saved.scene.object.name, '排污');
  assert.equal((await (await fetch(base + '/api/project-models')).json()).models.length, 1);
  assert.equal((await post({ ...payload, id: model.id })).status, 200);
  assert.equal((await fetch(base + '/api/project-models/not-an-id')).status, 400);
  assert.equal((await fetch(base + '/api/project-models/00000000-0000-4000-8000-000000000000')).status, 404);
  const raw = JSON.parse(await fs.readFile(path.join(root, model.path), 'utf8'));
  assert.equal(raw.scene.object.children[1].visible, false);
});
