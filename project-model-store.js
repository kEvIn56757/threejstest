// Local project model library. Each model has readable metadata and a Three.js
// Object JSON snapshot containing every part, material and embedded texture.
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function storeError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function createModelStore(root) {
  const libraryRoot = path.resolve(root);
  function directory(id) {
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw storeError('模型 ID 无效');
    return path.join(libraryRoot, id);
  }
  async function read(id) {
    try {
      return JSON.parse(await fs.readFile(path.join(directory(id), 'model.json'), 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') throw storeError('项目模型不存在', 404);
      throw err;
    }
  }
  async function list() {
    let entries;
    try { entries = await fs.readdir(libraryRoot, { withFileTypes: true }); }
    catch (err) { if (err.code === 'ENOENT') return []; throw err; }
    const models = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !ID_PATTERN.test(entry.name)) continue;
      try {
        models.push(JSON.parse(await fs.readFile(path.join(directory(entry.name), 'metadata.json'), 'utf8')));
      } catch (err) {
        // One damaged record must not prevent other saved models from loading.
        console.warn('[models] 无法读取模型记录:', entry.name, err.message);
      }
    }
    return models.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async function atomicJson(file, data) {
    const temporary = file + '.' + randomUUID() + '.tmp';
    try {
      await fs.writeFile(temporary, JSON.stringify(data), 'utf8');
      await fs.rename(temporary, file);
    } finally {
      await fs.unlink(temporary).catch(err => { if (err.code !== 'ENOENT') throw err; });
    }
  }
  async function save(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw storeError('保存数据无效');
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 200) throw storeError('请输入有效的模型名称');
    const scene = input.scene;
    if (!scene || scene.metadata?.type !== 'Object' || !scene.object?.type || !scene.object.uuid) {
      throw storeError('缺少有效的 Three.js 模型数据');
    }
    const edit = input.edit;
    if (!edit || !['px', 'py', 'pz', 'rx', 'ry', 'rz', 's'].every(k => Number.isFinite(edit[k])) || edit.s <= 0) {
      throw storeError('模型变换数据无效');
    }
    const basePos = input.basePos;
    if (!basePos || !['x', 'y', 'z'].every(k => Number.isFinite(basePos[k])) ||
      !Number.isFinite(input.baseScale) || input.baseScale <= 0) throw storeError('模型基础变换无效');
    const stats = input.stats;
    if (!stats || !Number.isFinite(stats.meshes) || !Number.isFinite(stats.triangles) ||
      !Number.isFinite(stats.materials) || !Array.isArray(stats.size) || stats.size.length !== 3 ||
      !stats.size.every(Number.isFinite)) throw storeError('模型统计数据无效');

    const id = input.id || randomUUID();
    const dir = directory(id);
    let createdAt = new Date().toISOString();
    if (input.id) createdAt = (await read(id)).createdAt;
    const metadata = {
      version: 1, id, name, sourceFile: typeof input.sourceFile === 'string' ? input.sourceFile : '',
      createdAt, updatedAt: new Date().toISOString(), stats,
      notes: Array.isArray(input.notes) ? input.notes.filter(n => typeof n === 'string') : [],
      basePos: { x: basePos.x, y: basePos.y, z: basePos.z }, baseScale: input.baseScale,
      edit: Object.fromEntries(['px', 'py', 'pz', 'rx', 'ry', 'rz', 's'].map(k => [k, edit[k]])),
      path: `assets/imported-models/${id}/model.json`,
    };
    await fs.mkdir(dir, { recursive: true });
    await atomicJson(path.join(dir, 'model.json'), { ...metadata, scene });
    await atomicJson(path.join(dir, 'metadata.json'), metadata);
    return metadata;
  }
  return { list, read, save };
}

module.exports = { createModelStore };
