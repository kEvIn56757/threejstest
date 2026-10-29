// UV0 for the saved drain pipe: U around the section, V downstream by arc length.
// Hardware and all geometry attributes other than this pipe's UV stay intact.
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { createModelStore } = require('../project-model-store');

async function main() {
  const root = path.resolve(__dirname, '..');
  const library = path.join(root, 'assets/imported-models');
  const store = createModelStore(library);
  const id = process.argv[2] || '1ed40391-74c6-4ff2-9f91-fa6608bd8de4';
  const saved = await store.read(id);
  const before = structuredClone(saved);
  const THREE = await import(pathToFileURL(path.join(root, 'vendor/three.module.js')).href);
  let node;
  const visit = o => { if (o.name === '排污管道_红色') node = o; (o.children || []).forEach(visit); };
  visit(saved.scene.object);
  assert(node, '缺少红色管道节点');
  const geometry = saved.scene.geometries.find(g => g.uuid === node.geometry);
  assert(!geometry.data.index, '此脚本要求按面角存储的管道网格');
  const positions = geometry.data.attributes.position.array;
  const points = [], representatives = [], welded = new Map();
  for (let i = 0; i < positions.length; i += 3) {
    const p = new THREE.Vector3(...positions.slice(i, i + 3));
    const key = p.toArray().map(n => Math.round(n * 1e4)).join(',');
    if (!welded.has(key)) { welded.set(key, points.length); points.push(p); }
    representatives.push(welded.get(key));
  }
  const edges = new Map();
  for (let i = 0; i < representatives.length; i += 3) {
    const tri = representatives.slice(i, i + 3);
    for (let c = 0; c < 3; c++) {
      const a = tri[c], b = tri[(c + 1) % 3];
      const key = [Math.min(a, b), Math.max(a, b)].join(',');
      if (!edges.has(key)) edges.set(key, { a, b, count: 0 });
      edges.get(key).count++;
    }
  }
  const adjacent = points.map(() => new Set()), boundary = points.map(() => new Set());
  for (const { a, b, count } of edges.values()) {
    assert(count <= 2, '管道存在非流形边');
    adjacent[a].add(b); adjacent[b].add(a);
    if (count === 1) { boundary[a].add(b); boundary[b].add(a); }
  }
  const loops = [], seen = new Set();
  boundary.forEach((neighbors, i) => {
    if (!neighbors.size || seen.has(i)) return;
    const loop = [], queue = [i]; seen.add(i);
    for (const v of queue) {
      loop.push(v); assert.equal(boundary[v].size, 2);
      for (const n of boundary[v]) if (!seen.has(n)) { seen.add(n); queue.push(n); }
    }
    loops.push(loop);
  });
  assert.equal(loops.length, 2, '应为只有两个开口的连续管道');
  const center = ring => ring.reduce((c, v) => c.add(points[v]), new THREE.Vector3()).multiplyScalar(1 / ring.length);
  loops.sort((a, b) => center(b).y - center(a).y);
  const distance = new Map(loops[0].map(v => [v, 0]));
  const queue = loops[0].slice();
  for (const v of queue) for (const n of adjacent[v]) {
    if (!distance.has(n)) { distance.set(n, distance.get(v) + 1); queue.push(n); }
  }
  assert.equal(distance.size, points.length);
  const rings = [];
  for (const [v, level] of distance) (rings[level] ||= []).push(v);
  rings.forEach(ring => assert.equal(ring.length, loops[0].length, '截面拓扑不规则'));
  const centers = rings.map(center);
  const lengths = [0];
  centers.slice(1).forEach((c, i) => lengths.push(lengths[i] + c.distanceTo(centers[i])));
  const totalLength = lengths.at(-1);
  assert(totalLength > 0);
  const perVertex = new Map();
  let ref, previousNormal;
  rings.forEach((ring, level) => {
    // Walk section edges so its plane normal is independent of tube curvature.
    const ringSet = new Set(ring), ordered = [ring[0]];
    let last = -1, v = ring[0];
    do {
      const choices = [...adjacent[v]].filter(n => ringSet.has(n) && n !== last);
      assert(choices.length > 0);
      const next = choices[0]; last = v; v = next;
      if (v !== ordered[0]) ordered.push(v);
      assert(ordered.length <= ring.length);
    } while (v !== ordered[0]);
    assert.equal(ordered.length, ring.length);
    const normal = new THREE.Vector3();
    ordered.forEach((id, i) => normal.add(new THREE.Vector3().crossVectors(
      points[id].clone().sub(centers[level]), points[ordered[(i + 1) % ordered.length]].clone().sub(centers[level]))));
    normal.normalize();
    const tangent = level + 1 < rings.length ? centers[level + 1].clone().sub(centers[level]) : centers[level].clone().sub(centers[level - 1]);
    if (normal.dot(tangent) < 0) normal.negate();
    if (!ref) {
      const seam = ring.reduce((a, b) => points[a].x < points[b].x ? a : b);
      ref = points[seam].clone().sub(centers[level]).normalize();
    } else ref.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(previousNormal, normal));
    ref.addScaledVector(normal, -ref.dot(normal)).normalize();
    // Anchor the seam to an actual section vertex. Tiny source mesh deviations
    // must not put the seam inside a face (the shader requires UV in 0..1).
    const seam = ring.reduce((a, b) => points[a].clone().sub(centers[level]).normalize().dot(ref) > points[b].clone().sub(centers[level]).normalize().dot(ref) ? a : b);
    ref = points[seam].clone().sub(centers[level]).addScaledVector(normal,
      -points[seam].clone().sub(centers[level]).dot(normal)).normalize();
    const binormal = new THREE.Vector3().crossVectors(normal, ref);
    ring.forEach(id => {
      const radial = points[id].clone().sub(centers[level]);
      let u = Math.atan2(radial.dot(binormal), radial.dot(ref)) / (2 * Math.PI);
      u = ((u % 1) + 1) % 1;
      if (u < 1e-5 || u > 1 - 1e-5) u = 0;
      perVertex.set(id, [u, lengths[level] / totalLength]);
    });
    previousNormal = normal;
  });
  const uv = new Float32Array(representatives.length * 2);
  let signedArea = 0, absoluteArea = 0, minArea = Infinity, maxUSpan = 0;
  for (let i = 0; i < representatives.length; i += 3) {
    const q = representatives.slice(i, i + 3).map(id => perVertex.get(id).slice());
    if (Math.max(...q.map(v => v[0])) - Math.min(...q.map(v => v[0])) > .5) q.forEach(v => { if (v[0] < .5) v[0]++; });
    const area = ((q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1])) / 2;
    signedArea += area; absoluteArea += Math.abs(area); minArea = Math.min(minArea, Math.abs(area));
    maxUSpan = Math.max(maxUSpan, Math.max(...q.map(v => v[0])) - Math.min(...q.map(v => v[0])));
    q.forEach((value, c) => uv.set(value, (i + c) * 2));
  }
  assert([...uv].every(n => Number.isFinite(n) && n >= 0 && n <= 1.00001), 'UV 必须在 0 到 1 内，兼容材质的径向衰减');
  assert(minArea > 1e-8, '存在退化 UV 面');
  assert(Math.abs(Math.abs(signedArea) - absoluteArea) < 1e-6, '存在 UV 翻面');
  assert(Math.abs(absoluteArea - 1) < 1e-5, '展开未完整覆盖一个矩形');
  assert(maxUSpan < .2, '存在跨环向接缝的长三角形');
  // Shared positions must agree in V and differ in U only by an integer seam.
  const copies = new Map();
  representatives.forEach((id, i) => {
    const q = [uv[i * 2], uv[i * 2 + 1]];
    if (copies.has(id)) {
      const a = copies.get(id), gap = Math.abs(a[0] - q[0]);
      assert(Math.min(gap, Math.abs(gap - 1)) < 1e-6 && Math.abs(a[1] - q[1]) < 1e-6);
    } else copies.set(id, q);
  });
  geometry.data.attributes.uv = { itemSize: 2, type: 'Float32Array', array: [...uv], normalized: false };
  // Prove this edit changes UV only, before updating notes and saving.
  const comparison = structuredClone(saved);
  comparison.scene.geometries.find(g => g.uuid === geometry.uuid).data.attributes.uv = structuredClone(
    before.scene.geometries.find(g => g.uuid === geometry.uuid).data.attributes.uv);
  assert.deepEqual(comparison, before);
  const report = { node: node.name, channel: 'UV0', upstream: '顶部接口 V=0', downstream: '底部弯头出口 V=1',
    materialDirection: [0, -1], circumference: 'U=0..1', rings: rings.length, sectionVertices: rings[0].length,
    centerlineLengthCm: totalLength, triangles: representatives.length / 3, uvArea: absoluteArea,
    foldedTriangles: 0, brokenSeams: 0, centers: centers.map((c, i) => ({ position: c.toArray(), v: lengths[i] / totalLength })) };
  const directory = path.join(library, id);
  const backup = path.join(directory, 'backups', 'before-flow-uv-' + new Date().toISOString().replace(/[:.]/g, '-'));
  await fs.mkdir(backup, { recursive: true });
  for (const file of ['model.json', 'metadata.json']) await fs.copyFile(path.join(directory, file), path.join(backup, file));
  saved.notes = saved.notes.filter(n => !n.startsWith('管道 UV0：'));
  saved.notes.push('管道 UV0：U 环向 0~1，V 沿中心线从顶部 0 连续递增到底部弯头出口 1；适配 GasFlow_HDRP 的 Direction=(0,-1)。');
  await store.save(saved);
  await fs.writeFile(path.join(directory, 'flow-uv-report.json'), JSON.stringify(report, null, 2));
  // Export deliverables using the same exporter as the application.
  const object = await new THREE.ObjectLoader().parseAsync(saved.scene);
  object.updateMatrixWorld(true);
  const exporters = vm.runInNewContext(await fs.readFile(path.join(root, 'fbx-exporter.js'), 'utf8') + '\n({exportGLB,exportFBX});',
    { TextEncoder, Uint8Array, Uint32Array, Float32Array, Float64Array, Int32Array, DataView, ArrayBuffer, console });
  const out = path.join(root, 'exports', '排污管道单体_流动UV');
  await fs.mkdir(out, { recursive: true });
  const glb = Buffer.from(exporters.exportGLB(object));
  const fbx = exporters.exportFBX(object);
  await fs.writeFile(path.join(out, '排污管道单体_流动UV.glb'), glb);
  await fs.writeFile(path.join(out, '排污管道单体_流动UV.fbx'), fbx.bytes);
  // Check the actual exported TEXCOORD_0 bytes against the saved pipe UV.
  const jsonLength = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  const meshIndex = json.nodes.find(n => n.name === node.name).mesh;
  const accessor = json.accessors[json.meshes[meshIndex].primitives[0].attributes.TEXCOORD_0];
  const view = json.bufferViews[accessor.bufferView];
  const offset = 28 + jsonLength + view.byteOffset + (accessor.byteOffset || 0);
  assert.equal(accessor.count, representatives.length);
  for (let i = 0; i < uv.length; i++) assert.equal(glb.readFloatLE(offset + i * 4), uv[i]);
  console.log(JSON.stringify({ report, backup, exportDirectory: out, glbUVVerified: true }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
