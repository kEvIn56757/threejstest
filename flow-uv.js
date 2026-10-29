// flow-uv.js — 管道流动 UV 展开(浏览器 / Node 通用, 只依赖 BufferGeometry 的属性访问)
//
// 展开约定(与 Unity 内置 Cylinder 的 UV 方向一致, 便于直接套 GasFlow_HDRP):
//   u = 环向: 绕管一周 0 → 1, 0 落在接缝处(默认朝 -X, 即背对正面 +X 相机)
//          —— 每个环独立归一化, 弯管内侧压缩不会把网格拉斜
//   v = 轴向: 沿管道路径 0 → 1, 0 = 上游(默认取 Y 最高的端面), 1 = 下游
//          —— 流动材质的 _Direction(0,-1) 配合 v 递增方向, 烟雾就朝下游跑
//
// 做法: 焊接顶点 → 按连通壳分组 → 从端面外轮廓做 BFS 分层(每层 = 一圈截面环)
//   → 环内按角度排序并用平行移动保持接缝在同一侧 → u 取环向周长比例, v 取环心里程
//   → 逐三角面修接缝(跨接缝的顶点 u+1), 因此接缝处纹理连续、不会撕裂
// 非管状壳(法兰、螺栓、手轮、垫片等)退回按包围盒主轴做柱面/平面投影, 保证每个部件
// 都有可用的流动 UV。

const TAU = Math.PI * 2;
const EPS = 1e-9;

// ---------- 基础向量 ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
function norm(a) { const l = len(a); return l < EPS ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l]; }

// 对称 3x3 的 Jacobi 特征分解, 特征值升序
function jacobi3(m) {
  const a = [m[0].slice(), m[1].slice(), m[2].slice()];
  let v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 64; sweep++) {
    let p = 0, q = 1, max = Math.abs(a[0][1]);
    if (Math.abs(a[0][2]) > max) { max = Math.abs(a[0][2]); p = 0; q = 2; }
    if (Math.abs(a[1][2]) > max) { max = Math.abs(a[1][2]); p = 1; q = 2; }
    if (max < 1e-12) break;
    const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
    const c = Math.cos(th), s = Math.sin(th);
    const R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    R[p][p] = c; R[q][q] = c; R[p][q] = s; R[q][p] = -s;
    const Rt = [0, 1, 2].map(i => [0, 1, 2].map(k => R[k][i]));
    const mul3 = (A, B) => [0, 1, 2].map(i => [0, 1, 2].map(k => A[i][0] * B[0][k] + A[i][1] * B[1][k] + A[i][2] * B[2][k]));
    a.splice(0, 3, ...mul3(mul3(Rt, a), R));
    v = mul3(v, R);
  }
  const vals = [a[0][0], a[1][1], a[2][2]];
  const vecs = [0, 1, 2].map(i => [v[0][i], v[1][i], v[2][i]]);
  const order = [0, 1, 2].sort((x, y) => vals[x] - vals[y]);
  return { values: order.map(i => vals[i]), vectors: order.map(i => vecs[i]) };
}

// 把 v 绕(from→to)的最小旋转转过去(Rodrigues)
function rotateAlign(v, from, to) {
  const axis = cross(from, to);
  const s = len(axis);
  const c = Math.max(-1, Math.min(1, dot(from, to)));
  if (s < 1e-9) return c > 0 ? v.slice() : mul(v, -1);
  const k = norm(axis);
  const ang = Math.atan2(s, c);
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return add(add(mul(v, ca), mul(cross(k, v), sa)), mul(k, dot(k, v) * (1 - ca)));
}

// ---------- 顶点焊接 / 拓扑 ----------
function weldPositions(pos, count) {
  const map = new Map();
  const rep = new Int32Array(count);
  const points = [];
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
    let id = map.get(key);
    if (id === undefined) {
      id = points.length;
      map.set(key, id);
      points.push([x, y, z]);
    }
    rep[i] = id;
  }
  return { rep, points };
}

