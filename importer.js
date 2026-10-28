// importer.js — 导入外部 FBX 模型,让它进入本项目的「查看 → 调整 → 导出」流程
//
//   importModelFiles(FileList|File[], { onProgress }) -> Promise<[record]>
//   record = { name, group, stats, notes }
//
// 处理链路:
//   ① 展开 .zip(可整包拖入)   ② 按扩展名分成 fbx / 贴图
//   ③ 用 LoadingManager.setURLModifier 把 fbx 里引用的贴图路径(可能带目录、可能是
//      反斜杠或绝对路径)映射到内存里同名文件的 blob URL —— 这是导入外部模型最容易
//      失败的一环,不接管的话贴图一定丢
//   ④ FBXLoader.parse 解析     ⑤ 后处理:单位换算、多材质拆分、命名、统计
//
// 说明:three 的 FBXLoader 不会按 UnitScaleFactor 缩放几何,只把它记在
// userData.unitScaleFactor 里。所以「模型大小不对」要在这里补,否则导出后尺寸会差 100 倍。

import * as THREE from './vendor/three.module.js';
import { FBXLoader } from './vendor/addons/FBXLoader.js';

const IMAGE_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  bmp: 'image/bmp', gif: 'image/gif', tga: 'image/x-tga',
  tif: 'image/tiff', tiff: 'image/tiff', exr: 'image/x-exr',
  dds: 'image/vnd-ms.dds', ktx2: 'image/ktx2',
};
const FBX_EXT = new Set(['fbx']);
const ZIP_EXT = new Set(['zip']);

const extOf = n => { const i = n.lastIndexOf('.'); return i < 0 ? '' : n.slice(i + 1).toLowerCase(); };
const baseOf = n => n.split(/[\\/]/).pop();
const stemOf = n => { const b = baseOf(n); const i = b.lastIndexOf('.'); return i < 0 ? b : b.slice(0, i); };

// ---------- 收集:解 zip + 统一成 { name, bytes } ----------
async function collectEntries(files) {
  const out = [];
  for (const f of files) {
    const name = f.name || 'file';
    if (ZIP_EXT.has(extOf(name))) {
      const entries = await ZipPack.readZip(new Uint8Array(await f.arrayBuffer()));
      for (const e of entries) {
        // 跳过 macOS 打包时塞进来的垃圾
        if (e.name.startsWith('__MACOSX/') || baseOf(e.name).startsWith('._')) continue;
        out.push({ name: baseOf(e.name), bytes: e.bytes });
      }
    } else {
      out.push({ name: baseOf(name), bytes: new Uint8Array(await f.arrayBuffer()) });
    }
  }
  return out;
}

// ---------- 贴图查找表:文件名(小写)→ blob URL ----------
function makeTextureResolver(entries, missing) {
  const byName = new Map();   // 小写全名
  const byStem = new Map();   // 小写主干名(扩展名不同时兜底)
  const urls = new Map();     // 表内 key → object URL
  const cache = new Map();    // 请求过的 url → 解析结果

  for (const e of entries) {
    const ext = extOf(e.name);
    if (!IMAGE_MIME[ext]) continue;
    const key = e.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, e);
    const stem = stemOf(e.name).toLowerCase();
    if (!byStem.has(stem)) byStem.set(stem, e);
  }

  function urlOf(entry) {
    const k = entry.name.toLowerCase();
    if (!urls.has(k)) {
      const mime = IMAGE_MIME[extOf(entry.name)] || 'application/octet-stream';
      urls.set(k, URL.createObjectURL(new Blob([entry.bytes], { type: mime })));
    }
    return urls.get(k);
  }

  return {
    count: byName.size,
    // fbx 里的贴图引用可能长这样:textures/foo.png、C:\proj\tex\foo.png、foo.tga
    resolve(raw) {
      if (!raw) return null;
      if (/^(blob:|data:|https?:)/i.test(raw)) return raw;
      if (cache.has(raw)) return cache.get(raw);
      let hit = byName.get(baseOf(raw).toLowerCase());
      if (!hit) hit = byStem.get(stemOf(raw).toLowerCase());
      const url = hit ? urlOf(hit) : null;
      if (!hit) missing.add(baseOf(raw));
      cache.set(raw, url);
      return url;
    },
    revoke() { for (const u of urls.values()) URL.revokeObjectURL(u); urls.clear(); },
  };
}

