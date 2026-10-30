const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { createModelStore } = require('../project-model-store');

module.exports = async function exportPressureDial(saved) {
  const directory = path.resolve(__dirname, '..');
  const THREE = await import(pathToFileURL(path.join(directory, 'vendor/three.module.js')).href);
  const loader = new THREE.ObjectLoader();
  loader.parseImagesAsync = async images => Object.fromEntries(images.map(i => [i.uuid,
    new THREE.TextureSource({ src: i.url, width: 2048, height: 2048 })]));
  const root = await loader.parseAsync(saved.scene); root.updateMatrixWorld(true);
  const exporter = vm.runInNewContext(await fs.readFile(path.join(directory, 'fbx-exporter.js'), 'utf8') + '\n({exportFBX,exportGLB});',
    { TextEncoder, Uint8Array, Uint32Array, Float32Array, Float64Array, Int32Array, DataView, ArrayBuffer, atob, console });
  const output = path.join(directory, 'exports/压力表_贴图与独立指针');
  await fs.mkdir(output, { recursive: true });
  async function write(object, name) {
    object.updateMatrixWorld(true);
    const fbx = exporter.exportFBX(object);
    await fs.writeFile(path.join(output, name + '.fbx'), fbx.bytes);
    await fs.writeFile(path.join(output, name + '.glb'), exporter.exportGLB(object));
    for (const image of fbx.images) await fs.writeFile(path.join(output, image.name), image.bytes);
  }
  await write(root, '压力变送器_完整装配');
  const gauge = new THREE.Group(), gaugeParts = root.getObjectByName('压力表总成');
  const groupClone = gaugeParts.clone(true);
  gaugeParts.matrixWorld.decompose(groupClone.position, groupClone.quaternion, groupClone.scale);
  gauge.add(groupClone); gauge.updateMatrixWorld(true);
  const gaugeFace = gauge.getObjectByName('压力表_表盘'); gaugeFace.geometry.computeBoundingBox();
  const center = gaugeFace.geometry.boundingBox.getCenter(new THREE.Vector3());
  const dialCenter = gaugeFace.localToWorld(center); groupClone.position.sub(dialCenter);
  await write(gauge, '压力表_独立指针');
  const needle = root.getObjectByName('指针'), needleOnly = needle.clone();
  needle.matrixWorld.decompose(needleOnly.position, needleOnly.quaternion, needleOnly.scale);
  await write(needleOnly, '指针_保留表盘中心轴心');
  await fs.copyFile(path.join(directory, 'assets/imported-models', saved.id, 'textures/pressure-dial.png'), path.join(output, 'pressure-dial.png'));
  return output;
};
if (require.main === module) {
  createModelStore(path.resolve(__dirname, '../assets/imported-models')).read('d6b7bee9-ca9b-4f34-8335-d72ed3cc755d')
    .then(module.exports).then(console.log).catch(err => { console.error(err); process.exitCode = 1; });
}