function buildTopology(rep, count) {
  const triCount = Math.floor(count / 3);
  const tris = new Array(triCount);
  for (let t = 0; t < triCount; t++) {
    tris[t] = [rep[t * 3], rep[t * 3 + 1], rep[t * 3 + 2]];
  }
  const edgeKey = (a, b) => (a < b ? a * 4294967296 + b : b * 4294967296 + a);
  const edgeCount = new Map();
  for (const [a, b, c] of tris) {
    for (const [x, y] of [[a, b], [b, c], [c, a]]) {
      if (x === y) continue;                     // 退化边(极扁三角形)不计
      const k = edgeKey(x, y);
      edgeCount.set(k, (edgeCount.get(k) || 0) + 1);
    }
  }
  return { tris, edgeCount, edgeKey };
}

// 连通壳(按三角形共享边连通)
function splitShells(tris, nv) {
  const parent = new Int32Array(nv);
  for (let i = 0; i < nv; i++) parent[i] = i;
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
  for (const [a, b, c] of tris) { union(a, b); union(b, c); }
  const groups = new Map();
  for (let i = 0; i < nv; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  }
  const shellOf = new Int32Array(nv);
  let k = 0;
  for (const verts of groups.values()) { for (const v of verts) shellOf[v] = k; k++; }
  return { shells: [...groups.values()], shellOf, count: groups.size };
}

