const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

async function fixture() {
  const THREE = await import(pathToFileURL(path.resolve(__dirname, '../vendor/three.module.js')).href);
  // Canvas print calls do not affect the geometry checked here.
  const context = new Proxy({}, { get: (target, key) => target[key] || (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
  const document = { createElement: () => ({ width: 1, height: 1, getContext: () => context }) };
  const kit = await fs.readFile(path.resolve(__dirname, '../model-kit.js'), 'utf8');
  const sprayer = await fs.readFile(path.resolve(__dirname, '../leak-detector-sprayer.js'), 'utf8');
  const build = vm.runInNewContext(kit + '\n' + sprayer + '\nbuildLeakDetectorSprayer;', { document });
  const root = build(THREE); root.updateMatrixWorld(true);
  return { THREE, root };
}

test('sprayer trigger clears the actual bottle shoulder and closure, shroud clears cap', async () => {
  const { THREE, root } = await fixture();
  const bottle = root.getObjectByName('hollow_translucent_bottle');
  const profile = bottle.geometry.parameters.points;
  const radiusAt = y => {
    let radius = 0;
    for (let i = 1; i < profile.length; i++) {
      const a = profile[i - 1], b = profile[i];
      if (Math.abs(a.y - b.y) > 1e-8 && y >= Math.min(a.y, b.y) && y <= Math.max(a.y, b.y)) {
        radius = Math.max(radius, a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y));
      }
    }
    return radius;
  };
  const cap = root.getObjectByName('threaded_closure_cap');
  const capBox = new THREE.Box3().setFromObject(cap, true);
  const rimBox = new THREE.Box3().setFromObject(root.getObjectByName('closure_upper_rim'), true);
  const shroudBox = new THREE.Box3().setFromObject(root.getObjectByName('pump_main_housing'), true);
  assert(shroudBox.min.y - rimBox.max.y > .05, 'shroud must not slice into the cap rim');
  const blade = root.getObjectByName('continuous_curved_trigger_blade');
  const pos = blade.geometry.attributes.position;
  let clearance = Infinity;
  const check = point => {
    const radius = Math.hypot(point.x, point.z);
    if (point.y <= 14.02) {
      const gap = radius - radiusAt(point.y);
      clearance = Math.min(clearance, gap);
      assert(gap > .20, 'trigger penetrates or nearly touches bottle/neck');
    }
    if (point.y >= capBox.min.y && point.y <= rimBox.max.y) {
      assert(radius > 2.30, 'trigger penetrates the closure or its rim');
    }
  };
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i).applyMatrix4(blade.matrixWorld);
    b.fromBufferAttribute(pos, i + 1).applyMatrix4(blade.matrixWorld);
    c.fromBufferAttribute(pos, i + 2).applyMatrix4(blade.matrixWorld);
    check(a); check(b); check(c);
    check(a.clone().add(b).multiplyScalar(.5)); check(b.clone().add(c).multiplyScalar(.5));
    check(c.clone().add(a).multiplyScalar(.5)); check(a.clone().add(b).add(c).multiplyScalar(1 / 3));
  }
  assert(Number.isFinite(clearance));
  const hinge = root.getObjectByName('trigger_pivot_pin').getWorldPosition(new THREE.Vector3());
  assert(blade.getWorldPosition(new THREE.Vector3()).distanceTo(hinge) < 1e-8);
});

test('spray outlet has a recessed open bore and filter rings share the filter axis', async () => {
  const { THREE, root } = await fixture();
  assert(!root.getObjectByName('spray_outlet_pin'), 'no metal pin should project through the spray opening');
  const nozzle = root.getObjectByName('adjustable_nozzle');
  const ring = root.getObjectByName('spray_orifice_ring');
  const bore = root.getObjectByName('spray_orifice');
  const y = nozzle.position.y;
  const ray = new THREE.Raycaster(new THREE.Vector3(7, y, 0), new THREE.Vector3(-1, 0, 0));
  const hits = ray.intersectObjects([nozzle, ring, bore], false);
  assert(hits.length > 0);
  assert.equal(hits[0].object.name, 'spray_orifice', 'front annulus must leave the central hole unobstructed');
  const front = new THREE.Box3().setFromObject(nozzle, true).max.x;
  assert(front - hits[0].point.x > .30, 'spray opening must be visibly recessed');
  const feed = new THREE.Box3().setFromObject(root.getObjectByName('nozzle_feed_channel'), true);
  assert(feed.max.x < hits[0].point.x, 'feed tube must stop inside the nozzle');
  const filter = root.getObjectByName('dip_tube_filter');
  const filterBox = new THREE.Box3().setFromObject(filter, true);
  assert(filterBox.min.y > .65, 'filter must clear the inner floor of the bottle');
  for (let i = 0; i < 6; i++) {
    const slot = root.getObjectByName('filter_slot_' + i);
    assert.equal(slot.parent, filter.parent);
    assert.equal(slot.parent.rotation.z, filter.parent.rotation.z);
  }
});