// ---------- 多材质网格按 group 拆开 ----------
// FBX 里一个物体挂多个材质时,FBXLoader 会给出 geometry.groups + 材质数组;
// 本项目的导出器只按「一个网格一个材质」写,所以这里先拆成独立网格,避免丢材质。
function splitByMaterialGroups(mesh, THREE) {
  const g = mesh.geometry;
  const mats = mesh.material;
  if (!Array.isArray(mats) || !g.groups || g.groups.length <= 1) return [mesh];

  const index = g.index;
  const out = [];
  for (const grp of g.groups) {
    const start = grp.start || 0;
    const count = grp.count || 0;
    if (!count) continue;
    const geo = new THREE.BufferGeometry();
    for (const attrName in g.attributes) {
      const attr = g.attributes[attrName];
      const itemSize = attr.itemSize;
      const src = attr.array;
      const dst = new src.constructor(count * itemSize);
      if (index) {
        for (let i = 0; i < count; i++) {
          const vi = index.getX(start + i);
          for (let k = 0; k < itemSize; k++) dst[i * itemSize + k] = src[vi * itemSize + k];
        }
      } else {
        dst.set(src.subarray(start * itemSize, (start + count) * itemSize));
      }
      geo.setAttribute(attrName, new THREE.BufferAttribute(dst, itemSize, attr.normalized));
    }
    const sub = new THREE.Mesh(geo, mats[grp.materialIndex] || mats[0]);
    sub.name = mesh.name + '_' + out.length;
    sub.position.copy(mesh.position);
    sub.quaternion.copy(mesh.quaternion);
    sub.scale.copy(mesh.scale);
    sub.userData = { ...mesh.userData };
    out.push(sub);
  }
  return out.length ? out : [mesh];
}

// ---------- 单位换算:把几何归一到「场景单位 = 厘米」 ----------
// FBX 的 UnitScaleFactor 表示「1 个文件单位等于多少厘米」,所以 cm = 原始值 × usf。
// 真实世界里的 FBX(尤其 Unity / Max 导出的)经常 usf 与数值不匹配,再加一层数量级兜底。
function normalizeScale(root, notes, THREE) {
  const usf = Number(root.userData.unitScaleFactor) || 1;
  let k = 1;
  if (usf > 0 && usf !== 1) k = usf;
  const apply = f => {
    root.scale.multiplyScalar(f);
    root.updateMatrixWorld(true);
  };
  if (k !== 1) apply(k);

  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  let fix = 1;
  if (Number.isFinite(maxDim) && maxDim > 0) {
    // 目标量级:厘米下 1 ~ 10000(设备类模型都落在几十到几百厘米)
    while (maxDim * fix < 1) fix *= 10;
    while (maxDim * fix > 10000) fix /= 10;
  }
  if (fix !== 1) apply(fix);
  const total = k * fix;

  if (usf !== 1) notes.push(`按 FBX UnitScaleFactor=${usf} 换算单位`);
  if (fix !== 1) notes.push(`尺寸超出常见量级,已按 ×${fix} 校正`);
  return total;
}