// ---------- 管状识别: 分层环 ----------
function extractRings(verts, tris, edgeCount, edgeKey, points, upstream) {
  const inShell = new Set(verts);
  const nbrs = new Map();
  for (const v of verts) nbrs.set(v, []);
  const boundaryAdj = new Map();
  for (const [k, c] of edgeCount) {
    const a = Math.floor(k / 4294967296);
    const b = k - a * 4294967296;
    if (!inShell.has(a) || !inShell.has(b)) continue;
    if (c > 2) return null;                      // 非流形, 不按管展开
    nbrs.get(a).push(b);
    nbrs.get(b).push(a);
    if (c === 1) {
      if (!boundaryAdj.has(a)) boundaryAdj.set(a, []);
      if (!boundaryAdj.has(b)) boundaryAdj.set(b, []);
      boundaryAdj.get(a).push(b);
      boundaryAdj.get(b).push(a);
    }
  }

  // 端面轮廓环
  const loops = [];
  const seen = new Set();
  for (const start of boundaryAdj.keys()) {
    if (seen.has(start)) continue;
    const stack = [start];
    seen.add(start);
    const loop = [];
    while (stack.length) {
      const v = stack.pop();
      loop.push(v);
      for (const w of boundaryAdj.get(v) || []) if (!seen.has(w)) { seen.add(w); stack.push(w); }
    }
    loops.push(loop);
  }
  if (!loops.length) return null;
  loops.sort((a, b) => b.length - a.length);

  // 起点: 上游端(默认 Y 最高的端面), 这样 v=0 在上游
  const height = loop => loop.reduce((s, v) => s + points[v][1], 0) / loop.length;
  let startLoop = loops[0];
  if (upstream === 'maxY') startLoop = loops.reduce((best, l) => (height(l) > height(best) ? l : best), loops[0]);
  if (upstream === 'minY') startLoop = loops.reduce((best, l) => (height(l) < height(best) ? l : best), loops[0]);

  // BFS 分层
  const level = new Map();
  const queue = [];
  for (const v of startLoop) { level.set(v, 0); queue.push(v); }
  for (let h = 0; h < queue.length; h++) {
    const v = queue[h];
    const d = level.get(v);
    for (const w of nbrs.get(v)) {
      if (level.has(w)) continue;
      level.set(w, d + 1);
      queue.push(w);
    }
  }
  if (level.size !== verts.length) return null;   // 有不可达顶点

  const byLevel = new Map();
  for (const [v, d] of level) {
    if (!byLevel.has(d)) byLevel.set(d, []);
    byLevel.get(d).push(v);
  }
  const levels = [...byLevel.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
  if (levels.length < 3) return null;

  // 必须是规整管网格: 每层顶点数一致, 且层内成闭合环、层间连通
  const ringN = levels[0].length;
  if (ringN < 3) return null;
  for (let l = 0; l < levels.length; l++) {
    const lv = levels[l];
    if (lv.length !== ringN) return null;
    const set = new Set(lv);
    const prevSet = l > 0 ? new Set(levels[l - 1]) : null;
    for (const v of lv) {
      let same = 0, prev = 0;
      for (const w of nbrs.get(v)) {
        if (set.has(w)) same++;
        if (prevSet && prevSet.has(w)) prev++;
      }
      if (same !== 2) return null;               // 层内不成闭合环
      if (prevSet && !prev) return null;         // 与前一层无连接
    }
  }
  return levels;
}

// ---------- 单个壳的展开 ----------
function ringFrame(points, ring, prevNormal, prevRef, seamDir) {
  const n = ring.length;
  const c = [0, 0, 0];
  for (const v of ring) { c[0] += points[v][0] / n; c[1] += points[v][1] / n; c[2] += points[v][2] / n; }
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const v of ring) {
    const d = sub(points[v], c);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] += d[i] * d[j] / n;
  }
  const { vectors } = jacobi3(cov);
  let normal = norm(vectors[0]);                 // 最小主成分 = 环平面法线
  if (prevNormal) {
    if (dot(normal, prevNormal) < 0) normal = mul(normal, -1);
  }
  let ref;
  if (prevRef && prevNormal) {
    ref = norm(sub(rotateAlign(prevRef, prevNormal, normal), mul(normal, dot(rotateAlign(prevRef, prevNormal, normal), normal))));
  } else {
    const s = sub(seamDir, mul(normal, dot(seamDir, normal)));
    ref = len(s) > 1e-6 ? norm(s) : norm(cross(normal, Math.abs(normal[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
  }
  const binormal = cross(normal, ref);
  return { center: c, normal, ref, binormal };
}

function unwrapShellRing(verts, tris, edgeCount, edgeKey, points, options) {
  const seamDir = norm(options.seamDirection || [-1, 0, 0]);
  const levels = extractRings(verts, tris, edgeCount, edgeKey, points, options.upstream || 'maxY');
  const uvShell = new Map();                     // welded 顶点 → [u, v]
  if (!levels) return null;

  const frames = [];
  let prev = null;
  for (const ring of levels) {
    const f = ringFrame(points, ring, prev ? prev.normal : null, prev ? prev.ref : null, seamDir);
    frames.push(f);
    prev = f;
  }
  // 第一环法线指向下一环, 保证绕向一致
  const dir0 = norm(sub(frames[1].center, frames[0].center));
  if (dot(frames[0].normal, dir0) < 0) {
    frames[0].normal = mul(frames[0].normal, -1);
    frames[0].binormal = cross(frames[0].normal, frames[0].ref);
  }

  // 里程 v
  const cum = [0];
  for (let l = 1; l < frames.length; l++) cum.push(cum[l - 1] + len(sub(frames[l].center, frames[l - 1].center)));
  const total = cum[cum.length - 1];
  if (total < EPS) return null;

  // 环内排序 + 环向周长比例 u
  for (let l = 0; l < levels.length; l++) {
    const ring = levels[l];
    const f = frames[l];
    const angled = ring.map(v => {
      const d = sub(points[v], f.center);
      const ang = Math.atan2(dot(d, f.binormal), dot(d, f.ref));
      return { v, ang: ang < 0 ? ang + TAU : ang, d };
    }).sort((a, b) => a.ang - b.ang);

    const per = [0];
    for (let i = 1; i <= angled.length; i++) {
      const a = angled[i - 1].d;
      const b = angled[i % angled.length].d;
      per.push(per[i - 1] + len(sub(b, a)));
    }
    const totalPer = per[per.length - 1];
    const vNorm = cum[l] / total;
    for (let i = 0; i < angled.length; i++) {
      const u = totalPer < EPS ? i / angled.length : per[i] / totalPer;
      uvShell.set(angled[i].v, [u >= 1 ? u - 1 : u, vNorm]);
    }
  }

  const ringVerts = new Set();
  for (const ring of levels) for (const v of ring) ringVerts.add(v);
  return { uv: uvShell, scheme: 'tube', rings: levels.length, ringSize: levels[0].length, verts: ringVerts, length: total };
}

// 非管状壳: 按包围盒主轴做柱面 / 平面投影
function unwrapShellProjection(verts, points, options) {
  const seamDir = norm(options.seamDirection || [-1, 0, 0]);
  const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const v of verts) for (let k = 0; k < 3; k++) {
    const x = points[v][k];
    if (x < box[k]) box[k] = x;
    if (x > box[k + 3]) box[k + 3] = x;
  }
  const size = [box[3] - box[0], box[4] - box[1], box[5] - box[2]];
  const order = [0, 1, 2].sort((a, b) => size[b] - size[a]);
  const axis = order[0];
  const flat = size[order[2]] < size[order[0]] * 0.3;
  const uvShell = new Map();

  if (flat) {
    // 扁平件(垫片、铭牌、手轮辐条): 取两个大轴做平面投影
    const e1 = order[1], e2 = order[0];
    for (const v of verts) {
      const u = (points[v][e1] - box[e1]) / Math.max(size[e1], EPS);
      const w = (points[v][e2] - box[e2]) / Math.max(size[e2], EPS);
      uvShell.set(v, [u, w]);
    }
    return { uv: uvShell, scheme: 'planar', verts: new Set(verts) };
  }

  // 柱面: 环绕最长轴, v 沿该轴归一化
  const dir = [0, 0, 0];
  dir[axis] = 1;
  const c = [0, 0, 0];
  for (const v of verts) for (let k = 0; k < 3; k++) c[k] += points[v][k] / verts.length;
  const helper = Math.abs(dir[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = norm(cross(dir, helper));
  const s = sub(seamDir, mul(dir, dot(seamDir, dir)));
  const ref = len(s) > 1e-6 ? norm(s) : e1;

  const along = verts.map(v => dot(sub(points[v], c), dir));
  const tMin = Math.min(...along);
  const tSpan = Math.max(Math.max(...along) - tMin, EPS);
  for (let i = 0; i < verts.length; i++) {
    const v = verts[i];
    const d = sub(points[v], c);
    const a = Math.atan2(dot(d, ref), dot(d, e1));
    let u = a / TAU;
    if (u < 0) u += 1;
    uvShell.set(v, [u, (along[i] - tMin) / tSpan]);
  }
  return { uv: uvShell, scheme: 'cylindrical', verts: new Set(verts) };
}

// ---------- 主入口 ----------
/**
 * 给一个三角网格贴图坐标几何体做管道流动展开。
 * @param {object} geometry 具备 attributes.position (可选 index) 的几何体
 * @param {object} options
 *   seamDirection: [x,y,z] 接缝朝外方向, 默认 [-1,0,0]
 *   upstream: 'maxY' | 'minY' | null   v=0 的端面(默认 Y 最高)
 *   reverse: 反转 v(流向相反时用)
 * @returns {{uv: Float32Array, summary: object}}
 */
export function unwrapPipeFlowUV(geometry, options = {}) {
  const attr = geometry.attributes && geometry.attributes.position;
  if (!attr) throw new Error('几何体缺少 position 属性');
  const count = attr.count;

  // 索引几何体先展开成独立顶点, 否则接缝处无法给同一顶点两个 u
  let positions;
  let index = null;
  if (geometry.index) {
    const src = attr.array;
    index = geometry.index.array;
    positions = new Float32Array(index.length * 3);
    for (let i = 0; i < index.length; i++) {
      const s = index[i] * 3;
      positions[i * 3] = src[s];
      positions[i * 3 + 1] = src[s + 1];
      positions[i * 3 + 2] = src[s + 2];
    }
  } else {
    positions = new Float32Array(attr.array.subarray ? attr.array.subarray(0, count * 3) : attr.array.slice(0, count * 3));
  }

  const outCount = index ? index.length : count;
  const { rep, points } = weldPositions(positions, outCount);
  const nv = points.length;
  const { tris, edgeCount, edgeKey } = buildTopology(rep, outCount);
  const { shells, shellOf } = splitShells(tris, nv);

  const perVertexUV = new Map();
  const shellReports = [];
  for (const verts of shells) {
    const shellTri = tris.filter(t => shellOf[t[0]] === shellOf[verts[0]]);
    let shell;
    try {
      shell = unwrapShellRing(verts, shellTri, edgeCount, edgeKey, points, options);
    } catch (e) {
      shell = null;
    }
    if (!shell) shell = unwrapShellProjection(verts, points, options);
    for (const [v, uv] of shell.uv) perVertexUV.set(v, uv);
    shellReports.push({ scheme: shell.scheme, verts: verts.length, rings: shell.rings || null, ringSize: shell.ringSize || null, length: shell.length || null });
  }

  // 逐三角面修接缝 + 写回(按展开后的顶点序)
  const uv = new Float32Array(outCount * 2);
  const seamFixups = { triangles: 0 };
  for (let t = 0; t < outCount / 3; t++) {
    const uvs = [];
    for (let c = 0; c < 3; c++) {
      const uv0 = perVertexUV.get(rep[t * 3 + c]) || [0, 0];
      uvs.push([uv0[0], uv0[1]]);
    }
    let min = Math.min(uvs[0][0], uvs[1][0], uvs[2][0]);
    let max = Math.max(uvs[0][0], uvs[1][0], uvs[2][0]);
    if (max - min > 0.5) {
      seamFixups.triangles++;
      for (const p of uvs) if (p[0] < 0.5) p[0] += 1;
    }
    for (let c = 0; c < 3; c++) {
      const i = (t * 3 + c) * 2;
      uv[i] = uvs[c][0];
      uv[i + 1] = uvs[c][1];
    }
  }

  void min; void max;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (let i = 0; i < outCount; i++) {
    minU = Math.min(minU, uv[i * 2]); maxU = Math.max(maxU, uv[i * 2]);
    minV = Math.min(minV, uv[i * 2 + 1]); maxV = Math.max(maxV, uv[i * 2 + 1]);
  }
  if (options.reverse) {
    for (let i = 0; i < outCount; i++) uv[i * 2 + 1] = 1 - uv[i * 2 + 1];
    const a = minV; minV = 1 - maxV; maxV = 1 - a;
  }

  const tubeShells = shellReports.filter(s => s.scheme === 'tube').length;
  return {
    uv,
    index,
    summary: {
      vertices: outCount,
      welded: nv,
      shells: shells.length,
      tubeShells,
      schemes: shellReports.reduce((acc, s) => { acc[s.scheme] = (acc[s.scheme] || 0) + 1; return acc; }, {}),
      seamTriangles: seamFixups.triangles,
      uvBounds: { u: [minU, maxU], v: [minV, maxV] },
      shellsDetail: shellReports,
    },
  };
}

/** 直接写进几何体(必要时把索引几何体拆成独立顶点)。返回统计。 */
export function applyPipeFlowUV(geometry, options = {}) {
  const result = unwrapPipeFlowUV(geometry, options);
  if (result.index) {
    const src = geometry.attributes.position.array;
    const n = result.index.length;
    for (const name of Object.keys(geometry.attributes)) {
      const a = geometry.attributes[name];
      const arr = new a.array.constructor(n * a.itemSize);
      for (let i = 0; i < n; i++) {
        const s = result.index[i] * a.itemSize;
        for (let k = 0; k < a.itemSize; k++) arr[i * a.itemSize + k] = a.array[s + k];
      }
      geometry.setAttribute(name, new (a.constructor)(arr, a.itemSize));
    }
    geometry.setIndex(null);
    void src;
  }
  const uvAttr = geometry.attributes.uv;
  if (uvAttr && uvAttr.count === geometry.attributes.position.count) {
    uvAttr.array.set(result.uv);
    uvAttr.needsUpdate = true;
  } else if (geometry.setAttribute) {
    const Ctor = geometry.attributes.position ? geometry.attributes.position.constructor : Float32Array;
    geometry.setAttribute('uv', new Ctor(result.uv, 2));
  }
  if (geometry.computeBoundingBox) void 0;
  return result.summary;
}

/** UV 质检: 内部边的接缝连续性与面积畸变。 */
export function auditPipeFlowUV(geometry, tolerance = 1e-4) {
  const pos = geometry.attributes.position.array;
  const uv = geometry.attributes.uv.array;
  const count = geometry.attributes.position.count;
  const key = i => `${Math.round(pos[i * 3] * 1e4)},${Math.round(pos[i * 3 + 1] * 1e4)},${Math.round(pos[i * 3 + 2] * 1e4)}`;
  const corners = new Map();
  for (let i = 0; i < count; i++) {
    const k = key(i);
    if (!corners.has(k)) corners.set(k, []);
    corners.get(k).push(i);
  }
  let spanning = 0, split = 0, maxGap = 0, area3d = 0, areaUv = 0;
  const stretches = [];
  for (let t = 0; t < count / 3; t++) {
    const i0 = t * 3, i1 = t * 3 + 1, i2 = t * 3 + 2;
    const p = [0, 1, 2].map(c => [pos[(t * 3 + c) * 3], pos[(t * 3 + c) * 3 + 1], pos[(t * 3 + c) * 3 + 2]]);
    const q = [0, 1, 2].map(c => [uv[(t * 3 + c) * 2], uv[(t * 3 + c) * 2 + 1]]);
    const a3 = 0.5 * len(cross(sub(p[1], p[0]), sub(p[2], p[0])));
    const a2 = 0.5 * Math.abs((q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]));
    area3d += a3; areaUv += a2;
    if (a3 > 1e-9) stretches.push(Math.sqrt(a2 / a3));
    void [i0, i1, i2];
  }
  // 接缝连续性: 同一位置上的多个顶点, u 相差 0 或 1 才算合格
  for (const list of corners.values()) {
    if (list.length < 2) continue;
    let lo = Infinity, hi = -Infinity;
    for (const i of list) { lo = Math.min(lo, uv[i * 2]); hi = Math.max(hi, uv[i * 2 + 1] === undefined ? uv[i * 2] : uv[i * 2]); }
    const us = list.map(i => uv[i * 2]);
    const min = Math.min(...us), max = Math.max(...us);
    const gap = max - min;
    if (gap > tolerance) {
      spanning++;
      if (Math.abs(gap - 1) > 0.02) split++;
      maxGap = Math.max(maxGap, gap);
    }
    void lo; void hi;
  }
  stretches.sort((a, b) => a - b);
  return {
    uvArea: areaUv,
    modelArea: area3d,
    sharedSeamPositions: spanning,
    brokenSeams: split,
    maxSeamGap: maxGap,
    stretch: {
      min: stretches.length ? stretches[0] : null,
      median: stretches.length ? stretches[Math.floor(stretches.length * 0.5)] : null,
      p95: stretches.length ? stretches[Math.floor(stretches.length * 0.95)] : null,
      max: stretches.length ? stretches[stretches.length - 1] : null,
    },
  };
}
