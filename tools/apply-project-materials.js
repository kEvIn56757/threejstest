// Apply a project's material recipe through the same snapshot store used by the UI.
// Usage: node tools/apply-project-materials.js <saved-model-id>
// Original snapshots are copied into a unique backup folder before any save.
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { createModelStore } = require('../project-model-store');

async function main() {
  const id = process.argv[2];
  const root = path.resolve(__dirname, '..', 'assets', 'imported-models');
  const store = createModelStore(root);
  const original = await store.read(id); // Validate the ID before resolving any recipe or backup path.
  const directory = path.join(root, id);
  const recipe = JSON.parse(await fs.readFile(path.join(directory, 'metal-materials.json'), 'utf8'));
  assert.equal(recipe.modelId, id);
  assert.ok(Array.isArray(recipe.materials) && recipe.materials.length > 0);
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const geometryHash = hash(original.scene.geometries);
  const objectHash = hash(original.scene.object);
  const modified = structuredClone(original);
  const changed = [];
  for (const specification of recipe.materials) {
    assert.match(specification.color, /^#[0-9a-f]{6}$/i);
    for (const key of ['metalness', 'roughness']) {
      assert.ok(Number.isFinite(specification[key]) && specification[key] >= 0 && specification[key] <= 1);
    }
    assert.ok(Number.isFinite(specification.envMapIntensity) && specification.envMapIntensity >= 0);
    const matches = modified.scene.materials.filter(m => m.name === specification.name);
    assert.equal(matches.length, 1, 'Expected exactly one material: ' + specification.name);
    const material = matches[0];
    material.type = 'MeshStandardMaterial';
    material.color = parseInt(specification.color.slice(1), 16);
    material.metalness = specification.metalness;
    material.roughness = specification.roughness;
    material.envMapIntensity = specification.envMapIntensity;
    material.emissive = 0;
    material.emissiveIntensity = 0;
    delete material.reflectivity;
    delete material.refractionRatio;
    delete material.shininess;
    delete material.specular;
    changed.push({ name: material.name, uuid: material.uuid });
  }
  let affectedMeshes = 0;
  const ids = new Set(changed.map(m => m.uuid));
  const visit = object => {
    if (object.geometry && [object.material].flat().some(id => ids.has(id))) affectedMeshes++;
    for (const child of object.children || []) visit(child);
  };
  visit(modified.scene.object);
  modified.notes = (modified.notes || []).filter(n => !n.startsWith('已补全 PBR 金属材质：'));
  modified.notes = modified.notes.map(n => n.startsWith('没有可用的贴图(')
    ? '原 FBX 没有附带图片贴图；金属表面已使用不依赖贴图的 PBR 材质。' : n);
  modified.notes.push(`已补全 PBR 金属材质：${changed.length} 组，覆盖 ${affectedMeshes} 个部件。`);
  assert.equal(hash(modified.scene.geometries), geometryHash);
  assert.equal(hash(modified.scene.object), objectHash);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8);
  const backup = path.join(directory, 'backups', 'before-metal-' + stamp);
  await fs.mkdir(backup, { recursive: true });
  await fs.copyFile(path.join(directory, 'model.json'), path.join(backup, 'model.json'));
  await fs.copyFile(path.join(directory, 'metadata.json'), path.join(backup, 'metadata.json'));
  await store.save(modified);
  const saved = await store.read(id);
  assert.equal(hash(saved.scene.geometries), geometryHash, 'Geometry must not change');
  assert.equal(hash(saved.scene.object), objectHash, 'Hierarchy and part transforms must not change');
  assert.deepEqual(saved.edit, original.edit);
  assert.deepEqual(saved.basePos, original.basePos);
  assert.equal(saved.baseScale, original.baseScale);
  console.log(JSON.stringify({ name: saved.name, changed, affectedMeshes, backup,
    geometryPreserved: true, hierarchyPreserved: true, editsPreserved: true }, null, 2));
}

main().catch(err => { console.error(err); process.exitCode = 1; });