// ---------- 主入口 ----------
export async function importModelFiles(fileList, opts = {}) {
  const files = Array.from(fileList || []);
  if (!files.length) return [];

  opts.onProgress && opts.onProgress('解包文件…');
  const entries = await collectEntries(files);

  const fbxEntries = entries.filter(e => FBX_EXT.has(extOf(e.name)));
  if (!fbxEntries.length) {
    const hasOther = entries.map(e => extOf(e.name)).filter(Boolean);
    throw new Error('没有找到 .fbx 文件' + (hasOther.length ? '(选中的文件里只有:' + [...new Set(hasOther)].join(', ') + ')' : ''));
  }

  const missing = new Set();
  const resolver = makeTextureResolver(entries, missing);
  const results = [];

  try {
    for (const fe of fbxEntries) {
      opts.onProgress && opts.onProgress(`解析 ${fe.name}…`);
      const notes = [];
      const manager = new THREE.LoadingManager();
      manager.setURLModifier(url => resolver.resolve(url) || url);
      let settled = false;
      const texturesDone = new Promise(resolve => {
        manager.onLoad = () => { settled = true; resolve(); };
        manager.onError = () => { if (!settled) { /* 单张失败不阻塞,等超时 */ } };
        setTimeout(() => resolve(), 15000);
      });

      const loader = new FBXLoader(manager);
      const buffer = fe.bytes.buffer.slice(fe.bytes.byteOffset, fe.bytes.byteOffset + fe.bytes.byteLength);
      const root = loader.parse(buffer, '');
      await texturesDone;

      // --- 后处理 ---
      const scaleApplied = normalizeScale(root, notes, THREE);

      // 收集网格 → 拆多材质 → 有动画/骨骼的节点保持原样
      const meshes = [];
      root.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o); });
      let splitCount = 0;
      for (const m of meshes) {
        const parts = splitByMaterialGroups(m, THREE);
        if (parts.length > 1 || parts[0] !== m) {
          m.parent.add(...parts);
          m.parent.remove(m);
          splitCount += parts.length - 1;
        }
      }
      if (splitCount > 0) notes.push(`多材质网格已拆分为 ${splitCount} 个独立部件`);

      // 顶点色陷阱:FBXLoader 只要在文件里看到 Color 层就把材质的 vertexColors 置 true,
      // 但几何体上未必真的生成了 color 属性。此时着色器拿默认值 (0,0,0) 乘漫反射 ——
      // 模型看起来是纯黑,只剩高光,很容易被误判成「法线反了」。
      // 处理时要按「材质」而不是按「网格」来判断:一个材质常被几十个网格共用,
      // 逐个网格克隆会炸出几十份重复材质(导出时贴图也跟着重名)。
      const matColorUse = new Map();   // material -> { withColor, withoutColor }
      root.traverse(o => {
        if (!o.isMesh) return;
        const has = !!o.geometry.attributes.color;
        for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
          if (!m) continue;
          const rec = matColorUse.get(m) || { withColor: false, withoutColor: false };
          if (has) rec.withColor = true; else rec.withoutColor = true;
          matColorUse.set(m, rec);
        }
      });
      const cloneVc = new Map();       // 原材质 -> 关闭顶点色的副本(只给缺失顶点色的网格用)
      const fixedMats = new Set();
      root.traverse(o => {
        if (!o.isMesh || o.geometry.attributes.color) return;
        const pick = m => {
          if (!m || !m.vertexColors) return m;
          const use = matColorUse.get(m);
          if (use && use.withColor) {              // 同材质还有带顶点色的网格 → 给这边一份副本
            if (!cloneVc.has(m)) {
              const c = m.clone();
              c.vertexColors = false;
              c.needsUpdate = true;
              cloneVc.set(m, c);
            }
            fixedMats.add(cloneVc.get(m));
            return cloneVc.get(m);
          }
          m.vertexColors = false;                  // 全都不带顶点色 → 直接改,保持材质共享
          m.needsUpdate = true;
          fixedMats.add(m);
          return m;
        };
        const list = Array.isArray(o.material) ? o.material : [o.material];
        const fixed = list.map(pick);
        o.material = Array.isArray(o.material) ? fixed : fixed[0];
      });
      if (fixedMats.size) notes.push(`关闭 ${fixedMats.size} 个材质的顶点色(模型没有顶点色数据,否则渲染纯黑)`);

      // 材质/网格命名:导出后按名字识别,重名的贴图会互相覆盖
      // 注意:同一个材质对象常被几十个网格共用,必须按 uuid 去重后再改名,
      // 否则会一路加后缀(shell_2_2_2_2…)
      const uniqueMats = new Map();
      const bump = m => { if (m && !uniqueMats.has(m.uuid)) uniqueMats.set(m.uuid, m); };
      root.traverse(o => {
        if (!o.isMesh) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(bump);
      });
      const usedMat = new Set();
      for (const m of uniqueMats.values()) {
        const base = String(m.name || '').replace(/[\r\n\t]+/g, ' ').trim() || 'material';
        let name = base, i = 2;
        while (usedMat.has(name.toLowerCase())) name = base + '_' + i++;
        usedMat.add(name.toLowerCase());
        if (name !== m.name) m.name = name;

        // FBXLoader 给的是 Phong,导出器按 Standard 的字段读 —— 补齐默认值,
        // 避免导出后 roughness/metalness 变成 undefined 落到 0.6/0
        if (m.roughness === undefined) {
          const shininess = typeof m.shininess === 'number' ? m.shininess : 30;
          m.roughness = Math.min(1, Math.max(0.05, 1 - Math.sqrt(Math.max(0, Math.min(1000, shininess)) / 1000)));
        }
        if (m.metalness === undefined) m.metalness = 0;
        if (m.map && m.map.image) m.map.needsUpdate = true;
      }

      let unnamed = 0;
      root.traverse(o => {
        if (o.isMesh && !o.name) { o.name = 'part_' + String(++unnamed).padStart(2, '0'); }
      });

      // --- 统计 ---
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      let tri = 0, vert = 0, meshCount = 0, textured = 0;
      const matSet = new Set();
      root.traverse(o => {
        if (!o.isMesh) return;
        meshCount++;
        const g = o.geometry;
        tri += (g.index ? g.index.count : g.attributes.position.count) / 3;
        vert += g.attributes.position.count;
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of list) {
          if (!m) continue;
          matSet.add(m.uuid);
          if (m.map && m.map.image) textured++;
        }
      });

      const stats = {
        meshes: meshCount,
        triangles: Math.round(tri),
        vertices: vert,
        materials: matSet.size,
        textured,
        size: [size.x, size.y, size.z],
        unitScaleFactor: Number(root.userData.unitScaleFactor) || 1,
        scaleApplied,
        texturesProvided: resolver.count,
      };

      // 贴图来源要说清楚:内嵌在 fbx 里的和外部 PNG 是两回事
      if (textured === 0 && resolver.count === 0) notes.push('没有可用的贴图(fbx 内没有内嵌,也没有附带图片文件)');
      else if (textured === 0) notes.push('带了贴图文件但没能挂上,检查文件名是否与 fbx 内引用一致');
      else if (resolver.count === 0) notes.push(`贴图内嵌在 fbx 内部,已自动提取 ${textured} 张`);
      if (missing.size) {
        const list = [...missing].slice(0, 4).join(', ');
        notes.push(`缺少 ${missing.size} 张贴图:${list}${missing.size > 4 ? ' 等' : ''}`);
      }

      results.push({
        name: stemOf(fe.name),
        fileName: fe.name,
        group: root,
        stats,
        notes,
      });
    }
  } finally {
    // 贴图已经解码进 ImageBitmap/canvas,blob URL 可以回收了
    resolver.revoke();
  }

  return results;
}
