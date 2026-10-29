const THREE = await import('./vendor/three.module.js');
const { importModelFiles } = await import('./importer.js');

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
  backdrop.renderOrder = -1;
  backdrop.userData.noExport = true; // 不导出背景球

  // ---------- camera + orbit ----------
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 500);
  const target = new THREE.Vector3(0, 0, 0);
  const sph = new THREE.Spherical(23, 1.42, 2.272); // initial: front-left three-quarter, logo side
  applyCamera();

  let spin = true;
  window.__debug = {
    setView(theta, phi, r) { sph.theta = theta; sph.phi = phi; if (r) sph.radius = r; applyCamera(); },
    setSpin(on) { spin = on; syncSpinBtn(); },
    setRot(y) { pivot.rotation.y = y; },
    model: () => currentModel,
    scene: () => scene,
    camera: () => camera,
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
    backdrop.position.copy(camera.position);
  }

  let dragging = false, lastX = 0, lastY = 0;
  // 缩放范围随模型大小自适应(导入的大模型需要退得更远,小件需要凑得更近)
  let zoomMin = 11, zoomMax = 300;
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
    sph.radius = THREE.MathUtils.clamp(sph.radius * Math.exp(e.deltaY * 0.0012), zoomMin, zoomMax);
    applyCamera();
  }, { passive: false });

  // ---------- 环境反射(程序化 equirect 渐变,给金属/橡胶一点天光层次) ----------
  {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.00, '#ffffff');
    grad.addColorStop(0.42, '#e6ebf1');
    grad.addColorStop(0.52, '#c9d2da');
    grad.addColorStop(0.62, '#8d949c');
    grad.addColorStop(1.00, '#3c4046');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
    // 两处柔和亮斑,让高光有走向
    const blob = (x, y, r, a) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,' + a + ')');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    };
    blob(120, 70, 110, 0.95); blob(380, 95, 90, 0.7);
    const envTex = new THREE.CanvasTexture(c);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
  }

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
    { id: 'dt201d-clamp', name: 'DT201D 数字钳形表', build: buildClampMeter },
    { id: 'earth-tester', name: '防雷接地检测仪', build: buildEarthTester },
    { id: 'multimeter', name: '数字万用表', build: buildMultimeter },
    { id: 'hikmicro-h11', name: 'HM-TPH11 手持热成像仪', build: buildThermalImager },
    { id: 'conquest-rugged-phone', name: '征服 CONQUEST 三防终端', build: buildRuggedPhone },
    { id: 'multimeter-2', name: '数字万用表2', build: buildMultimeter2 },
    { id: 'air-detector', name: '空气检测仪', build: buildAirDetector },
    { id: 'kindergarten-frame', name: '幼儿园墙挂相框', build: buildKindergartenFrame,
      view: { theta: 1.45, phi: 1.43, fitViewport: true, spin: false } },
    { id: 'hikvision-column-speaker', name: '海康威视网络音柱', build: buildHikvisionColumnSpeaker },
    { id: 'poe-security-switch', name: '24口千兆 PoE+ 安防交换机', build: buildPoeSecuritySwitch,
      view: { theta: 2.62, phi: 1.36 } },
    { id: 'nvr-4bay', name: 'NVR 网络视频录像机 (4盘位)', build: buildNVR,
      view: { theta: 2.62, phi: 1.36 } },
    { id: 'dome-camera', name: '海康威视半球网络摄像机', build: buildDomeCamera },
    { id: 'ptz-camera', name: '7寸红外网络球机 (PTZ)', build: buildPTZCamera,
      view: { theta: 2.62, phi: 1.36 } },
    { id: 'poe-switch-8', name: '8口千兆 PoE 交换机', build: buildPoeSwitch8,
      view: { theta: 2.62, phi: 1.36 } },
    { id: 'fiber-odf', name: '24口光纤配线架 (ODF)', build: buildFiberODF,
      view: { theta: 2.62, phi: 1.36 } },
    { id: 'monitor-4k', name: '27寸 4K 安防监视器', build: buildMonitor4K,
      view: { theta: 2.7, phi: 1.42, fitViewport: true, spin: false } },
    { id: 'video-server', name: '2U 视频服务器', build: buildVideoServer,
      view: { theta: 2.62, phi: 1.36 } },
    { id: 'security-platform', name: '企业安全管理平台一体机', build: buildSecurityPlatform,
      view: { theta: 2.62, phi: 1.36 } },
    { id: 'ip-intercom', name: 'IP 网络可视对讲终端', build: buildIPIntercom,
      view: { theta: 2.7, phi: 1.42, fitViewport: true, spin: false } },
    { id: 'paging-microphone', name: '网络寻呼话筒', build: buildPagingMicrophone,
      view: { theta: 2.7, phi: 1.42, fitViewport: true, spin: false } },
    { id: 'positioner-signal-source', name: '定位器调试信号源', build: buildPositionerSignalSource },
    { id: 'positioner-test-connectors', name: '定位器检测线接头 (无线)', build: buildPositionerTestConnectors },
    { id: 'leak-detector-sprayer', name: '气密检漏喷壶', build: buildLeakDetectorSprayer },
    // { id: 'xxx', name: 'xxx名称', build: buildXxx },
  ];

  const pivot = new THREE.Group();
  scene.add(pivot);
  let currentModel = null;
  let currentRec = null;
  let currentId = 'nvr-4bay';   // 默认展示系统核心设备 NVR

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
    currentRec = rec;
    // 模型作者可以指定初始机位(如相框要正对看)
    spin = rec.view?.spin !== false;
    syncSpinBtn();
    if (rec.view) {
      sph.theta = rec.view.theta;
      sph.phi = rec.view.phi;
      pivot.rotation.set(0, 0, 0);
    }
    if (currentModel) {
      pivot.remove(currentModel);
      // 导入的模型是常驻对象(切回来还用它),不能销毁几何
      if (!rec.persistent) currentModel.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    }
    currentModel = rec.build(THREE);
    pivot.add(currentModel);
    nameModel();
    // 自动取景:模型垂直居中到原点,按包围球调整轨道半径,让不同大小的模型都合适
    // 取包围盒时先把转台角度归零:转台一直在转,带旋转算出来的世界包围盒
    // 中心会被转偏,拿它去归位会让模型偏离画面中心
    const spinSaved = pivot.rotation.y;
    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(currentModel);
    // 导入的模型只在首次归位,之后由用户在面板里自己调,重选时不再覆盖
    if (!rec.persistent || !rec.positioned) {
      currentModel.position.y -= (box.min.y + box.max.y) / 2;
      if (rec.persistent) {
        // 外部模型的原点常常不在几何中心,三个轴都要归位,否则相机会对着空气看
        currentModel.position.x -= (box.min.x + box.max.x) / 2;
        currentModel.position.z -= (box.min.z + box.max.z) / 2;
        rec.positioned = true;
        rec.basePos = currentModel.position.clone();
        rec.baseScale = currentModel.scale.x || 1;
        rec.edit = { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, s: 1 };
      }
    }
    const box2 = new THREE.Box3().setFromObject(currentModel);
    const sphere = box2.getBoundingSphere(new THREE.Sphere());
    // 取景按「最长边」算:模型朝向千奇百怪(比如平躺的平板,Z 方向最长),
    // 只看 x/y 会把 Z 方向的尺寸漏掉,一转就出画。转台还会一直转,所以按最大边留余量。
    const size = box2.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const halfFov = (camera.fov * Math.PI / 180) / 2;
    let fit;
    if (rec.persistent) {
      // 外部模型朝向不确定(常见平躺、长轴在 Z),按最长边+包围球留足余量,
      // 转台转到任何角度都不该出画
      const fitV = (maxDim / 2) / Math.tan(halfFov);
      const fitH = (maxDim / 2) / (Math.tan(halfFov) * Math.max(camera.aspect, 0.2));
      fit = Math.max(sphere.radius * 1.6, Math.max(fitV, fitH) * 1.12);
    } else {
      // 内置模型都是按「正面朝 +X、竖直方向为 Y」建的,沿用原来的精确取景,保持观感不变
      const fitV = (size.y / 2) / Math.tan(halfFov);
      const fitH = (size.x / 2) / (Math.tan(halfFov) * Math.max(camera.aspect, 0.2));
      fit = Math.max(sphere.radius * 1.9, Math.max(fitV, fitH) * 1.18);
    }
    pivot.rotation.y = spinSaved;              // 恢复转台(包围盒已经量完)
    pivot.updateMatrixWorld(true);
    sph.radius = THREE.MathUtils.clamp(fit, 11, 5000);
    // 模型作者要求「整件入画」时(fitViewport),按包围球反推距离:
    // 扁平板件用包围盒取景会在转角度时出画,按球算是唯一稳妥的解
    if (rec.view?.fitViewport) {
      const halfVertical = THREE.MathUtils.degToRad(camera.fov / 2);
      const halfHorizontal = Math.atan(Math.tan(halfVertical) * camera.aspect);
      sph.radius = THREE.MathUtils.clamp(
        sphere.radius * 1.06 / Math.sin(Math.min(halfVertical, halfHorizontal)), 11, 500);
    }
    // 缩放范围随模型自适应:导入的大件要能退得更远,小件要能凑得更近
    zoomMin = Math.max(2, sphere.radius * 0.55);
    zoomMax = Math.max(300, sphere.radius * 12);
    // 背景球 / 阴影地面 / 远裁剪面都要按模型大小跟着长,
    // 否则大模型会把相机推到背景球外面(背景直接变黑)、地面也被裁在肚子里
    const bgK = Math.max(1, (sph.radius * 2.6) / 90);
    backdrop.scale.setScalar(bgK);
    ground.scale.setScalar(Math.max(1, sphere.radius / 30));
    camera.far = Math.max(500, sph.radius * 6, 90 * bgK * 2);
    camera.updateProjectionMatrix();
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
    if (b) {
      b.textContent = '查看内部';
      // 「查看内部」是给程序化建模的外壳用的,导入模型没有这个概念
      b.disabled = !!rec.persistent;
      b.title = rec.persistent
        ? '导入模型没有外壳/内部结构区分,用左侧面板的部件列表控制显隐'
        : '隐藏/显示外壳,查看内部结构';
    }
    if (sel) sel.value = rec.id;      // 下拉框跟随当前模型(包括默认启动的那一个)
    if (rec.persistent) applyEdit(rec);   // 恢复用户在面板里调过的变换
    updatePanel(rec);
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
      // 模型可自定义透视行为(如钳形表用半透明外壳做 X 光效果)
      if (typeof currentModel.userData.onShellToggle === 'function') currentModel.userData.onShellToggle(shellOn);
      shellBtn.textContent = shellOn ? '查看内部' : '显示外壳';
    });
  }

  // 旋转开关:默认开启。文案描述「点下去会发生什么」,和「查看内部」一致
  function syncSpinBtn() {
    const b = document.getElementById('btn-spin');
    if (!b) return;
    b.textContent = spin ? '暂停旋转' : '开启旋转';
    b.title = spin ? '模型正在自动旋转,点击暂停' : '已暂停,点击恢复自动旋转';
    b.classList.toggle('is-off', !spin);
  }
  {
    const b = document.getElementById('btn-spin');
    if (b) b.addEventListener('click', () => { spin = !spin; syncSpinBtn(); });
  }
  setModel('nvr-4bay');
  syncSpinBtn();   // 初始状态(部分模型自带 view.spin = false)

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

  // ============================================================
  //  导入外部 FBX 模型
  //  导入后这条记录和内置模型一样进下拉列表,pivot 转台、自动取景、导出 zip 全部复用
  // ============================================================
  let toastTimer = 0;
  function toast(msg, ms = 2400) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  // 面板里的位移/旋转/缩放是相对导入时位置的增量,不破坏导入时算好的归位与单位
  function applyEdit(rec) {
    const g = rec.group, e = rec.edit;
    if (!g || !e || !rec.basePos) return;
    const d = Math.PI / 180;
    g.position.set(rec.basePos.x + e.px, rec.basePos.y + e.py, rec.basePos.z + e.pz);
    g.rotation.set(e.rx * d, e.ry * d, e.rz * d);
    const s = (rec.baseScale || 1) * (e.s || 1);
    g.scale.setScalar(s);
    g.updateMatrixWorld(true);
  }

  function updatePanel(rec) {
    const panel = document.getElementById('panel');
    if (!panel) return;
    if (!rec || !rec.persistent) { panel.hidden = true; return; }
    panel.hidden = false;

    const s = rec.stats;
    document.getElementById('p-name').textContent = rec.name;
    const info = document.getElementById('p-info');
    info.textContent = '';
    const l1 = document.createElement('div');
    l1.textContent = `${s.meshes} 个部件 · ${s.triangles.toLocaleString()} 三角面 · ${s.materials} 个材质`
      + (s.textured ? ` · ${s.textured} 张已挂贴图` : '');
    const l2 = document.createElement('div');
    const fmt = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
    l2.textContent = `尺寸 ${s.size.map(fmt).join(' × ')} cm`
      + `(导出后 ${s.size.map(v => (v / 100).toFixed(2)).join(' × ')} m)`;
    info.append(l1, l2);
    for (const n of rec.notes || []) {
      const d = document.createElement('div');
      d.className = 'p-note';
      d.textContent = '· ' + n;
      info.appendChild(d);
    }

    // 变换输入回填
    const e = rec.edit;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('p-px', +e.px.toFixed(3)); set('p-py', +e.py.toFixed(3)); set('p-pz', +e.pz.toFixed(3));
    set('p-rx', +e.rx.toFixed(2)); set('p-ry', +e.ry.toFixed(2)); set('p-rz', +e.rz.toFixed(2));
    set('p-scale', +e.s.toFixed(3));

    // 部件列表(取消勾选 = 不显示,同时从导出中排除)
    const parts = document.getElementById('p-parts');
    parts.textContent = '';
    const head = document.createElement('div');
    head.className = 'p-head-row';
    head.textContent = '部件(取消勾选 = 不导出)';
    const filter = document.createElement('input');
    filter.type = 'search';
    filter.id = 'p-filter';
    filter.placeholder = '按名称筛选部件…';
    parts.append(head, filter);

    const list = document.createElement('div');
    list.className = 'p-list';
    const rows = [];
    let n = 0, shown = 0;
    const MAX_ROWS = 2000;
    rec.group.traverse(o => {
      if (!o.isMesh) return;
      n++;
      if (n > MAX_ROWS) return;
      shown++;
      const row = document.createElement('label');
      row.className = 'p-part';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !o.userData.noExport;
      cb.addEventListener('change', () => {
        o.visible = cb.checked;
        o.userData.noExport = !cb.checked;
      });
      const nm = document.createElement('span');
      nm.textContent = o.name || '(未命名)';
      nm.title = o.name || '';
      const tri = document.createElement('em');
      const g = o.geometry;
      tri.textContent = Math.round((g.index ? g.index.count : g.attributes.position.count) / 3).toLocaleString();
      row.append(cb, nm, tri);
      list.appendChild(row);
      rows.push({ row, key: (o.name || '').toLowerCase() });
    });
    parts.appendChild(list);
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      for (const r of rows) r.row.hidden = !!q && !r.key.includes(q);
    });
    if (n > shown) {
      const more = document.createElement('div');
      more.className = 'p-note';
      more.textContent = `· 另有 ${n - shown} 个部件未列出(超过 ${MAX_ROWS} 个)`;
      parts.appendChild(more);
    }
  }

  async function handleFiles(files) {
    if (!files || !files.length) return;
    const btn = document.getElementById('btn-import');
    const label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '导入中…'; }
    toast('正在导入模型…', 60000);
    try {
      const records = await importModelFiles(files, { onProgress: m => toast(m, 60000) });
      for (const r of records) {
        const id = 'imported-' + (MODELS.filter(m => m.persistent).length + 1) + '-' + Date.now().toString(36).slice(-4);
        const rec = {
          id,
          name: '导入 · ' + r.name,
          persistent: true,
          group: r.group,
          stats: r.stats,
          notes: r.notes,
          build() { return r.group; },
        };
        MODELS.push(rec);
        const sel2 = document.getElementById('model-select');
        if (sel2) {
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = rec.name;
          sel2.appendChild(opt);
          sel2.value = id;
        }
        setModel(id);
      }
      toast(`已导入 ${records.length} 个模型:${records.map(r => r.name).join('、')}`);
    } catch (err) {
      console.error(err);
      toast('导入失败:' + (err && err.message ? err.message : err), 6000);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = label || '导入模型'; }
    }
  }

  {
    const btnImport = document.getElementById('btn-import');
    const fileInput = document.getElementById('file-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        const fs = [...fileInput.files];
        fileInput.value = '';               // 允许再次选同一个文件
        handleFiles(fs);
      });
    }

    // 拖拽导入:文件 / 整个文件夹 / zip 都行
    const drop = document.getElementById('drop');
    let dragDepth = 0;
    const showDrop = on => { if (drop) drop.hidden = !on; };
    window.addEventListener('dragenter', e => {
      if (!e.dataTransfer || ![...(e.dataTransfer.types || [])].includes('Files')) return;
      dragDepth++; showDrop(true);
    });
    window.addEventListener('dragover', e => {
      if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')) e.preventDefault();
    });
    window.addEventListener('dragleave', () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) showDrop(false);
    });
    window.addEventListener('drop', async e => {
      if (!e.dataTransfer) return;
      e.preventDefault();
      dragDepth = 0; showDrop(false);
      // 拖文件夹时用 items + webkitGetAsEntry 递归取文件
      const entries = [...(e.dataTransfer.items || [])]
        .map(it => (it.webkitGetAsEntry ? it.webkitGetAsEntry() : null))
        .filter(Boolean);
      if (entries.length) {
        const files = [];
        const walk = async entry => {
          if (entry.isFile) {
            files.push(await new Promise((res, rej) => entry.file(res, rej)));
          } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const readAll = () => new Promise(res => reader.readEntries(res, () => res([])));
            for (let batch = await readAll(); batch.length; batch = await readAll()) {
              for (const child of batch) await walk(child);
            }
          }
        };
        for (const en of entries) await walk(en);
        if (files.length) return handleFiles(files);
      }
      if (e.dataTransfer.files && e.dataTransfer.files.length) handleFiles([...e.dataTransfer.files]);
    });

    // 面板:变换输入 / 重置 / 收起
    const bind = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const rec = currentRec;
        if (!rec || !rec.persistent || !rec.edit) return;
        const v = parseFloat(el.value);
        if (!Number.isFinite(v)) return;
        rec.edit[key] = v;
        applyEdit(rec);
      });
    };
    bind('p-px', 'px'); bind('p-py', 'py'); bind('p-pz', 'pz');
    bind('p-rx', 'rx'); bind('p-ry', 'ry'); bind('p-rz', 'rz');
    bind('p-scale', 's');

    const reset = document.getElementById('p-reset');
    if (reset) reset.addEventListener('click', () => {
      const rec = currentRec;
      if (!rec || !rec.persistent) return;
      rec.edit = { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, s: 1 };
      applyEdit(rec);
      updatePanel(rec);
      toast('已重置位置/旋转/缩放');
    });

    const close = document.getElementById('p-close');
    if (close) close.addEventListener('click', () => {
      const p = document.getElementById('panel');
      if (p) p.hidden = true;
    });
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
