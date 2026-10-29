// Probe: per-shell topology of the drain-pipe model, to decide the unwrap strategy.
const fs = require('node:fs');

const modelPath = process.argv[2] || 'assets/imported-models/1ed40391-74c6-4ff2-9f91-fa6608bd8de4/model.json';
const j = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
const geos = new Map(j.scene.geometries.map(g => [g.uuid, g]));

function weld(P) {
  const n = P.length / 3;
  const map = new Map();
  const rep = new Int32Array(n);
  const pos = [];
  for (let i = 0; i < n; i++) {
    const k = `${Math.round(P[i * 3] * 1e4)},${Math.round(P[i * 3 + 1] * 1e4)},${Math.round(P[i * 3 + 2] * 1e4)}`;
    let id = map.get(k);
    if (id === undefined) { id = pos.length; map.set(k, id); pos.push([P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]); }
    rep[i] = id;
  }
  return { rep, pos };
}

function shells(rep, tris) {
  const par = pos => pos;
  const m = rep.length ? Math.max(...rep) + 1 : 0;
  const p = Array.from({ length: m }, (_, i) => i);
  const find = i => { while (p[i] !== i) { p[i] = p[p[i]]; i = p[i]; } return i; };
  const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) p[a] = b; };
  for (const [a, b, c] of tris) { uni(a, b); uni(b, c); }
  const out = new Map();
  for (let i = 0; i < m; i++) { const r = find(i); if (!out.has(r)) out.set(r, []); out.get(r).push(i); }
  return [...out.values()];
}

for (const o of j.scene.object.children) {
  const g = geos.get(o.geometry);
  const P = g.data.attributes.position.array;
  const idx = g.data.index ? g.data.index.array : null;
  const n = P.length / 3;
  const { rep, pos } = weld(P);
  const nv = pos.length;
  const tris = [];
  const triCount = idx ? idx.length / 3 : n / 3;
  for (let t = 0; t < triCount; t++) {
    tris.push(idx ? [rep[idx[t * 3]], rep[idx[t * 3 + 1]], rep[idx[t * 3 + 2]]]
      : [rep[t * 3], rep[t * 3 + 1], rep[t * 3 + 2]]);
  }
  const edge = new Map();
  for (const [a, b, c] of tris) for (const [x, y] of [[a, b], [b, c], [c, a]]) {
    const k = Math.min(x, y) + '_' + Math.max(x, y);
    edge.set(k, (edge.get(k) || 0) + 1);
  }
  const adj = new Map(Array.from({ length: nv }, (_, i) => [i, []]));
  for (const [k, v] of edge) { const [a, b] = k.split('_').map(Number); if (v <= 2) { adj.get(a).push(b); adj.get(b).push(a); } }

  const rows = [];
  for (const verts of shells(rep, tris).sort((a, b) => b.length - a.length)) {
    const vs = new Set(verts);
    const bnd = [];
    for (const [k, v] of edge) {
      if (v !== 1) continue;
      const [a, b] = k.split('_').map(Number);
      if (vs.has(a)) bnd.push([a, b]);
    }
    // boundary loops
    const bAdj = new Map();
    for (const [a, b] of bnd) {
      if (!bAdj.has(a)) bAdj.set(a, []);
      if (!bAdj.has(b)) bAdj.set(b, []);
      bAdj.get(a).push(b); bAdj.get(b).push(a);
    }
    const seen = new Set();
    const loops = [];
    for (const v of bAdj.keys()) {
      if (seen.has(v)) continue;
      const stack = [v]; seen.add(v); let c = 0;
      while (stack.length) { const x = stack.pop(); c++; for (const y of bAdj.get(x) || []) if (!seen.has(y)) { seen.add(y); stack.push(y); } }
      loops.push(c);
    }
    loops.sort((a, b) => b - a);
    const box = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    for (const i of verts) for (let k = 0; k < 3; k++) { const v = pos[i][k]; if (v < box[k]) box[k] = v; if (v > box[k + 3]) box[k + 3] = v; }
    const size = [box[3] - box[0], box[4] - box[1], box[5] - box[2]].map(v => +v.toFixed(2));

    // BFS ring test from the largest boundary loop
    let ringInfo = '';
    const big = loops[0] || 0;
    if (big > 1 && bAdj.size) {
      const startV = [...bAdj.keys()].slice(0, big);
      const dist = new Map();
      const q = [];
      for (const s of startV) { dist.set(s, 0); q.push(s); }
      for (let h = 0; h < q.length; h++) {
        const x = q[h];
        for (const y of adj.get(x) || []) {
          if (!vs.has(y) || dist.has(y)) continue;
          dist.set(y, dist.get(x) + 1); q.push(y);
        }
      }
      const levels = new Map();
      for (const [v, d] of dist) { if (!levels.has(d)) levels.set(d, 0); levels.set(d, levels.get(d) + 1); }
      const counts = [...levels.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c);
      const reached = dist.size;
      const uniform = counts.length && counts.every(c => c === counts[0]);
      ringInfo = `bfsRings=${counts.length} counts=[${counts.slice(0, 14).join(',')}${counts.length > 14 ? '…' : ''}] uniform=${uniform} reached=${reached}/${verts.length}`;
    }
    rows.push({ verts: verts.length, loops: loops.slice(0, 4), size, ringInfo });
  }
  console.log(`\n### ${o.name}  shells=${rows.length}`);
  for (const r of rows) console.log(`   v=${String(r.verts).padStart(4)} loops=[${r.loops.join(',')}] size=${r.size.join('x')} ${r.ringInfo}`);
}
