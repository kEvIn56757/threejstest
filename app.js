const THREE = await import('./vendor/three.module.js');

main();

function main() {
  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.touchAction = 'none';
  document.body.appendChild(renderer.domElement);

  // ---------- scene ----------
  const scene = new THREE.Scene();

  // backdrop gradient sphere
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 16; bgCanvas.height = 512;
  {
    const g = bgCanvas.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#f6f8fa');
    grad.addColorStop(0.55, '#e8ecf0');
    grad.addColorStop(1, '#cfd6dd');
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 512);
  }
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(90, 32, 16),
    new THREE.MeshBasicMaterial({ map: bgTex, side: THREE.BackSide, depthWrite: false })
  );
  scene.add(backdrop);
  backdrop.userData.noExport = true; // 不导出背景球

  // ---------- camera + orbit ----------
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 500);
  const target = new THREE.Vector3(0, 0, 0);
  const sph = new THREE.Spherical(23, 1.42, 2.272); // initial: front-left three-quarter, logo side
  applyCamera();

  let spin = true;
  window.__debug = {
    setView(theta, phi, r) { sph.theta = theta; sph.phi = phi; sph.radius = r; applyCamera(); },
    setSpin(on) { spin = on; },
    setRot(y) { pivot.rotation.y = y; },
    model: () => currentModel,
    logo() { makeLogoTexture(); return makeLogoTexture.lastCanvas.toDataURL('image/png'); },
    list() {
      const out = [];
      pivot.traverse(o => {
        if (o.isMesh && (o.name === 'logoA' || o.name === 'logoB')) {
          out.push({
            name: o.name, visible: o.visible,
            pos: o.position.toArray().map(v => +v.toFixed(2)),
            matType: o.material.type, transparent: o.material.transparent,
            hasMap: !!o.material.map
          });
        }
      });
      return out;
    }
  };

  function applyCamera() {
    camera.position.setFromSpherical(sph).add(target);
    camera.lookAt(target);
  }

  let dragging = false, lastX = 0, lastY = 0;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    sph.theta -= dx * 0.006;
    sph.phi = THREE.MathUtils.clamp(sph.phi - dy * 0.006, 0.55, 1.85);
    applyCamera();
  });
  el.addEventListener('pointerup', e => { dragging = false; try { el.releasePointerCapture(e.pointerId); } catch (_) {} });
  el.addEventListener('pointercancel', () => { dragging = false; });
  el.addEventListener('wheel', e => {
    e.preventDefault();
    sph.radius = THREE.MathUtils.clamp(sph.radius * Math.exp(e.deltaY * 0.0012), 11, 300);
    applyCamera();
  }, { passive: false });

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcdd3da, 1.0));

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(9, 13, -7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -13; key.shadow.camera.right = 13;
  key.shadow.camera.top = 13; key.shadow.camera.bottom = -13;
  key.shadow.camera.near = 1; key.shadow.camera.far = 50;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.7);
  fill.position.set(-8, 5, 9);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(-10, 8, -6);
  scene.add(rim);

  // ---------- ground ----------
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(50, 48),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -4.16;
  ground.receiveShadow = true;
  scene.add(ground);
  ground.userData.noExport = true; // 不导出阴影地面

  // ---------- 模型注册表:新增模型时在数组里登记一条即可 ----------
  // { id: '唯一ID', name: '下拉列表显示名', build: 构建函数(返回 THREE.Group) }
  const MODELS = [
    { id: 'hikvision-bullet', name: '海康威视枪机', build: buildCamera },
    { id: 'ronk-ups', name: 'RONK 工业UPS机柜', build: buildRonkUPS },
    // { id: 'xxx', name: 'xxx名称', build: buildXxx },
  ];

  const pivot = new THREE.Group();
  scene.add(pivot);
  let currentModel = null;
  let currentId = MODELS[0].id;

  // 给未命名的网格补名字,导出后在 Blender / Unity 里好认
  function nameModel() {
    let n = 0;
    pivot.traverse(o => {
      if (o.isMesh && !o.name) {
        const mn = (o.material && o.material.name) || 'part';
        o.name = mn + '_' + String(++n).padStart(2, '0');
      }
    });
  }

  function setModel(id) {
    const rec = MODELS.find(m => m.id === id) || MODELS[0];
    currentId = rec.id;
    if (currentModel) {
      pivot.remove(currentModel);
      currentModel.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    }
    currentModel = rec.build(THREE);
    pivot.add(currentModel);
    nameModel();
    // 自动取景:模型垂直居中到原点,按包围球调整轨道半径,让不同大小的模型都合适
    const box = new THREE.Box3().setFromObject(currentModel);
    currentModel.position.y -= (box.min.y + box.max.y) / 2;
    const box2 = new THREE.Box3().setFromObject(currentModel);
    const sphere = box2.getBoundingSphere(new THREE.Sphere());
    sph.radius = THREE.MathUtils.clamp(sphere.radius * 1.9, 11, 300);
    // 阴影相机随模型大小自适应(小模型保持原参数不变)
    const sr = Math.max(13, sphere.radius * 1.15);
    key.shadow.camera.left = -sr; key.shadow.camera.right = sr;
    key.shadow.camera.top = sr; key.shadow.camera.bottom = -sr;
    key.shadow.camera.far = Math.max(50, sr * 4);
    key.position.set(9, 13, -7).normalize().multiplyScalar(Math.max(17.5, sphere.radius * 2.2));
    key.shadow.normalBias = Math.max(0.02, sphere.radius * 0.004);
    key.shadow.camera.updateProjectionMatrix();
    // 阴影地面贴到模型脚下
    ground.position.y = box2.min.y;
    applyCamera();
    // 重置外壳显示
    shellOn = true;
    currentModel.traverse(o => { if (o.isMesh && o.userData.shell) o.visible = true; });
    const b = document.getElementById('btn-shell');
    if (b) b.textContent = '查看内部';
    return rec;
  }

  // ---------- 模型下拉列表 + 内部透视 ----------
  let shellOn = true;
  const sel = document.getElementById('model-select');
  if (sel) {
    for (const m of MODELS) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => setModel(sel.value));
  }
  const shellBtn = document.getElementById('btn-shell');
  if (shellBtn) {
    shellBtn.addEventListener('click', () => {
      shellOn = !shellOn;
      currentModel.traverse(o => { if (o.isMesh && o.userData.shell) o.visible = shellOn; });
      shellBtn.textContent = shellOn ? '查看内部' : '显示外壳';
    });
  }
  setModel(MODELS[0].id);

  // ---------- 导出:打包成一个 zip(模型 + 贴图 + 说明),避免浏览器连续弹多个下载 ----------
  {
    const saveBlob = (data, name, type) => {
      const blob = data instanceof Blob ? data : new Blob([data], { type });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    };

    // 导出说明(随压缩包一起给到,Unity / Blender 导入时照做即可)
    function readmeText(id, modelName, texNames, hasGlb) {
      return [
        `${modelName} — ${id}`,
        '='.repeat(40),
        '',
        '压缩包内容:',
        `  ${id}.fbx          FBX 7.4 二进制模型(单位:米,UnitScaleFactor=100)`,
        ...texNames.map(n => `  ${n}${' '.repeat(Math.max(1, 22 - n.length))}贴图,FBX 按文件名引用,必须与 fbx 同目录`),
        hasGlb ? `  ${id}.glb          同一模型的 glTF 二进制版(贴图已内嵌,单文件)` : null,
        '',
        '—— Unity 导入(FBX,推荐) ——',
        '1. 把整个文件夹拖入 Project 窗口,或先解压到 Assets/ 下的子目录;',
        '2. 贴图 PNG 必须与 fbx 放在同一目录,Unity 会按材质名自动匹配;',
        '3. 选中 fbx → Inspector → Model:',
        '   · Scale Factor 保持 1(模型按米建模);若尺寸偏大/偏小,改 Scale Factor 或按 0.01 缩放;',
        '   · 勾选 Read/Write 仅在需要运行时改网格时才开;',
        '   · Materials → Material Creation Mode 设为 Standard,点 Extract Materials 可离线编辑材质;',
        '4. 若贴图未自动挂上,在材质球里手动指定同名 PNG 即可。',
        '',
        '—— Unity 导入(GLB 备选) ——',
        '1. Package Manager 安装 glTFast 或 UnityGLTF;',
        '2. 直接把 .glb 拖入 Project,贴图已内嵌,无需额外文件。',
        '',
        '—— Blender ——',
        '文件 → 导入 → FBX(.fbx)或 glTF 2.0(.glb);FBX 需贴图 PNG 同目录。',
        '',
        '注:导出的是当前下拉列表中选中的模型;隐藏外壳(「查看内部」)不影响导出,',
        '    外壳几何照常包含在文件中,只是可见性为隐藏。',
      ].filter(v => v !== null).join('\n') + '\n';
    }

    // 导出用:临时清零转台旋转,让顶点落在模型自身坐标系(否则烘焙进的是
    // 点击导出那一刻的转台角度,每次导出朝向都不一样)。导完立刻恢复。
    function withModelSpace(fn) {
      const saved = pivot.rotation.clone();
      pivot.rotation.set(0, 0, 0);
      pivot.updateMatrixWorld(true);
      try { return fn(); }
      finally { pivot.rotation.copy(saved); pivot.updateMatrixWorld(true); }
    }

    async function exportZip(id, modelName) {
      const { bytes, images } = withModelSpace(() => exportFBX(scene));
      const texNames = images.map(im => im.name);
      const files = [
        { name: id + '.fbx', data: bytes },
        ...images.map(im => ({ name: im.name, data: im.bytes })),
        { name: id + '.glb', data: withModelSpace(() => exportGLB(scene)) },
      ];
      const readme = readmeText(id, modelName, texNames, true);
      files.push({ name: '导入说明.txt', data: new TextEncoder().encode(readme) });
      return ZipPack.makeZip(files, { compress: true });
    }

    const btnFbx = document.getElementById('btn-fbx');
    const btnGlb = document.getElementById('btn-glb');

    if (btnFbx) btnFbx.addEventListener('click', async () => {
      const rec = MODELS.find(m => m.id === currentId) || MODELS[0];
      const label = btnFbx.textContent;
      btnFbx.disabled = true;
      btnFbx.textContent = '打包中…';
      try {
        const zip = await exportZip(rec.id, rec.name);
        saveBlob(zip, rec.id + '.zip', 'application/zip');
        btnFbx.textContent = '已导出 ✓';
        setTimeout(() => { btnFbx.textContent = label; btnFbx.disabled = false; }, 1600);
      } catch (e) {
        console.error(e);
        btnFbx.textContent = '导出失败';
        setTimeout(() => { btnFbx.textContent = label; btnFbx.disabled = false; }, 2000);
      }
    });

    if (btnGlb) btnGlb.addEventListener('click', () => {
      const rec = MODELS.find(m => m.id === currentId) || MODELS[0];
      saveBlob(withModelSpace(() => exportGLB(scene)), rec.id + '.glb', 'model/gltf-binary');
    });

    // 供自动化测试直接取回导出数据(不触发下载)
    window.__export = {
      fbx() {
        const { bytes, images } = withModelSpace(() => exportFBX(scene));
        const toB64 = (arr) => {
          let bin = '';
          for (let i = 0; i < arr.length; i += 8192) bin += String.fromCharCode.apply(null, arr.subarray(i, i + 8192));
          return btoa(bin);
        };
        return {
          base64: toB64(bytes),
          images: images.map(im => ({ name: im.name, base64: toB64(im.bytes) }))
        };
      },
      glb() {
        const bytes = withModelSpace(() => exportGLB(scene));
        let bin = '';
        for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
        return btoa(bin);
      },
      async zip() {
        const rec = MODELS.find(m => m.id === currentId) || MODELS[0];
        const bytes = await exportZip(rec.id, rec.name);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
        return { name: rec.id + '.zip', base64: btoa(bin) };
      }
    };
  }

  // ---------- animate ----------
  const timer = new THREE.Timer();
  renderer.setAnimationLoop(() => {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    if (spin && !dragging) pivot.rotation.y += dt * 0.3;
    renderer.render(scene, camera);
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ============================================================
// geometry helpers
// ============================================================

// rounded-rect shape centered at origin (for extrusions)
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

// rounded-rect outline in the (z, y) plane, CCW, as [{z, y}]
function roundedRectOutline(h, c, flatN = 6, arcN = 10) {
  const pts = [];
  const o = h - c;
  const push = (z, y) => pts.push({ z, y });
  const arc = (cz, cy, a0, a1) => {
    for (let i = 1; i <= arcN; i++) {
      const a = a0 + (a1 - a0) * (i / arcN);
      push(cz + c * Math.cos(a), cy + c * Math.sin(a));
    }
  };
  // right side, going up
  for (let i = 0; i < flatN; i++) push(h, -o + 2 * o * (i / (flatN - 1)));
  arc(o, o, 0, Math.PI / 2);                 // top-right
  for (let i = 1; i < flatN; i++) push(o - 2 * o * (i / (flatN - 1)), h); // top, going left
  arc(-o, o, Math.PI / 2, Math.PI);          // top-left
  for (let i = 1; i < flatN; i++) push(-h, o - 2 * o * (i / (flatN - 1))); // left, going down
  arc(-o, -o, Math.PI, Math.PI * 1.5);       // bottom-left
  for (let i = 1; i < flatN; i++) push(-o + 2 * o * (i / (flatN - 1)), -h); // bottom, going right
  arc(o, -o, Math.PI * 1.5, Math.PI * 2);    // bottom-right
  return pts;
}

// loft a surface along +X through scaled copies of an (open or closed) outline
// stations: [{x, s}]; outline: [{z,y}]; closed: wrap around; caps: fan-close ends
function loftGeometry(stations, outline, { closed = true, capStart = false, capEnd = false } = {}) {
  const N = stations.length, M = outline.length;
  const pos = [];
  for (const st of stations) {
    const ang = st.ang || 0, ym = st.ym || 0;
    const yMid = (st.yMid !== undefined) ? st.yMid : ym;
    const M = st.Mref || 0, vt = st.vTaper || 1;
    const c = Math.cos(ang), s = Math.sin(ang);
    for (const p of outline) {
      const sEff = st.sFn ? st.sFn(p) : st.s;
      const ys = (M + (p.y - M) * vt) * sEff;
      const v = ys - ym;
      const xw = st.x + (st.xOf ? st.xOf(p) : 0);
      const yw = yMid + v * c + (st.yOf ? st.yOf(p) : 0);
      const zw = p.z * sEff + (st.zOf ? st.zOf(p) : 0);
      pos.push(xw - v * s, yw, zw);
    }
  }
  const idx = [];
  const segs = closed ? M : M - 1;
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const j1 = closed ? (j + 1) % M : j + 1;
      const a = i * M + j, b = (i + 1) * M + j, c = (i + 1) * M + j1, d = i * M + j1;
      idx.push(a, b, c, a, c, d);
    }
  }
  if (capStart) {
    const centerIdx = pos.length / 3;
    pos.push(stations[0].x, 0, 0);
    for (let j = 0; j < M; j++) {
      const j1 = (j + 1) % M;
      idx.push(centerIdx, j, j1);
    }
  }
  if (capEnd) {
    const base = (N - 1) * M;
    const centerIdx = pos.length / 3;
    pos.push(stations[N - 1].x, 0, 0);
    for (let j = 0; j < M; j++) {
      const j1 = (j + 1) % M;
      idx.push(centerIdx, base + j1, base + j);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// dome scale of the rear cap (elliptical falloff over length L)
function sDome(x, L = 1.6) {
  const t = Math.min(Math.max((L - x) / L, 0), 1);
  return Math.sqrt(Math.max(0, 1 - t * t));
}

// ============================================================
// model
// ============================================================
function buildCamera() {
  const FACE = 16.49;         // front face plane of the dark faceplate
  const group = new THREE.Group();

  const matWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf7f8f9, roughness: 0.34, metalness: 0.0,
    clearcoat: 0.55, clearcoatRoughness: 0.25
  });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x4a4d51, roughness: 0.5, metalness: 0.05 });
  const matDarkDeep = new THREE.MeshStandardMaterial({ color: 0x2b2e32, roughness: 0.55 });
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.35 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x94999e, roughness: 0.32, metalness: 0.65 });
  const matLensInner = new THREE.MeshPhysicalMaterial({
    color: 0x16222e, roughness: 0.1, metalness: 0.4, clearcoat: 1
  });
  const matLed = new THREE.MeshStandardMaterial({
    color: 0xd6d9dc, roughness: 0.3, emissive: 0x9aa0a6, emissiveIntensity: 0.22
  });
  const matLedFrame = new THREE.MeshStandardMaterial({ color: 0x33363a, roughness: 0.5 });
  const matShieldInner = new THREE.MeshStandardMaterial({ color: 0x45484c, roughness: 0.65, side: THREE.DoubleSide });
  const matAccent = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.4, metalness: 0.2 });
  const matPanel = new THREE.MeshStandardMaterial({ color: 0x1b1e21, roughness: 0.6, side: THREE.DoubleSide });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x10151b, roughness: 0.05, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.4, depthWrite: false
  });

  // 材质命名:导出 FBX/GLB 后在 Blender / Unity 里按名字识别
  matWhite.name = 'body_white';
  matDark.name = 'face_dark';
  matDarkDeep.name = 'lens_ring_dark';
  matBlack.name = 'black';
  matMetal.name = 'metal';
  matLensInner.name = 'lens_inner';
  matLed.name = 'led_window';
  matLedFrame.name = 'led_frame';
  matShieldInner.name = 'shield_inner';
  matAccent.name = 'accent_gray';
  matPanel.name = 'tail_panel_black';
  matGlass.name = 'lens_glass';

  function add(mesh, cast = true) {
    mesh.castShadow = cast;
    mesh.receiveShadow = false;
    group.add(mesh);
    return mesh;
  }

  function cylX(radius, height, material, x, y = 0, z = 0, radialSeg = 48) {
    const geo = new THREE.CylinderGeometry(radius, radius, height, radialSeg);
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.z = -Math.PI / 2;
    mesh.position.set(x, y, z);
    return mesh;
  }

  // ----- body: rounded-box cross-section, domed tail, rolled front edge -----
  const H = 3.3, C = 1.7;                 // half size, corner radius
  const outline = roundedRectOutline(H, C, 10, 10);

  // white body: straight section + front roll (tail is covered by the black endcap)
  const bodyStations = [];
  [1.6, 3.5, 6.5, 9.5, 12.5, 14.9].forEach(x => bodyStations.push({ x, s: 1 }));
  [[15.3, 0.995], [15.7, 0.975], [16.1, 0.93], [16.4, 0.86]].forEach(([x, s]) => bodyStations.push({ x, s }));
  add(new THREE.Mesh(loftGeometry(bodyStations, outline, { closed: true, capEnd: true }), matWhite));

  // ----- black tail: rounded-box endcap like the lens face, plain black -----
  {
    const capSt = [];
    [0.02, 0.12, 0.3, 0.55, 0.85, 1.15, 1.4, 1.6].forEach(x => capSt.push({ x, s: sDome(x) * 1.012 }));
    add(new THREE.Mesh(loftGeometry(capSt, outline, { closed: true, capStart: true }), matPanel));
  }

  // ----- dark front faceplate (rounded-rect slab) -----
  {
    const faceGeo = new THREE.ExtrudeGeometry(roundedRectShape(5.7, 5.7, 1.15), {
      depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10
    });
    faceGeo.rotateY(Math.PI / 2);
    const face = new THREE.Mesh(faceGeo, matDark);
    face.position.x = 16.04;
    add(face);
  }

  // ----- lens stack, under a glass window -----
  add(cylX(1.36, 0.10, matDarkDeep, 16.46, 0.95));
  add(cylX(1.12, 0.07, matMetal, 16.52, 0.95));
  add(cylX(0.90, 0.07, matBlack, 16.555, 0.95));
  add(cylX(0.50, 0.07, matLensInner, 16.59, 0.95));
  // glass window over the lens (transparent, lens visible behind)
  {
    const glass = cylX(1.55, 0.18, matGlass, 16.55, 0.95, 0, 48);
    glass.renderOrder = 1;
    add(glass, false);
    // soft gradient reflections on the glass
    const streakTex = makeStreakTexture();
    const matStreak = new THREE.MeshBasicMaterial({
      map: streakTex, transparent: true, depthWrite: false, opacity: 0.75
    });
    matStreak.name = 'glass_streak';
    const streak = new THREE.Mesh(new THREE.CircleGeometry(1, 32), matStreak);
    streak.rotation.y = Math.PI / 2;
    streak.scale.set(0.62, 0.13, 1);
    streak.rotation.x = 0.55;
    streak.position.set(16.655, 1.38, -0.42);
    streak.renderOrder = 2;
    add(streak, false);

    const dot = new THREE.Mesh(new THREE.CircleGeometry(1, 24), matStreak.clone());
    dot.material.opacity = 0.5;
    dot.rotation.y = Math.PI / 2;
    dot.scale.set(0.13, 0.13, 1);
    dot.position.set(16.655, 0.62, 0.55);
    dot.renderOrder = 2;
    add(dot, false);
  }

  // ----- LED / illuminator window -----
  {
    const frameGeo = new THREE.ExtrudeGeometry(roundedRectShape(3.6, 1.5, 0.34), {
      depth: 0.10, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12
    });
    frameGeo.rotateY(Math.PI / 2);
    const frame = new THREE.Mesh(frameGeo, matLedFrame);
    frame.position.set(16.44, -1.35, 0);
    add(frame);

    const panelGeo = new THREE.ExtrudeGeometry(roundedRectShape(3.05, 1.0, 0.24), {
      depth: 0.09, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12
    });
    panelGeo.rotateY(Math.PI / 2);
    const panel = new THREE.Mesh(panelGeo, matLed);
    panel.position.set(16.53, -1.35, 0);
    add(panel);
  }

  // ----- mic pinhole -----
  add(cylX(0.15, 0.06, matBlack, 16.52, -2.45, 1.30, 20));

  // ----- sun shield: full coverage, hugging the box profile -----
  {
    const K1 = 3.64 / H;   // outer
    const K2 = 3.56 / H;   // inner
    const Kmid = (K1 + K2) / 2;
    const yEdge = 1.18;    // unscaled y of the shield's side edges
    const slice = outline.filter(p => p.y >= yEdge);

    const mainSt = [];
    [0.2, 0.45, 0.8, 1.15, 1.45, 1.6].forEach(x => mainSt.push({ x, s: sDome(x) }));
    [3.5, 6.5, 9.5, 12.5, 14.9].forEach(x => mainSt.push({ x, s: 1 }));

    // front edge: cut flush with the side edge line (no drooping tips),
    // ridge leans forward + slight tilt -> clean arched slant rim
    const uOf = p => (p.y - 1.244) / 2.056;
    const shape = w => (p) => {
      const u = uOf(p);
      return {
        x: 1.25 * u * w,
        y: -0.25 * u * w,
        z: -0.12 * (1 - u) * w
      };
    };
    const rows = [
      { x: 15.9, s: 0.97, w: 0 },
      { x: 16.0, s: 0.96, w: 0.35 },
      { x: 16.15, s: 0.945, w: 0.7 },
      { x: 16.35, s: 0.925, w: 1 },
    ];
    const allSt = mainSt.slice();
    rows.forEach(r => {
      const sh = shape(r.w);
      allSt.push({
        x: r.x, s: r.s,
        xOf: p => sh(p).x, yOf: p => sh(p).y, zOf: p => sh(p).z
      });
    });

    const outerSt = allSt.map(st => ({ ...st, s: st.s * K1 }));
    const innerSt = allSt.map(st => ({ ...st, s: st.s * K2 }));
    // slim knife rim at the last row: outer/inner converge, inner trails -> small slanted cut
    {
      const last = allSt[allSt.length - 1];
      outerSt[outerSt.length - 1] = { ...last, sFn: p => last.s * Kmid + 0.013 * uOf(p) };
      innerSt[innerSt.length - 1] = {
        ...last, sFn: p => last.s * Kmid - 0.013 * uOf(p),
        xOf: p => last.xOf(p) - 0.07 * uOf(p), yOf: p => last.yOf(p) - 0.05 * uOf(p), zOf: p => last.zOf(p)
      };
    }
    add(loftMesh(loftGeometry(outerSt, slice, { closed: false }), matWhite));
    // inner shell: dark in the gap AND over the front brow (like the product), white nowhere exposed
    add(loftMesh(loftGeometry(innerSt, slice, { closed: false }), matShieldInner));

    // edge strips sealing the shell (rear, front, two long sides)
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xeceef0, roughness: 0.4, side: THREE.DoubleSide });
    add(edgeStrip(outerSt, innerSt, slice, 'end0'), false).material = edgeMat;
    add(edgeStrip(outerSt, innerSt, slice, 'endLast'), false).material = edgeMat;
    add(edgeStrip(outerSt, innerSt, slice, 'side0'), false).material = edgeMat;
    add(edgeStrip(outerSt, innerSt, slice, 'sideLast'), false).material = edgeMat;

    // screw on shield top
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 20), matAccent);
    screw.position.set(13.3, 3.68, 0);
    add(screw);
  }

  function loftMesh(geo, material) { return new THREE.Mesh(geo, material); }

  function edgeStrip(stA, stB, slice, kind) {
    // builds a quad strip between two lofted surfaces along one boundary
    const N = stA.length, M = slice.length;
    const pos = [];
    const idx = [];
    const put = (st, p) => {
      const ang = st.ang || 0, ym = st.ym || 0;
      const yMid = (st.yMid !== undefined) ? st.yMid : ym;
      const M = st.Mref || 0, vt = st.vTaper || 1;
      const sEff = st.sFn ? st.sFn(p) : st.s;
      const ys = (M + (p.y - M) * vt) * sEff;
      const v = ys - ym;
      const xw = st.x + (st.xOf ? st.xOf(p) : 0);
      const yw = yMid + v * Math.cos(ang) + (st.yOf ? st.yOf(p) : 0);
      const zw = p.z * sEff + (st.zOf ? st.zOf(p) : 0);
      pos.push(xw - v * Math.sin(ang), yw, zw);
    };
    if (kind === 'end0' || kind === 'endLast') {
      const i = kind === 'end0' ? 0 : N - 1;
      for (let j = 0; j < M; j++) { put(stA[i], slice[j]); put(stB[i], slice[j]); }
      for (let j = 0; j < M - 1; j++) {
        const a = j * 2, b = j * 2 + 1, c = j * 2 + 2, d = j * 2 + 3;
        idx.push(a, c, d, a, d, b);
      }
    } else {
      const j = kind === 'side0' ? 0 : M - 1;
      for (let i = 0; i < N; i++) { put(stA[i], slice[j]); put(stB[i], slice[j]); }
      for (let i = 0; i < N - 1; i++) {
        const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
        idx.push(a, b, d, a, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, null);
  }

  // ----- bottom mount foot -----
  {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.8), matWhite);
    foot.position.set(4.5, -3.55, 0);
    add(foot);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 1.5), matAccent);
    pad.position.set(4.5, -4.09, 0);
    add(pad);
  }

  // ----- HIKVISION logo decals (flat planes on the flat sides) -----
  {
    const tex = makeLogoTexture();
    const matLogo = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, roughness: 0.45, metalness: 0.0, depthWrite: false
    });
    matLogo.name = 'logo';
    const geo = new THREE.PlaneGeometry(5.2, 1.9);

    const meshA = new THREE.Mesh(geo, matLogo);
    meshA.position.set(8.5, 0, -3.31);
    meshA.rotation.y = Math.PI;          // faces -Z, text reads correctly
    meshA.renderOrder = 1;
    meshA.name = 'logoA';
    add(meshA, false);

    const meshB = new THREE.Mesh(geo, matLogo);
    meshB.position.set(8.5, 0, 3.31);
    meshB.renderOrder = 1;
    meshB.name = 'logoB';
    add(meshB, false);
  }

  // center the model so it spins about its middle
  group.position.x = -8.5;
  return group;
}

function makeStreakTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLogoTexture() {
  const W = 1040, H = 380;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#777c82';
  try { g.letterSpacing = '10px'; } catch (_) {}
  g.font = 'italic 900 140px Arial, Helvetica, sans-serif';
  g.fillText('HIKVISION', W / 2, 108);
  try { g.letterSpacing = '14px'; } catch (_) {}
  g.font = '800 96px "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
  g.fillText('海康威视', W / 2, 268);

  makeLogoTexture.lastCanvas = c;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
