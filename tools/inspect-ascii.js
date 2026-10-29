// ASCII silhouette views: lets us inspect the drain assembly layout without a GPU.
const fs = require('node:fs');

const modelPath = process.argv[2] || 'assets/imported-models/1ed40391-74c6-4ff2-9f91-fa6608bd8de4/model.json';
const j = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
const geos = new Map(j.scene.geometries.map(g => [g.uuid, g]));

const parts = [];
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
j.scene.object.children.forEach((o, i) => {
  const g = geos.get(o.geometry);
  const P = g.data.attributes.position.array;
  parts.push({ name: o.name, letter: letters[i % 26], P });
});

const box = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
for (const p of parts) for (let i = 0; i < p.P.length; i += 3) for (let k = 0; k < 3; k++) {
  const v = p.P[i + k]; if (v < box[k]) box[k] = v; if (v > box[k + 3]) box[k + 3] = v;
}
console.log('bounds', box.map(v => +v.toFixed(2)).join(' '));

function view(ax, ay, flipY, w, h, title) {
  const gw = w, gh = h;
  const grid = Array.from({ length: gh }, () => new Array(gw).fill(' '));
  const zgrid = Array.from({ length: gh }, () => new Array(gw).fill(-1e9));
  const ex = box[ax + 3] - box[ax], ey = box[ay + 3] - box[ay];
  const s = Math.min((gw - 1) / (ex || 1), (gh - 1) / (ey || 1));
  const ox = -box[ax], oy = -box[ay];
  for (const p of parts) {
    const P = p.P;
    for (let i = 0; i < P.length; i += 9) {
      for (let t = 0; t < 3; t++) {
        const x = P[i + t * 3 + ax], y = P[i + t * 3 + ay];
        const cx = Math.round((x + ox) * s);
        const cy = Math.round((y + oy) * s);
        const gy = flipY ? (gh - 1 - cy) : cy;
        if (cx < 0 || cx >= gw || gy < 0 || gy >= gh) continue;
        if (zgrid[gy][cx] <= 0) { zgrid[gy][cx] = 0; grid[gy][cx] = p.letter; }
      }
    }
  }
  console.log(`\n== ${title} (x=${'xyz'[ax]} right, y=${'xyz'[ay]} ${flipY ? 'up' : 'down'}) ==`);
  console.log('   ' + '-'.repeat(gw) + `  span ${ex.toFixed(1)} x ${ey.toFixed(1)} cm`);
  grid.forEach((row, i) => console.log(String(i).padStart(2) + '|' + row.join('')));
}

const W = 62, H = 40;
view(0, 1, true, W, H, 'front XY');
view(2, 1, true, W, H, 'side ZY');
view(0, 2, false, W, H, 'top XZ');
console.log('\nlegend:');
parts.forEach(p => console.log('  ' + p.letter + ' = ' + p.name));
