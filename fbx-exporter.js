// fbx-exporter.js — 独立导出模块(无 three.js 依赖,只读取对象属性)
//
//   exportFBX(scene, opts) -> { bytes, images:[{name, bytes}] }   二进制 FBX 7.4 + 贴图 PNG
//   exportGLB(scene, opts) -> Uint8Array                        glTF 2.0 二进制(.glb)
//
// 说明:不含动画;世界变换烘焙进顶点;单位换算为米(模型是厘米,×0.01)。
// 二进制 FBX 布局参考 Blender 官方 addons_core/io_scene_fbx/encode_bin.py。
// Blender 4.x 只认二进制 FBX(ASCII 会被拒绝),Unity 两者都认。

const EXPORT_SCALE_DEFAULT = 0.01; // cm -> m

// FBX 二进制文件尾常量(布局见 encode_bin / ufbx 规范,FBX SDK 与 Unity 严格校验)
//   ① FOOTER_ID   16 字节固定标识
//   ② padding     1..16 字节零,使「文件体 + 16」对齐到 16 字节边界
//   ③ 0u32        4 字节零
//   ④ VERSION     4 字节(7400)
//   ⑤ reserved    120 字节零
//   ⑥ FOOTER_MAGIC 16 字节固定魔法字(必须是文件最后 16 字节)
// 读取器依赖「文件总长 = 16 的整数倍」从末尾回溯定位 trailer,缺这部分会判定文件损坏。
const FBX_FOOTER_ID = new Uint8Array([
  0xfa, 0xbc, 0xab, 0x09, 0xd0, 0xc8, 0xd4, 0x66,
  0xb1, 0x76, 0xfb, 0x83, 0x1c, 0xf7, 0x26, 0x7e,
]);
const FBX_FOOTER_MAGIC = new Uint8Array([
  0xf8, 0x5a, 0x8c, 0x6a, 0xde, 0xf5, 0xd9, 0x7e,
  0xec, 0xe9, 0x0c, 0xe3, 0x75, 0x8f, 0x29, 0x0b,
]);

// ---------- 通用:收集可导出网格 ----------
function collectMeshes(scene) {
  const list = [];
  scene.traverse(o => {
    if (o.isMesh && !o.userData.noExport) list.push(o); // 隐藏的外壳也导出(内部结构完整保留)
  });
  return list;
}

// 世界矩阵烘焙:返回三角形角点数组(位置/法线/UV)
function extractTriangles(mesh, scale) {
  mesh.updateWorldMatrix(true, false);
  const g = mesh.geometry;
  const posAttr = g.attributes.position;
  const norAttr = g.attributes.normal;
  const uvAttr = g.attributes.uv;
  const index = g.index ? g.index.array : null;
  const cornerCount = index ? index.length : posAttr.count;

  // three.js Matrix4.elements 是列主序: e[0..3]=第0列, e[12..14]=平移分量。
  // 点变换: out_i = e[i]*x + e[4+i]*y + e[8+i]*z + e[12+i]
  // (旧实现把 m[12] 当平移用,但 m[12] 实际取到 e[3]——恒为 0,导致所有
  //  用 position 定位的部件顶点全部堆在原点;旋转同时被转置)
  const e = mesh.matrixWorld.elements;
  const e0 = e[0], e1 = e[4], e2 = e[8], tx = e[12];
  const e3 = e[1], e4 = e[5], e5 = e[9], ty = e[13];
  const e6 = e[2], e7 = e[6], e8 = e[10], tz = e[14];

  // 法线矩阵 = (M3)^-1 的转置。M3 为左上 3x3,行主序按行取:
  //   row0 = (e0,e4,e8) row1 = (e1,e5,e9) row2 = (e2,e6,e10)
  const a = e[0], b = e[4], c = e[8];
  const d = e[1], f2 = e[5], gg = e[9];
  const h = e[2], i2 = e[6], j = e[10];
  // 注意:变量名是 gg(e[9]),不能写成 g —— g 在作用域内是 mesh.geometry,
  // 参与算术会得到 NaN,导致全部法线变成 NaN,模型在 Unity 里渲染为纯黑。
  const A = f2 * j - gg * i2, B = -(d * j - gg * h), C = d * i2 - f2 * h;
  const D = -(b * j - c * i2), F = a * j - c * h, G = -(a * i2 - b * h);
  const H = b * gg - c * f2, I = -(a * gg - c * d), J = a * f2 - b * d;
  let det = a * A + b * B + c * C;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) det = 1;  // 退化矩阵:退回单位阵
  // Minv = adj(M3)/det (行主序);法线 = Minv 的转置作用于 n
  const inv = [
    A / det, D / det, H / det,     // Minv 第 0 列 → 法线 x 分量的系数
    B / det, F / det, I / det,     // 第 1 列 → y
    C / det, G / det, J / det,     // 第 2 列 → z
  ];

  const pos = [], nor = [], uv = [];
  for (let t = 0; t < cornerCount; t++) {
    const vi = index ? index[t] : t;
    const x = posAttr.getX(vi), y = posAttr.getY(vi), z = posAttr.getZ(vi);
    pos.push((e0 * x + e1 * y + e2 * z + tx) * scale,
             (e3 * x + e4 * y + e5 * z + ty) * scale,
             (e6 * x + e7 * y + e8 * z + tz) * scale);
    let nx = 0, ny = 1, nz = 0;
    if (norAttr) {
      const px = norAttr.getX(vi), py = norAttr.getY(vi), pz = norAttr.getZ(vi);
      nx = inv[0] * px + inv[3] * py + inv[6] * pz;
      ny = inv[1] * px + inv[4] * py + inv[7] * pz;
      nz = inv[2] * px + inv[5] * py + inv[8] * pz;
      const l = Math.hypot(nx, ny, nz);
      if (Number.isFinite(l) && l > 1e-9) { nx /= l; ny /= l; nz /= l; }
      else { nx = 0; ny = 1; nz = 0; }   // 兜底:退化法线给 -/+Y,避免写出 NaN
    }
    nor.push(nx, ny, nz);
    if (uvAttr) uv.push(uvAttr.getX(vi), uvAttr.getY(vi));
    else uv.push(0, 0);
  }
  return { pos, nor, uv, triCount: cornerCount / 3 };
}

// canvas 贴图 -> PNG 字节
function canvasPngBytes(image) {
  if (!image) return null;
  try {
    const c = document.createElement('canvas');
    c.width = image.width; c.height = image.height;
    c.getContext('2d').drawImage(image, 0, 0);
    const b64 = c.toDataURL('image/png').split(',')[1];
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch (e) { return null; }
}

// ============================================================
//  FBX 树(两种序列化共用)
//  节点: { id, props:[{t,v}], kids:[] }
//  类型:I=int32 D=float64 L=int64 S=string R=bytes B=bool
//       d=float64数组 i=int32数组
// ============================================================
const T = {
  I: v => ({ t: 'I', v }), D: v => ({ t: 'D', v }), L: v => ({ t: 'L', v }),
  S: v => ({ t: 'S', v }), R: v => ({ t: 'R', v }),
  // FBX 布尔属性的类型码是 'C'(单字节),不是 'B'。写成 'B' 会让 FBX SDK 解析失步,
  // 报 "File is corrupted"。取值按 SDK 惯例写 'T'(0x54) / 'F'(0x46)。
  B: v => ({ t: 'C', v: !!v }),
  d: v => ({ t: 'd', v }), i: v => ({ t: 'i', v }),
};
const N = (id, props = [], kids = []) => ({ id, props, kids });

function p70(name, type, label, flags, ...values) {
  return N('P', [T.S(name), T.S(type), T.S(label), T.S(flags), ...values]);
}

function buildFBXTree(scene, opts = {}) {
  const scale = opts.scale || EXPORT_SCALE_DEFAULT;
  const meshes = collectMeshes(scene);
  let id = 100000000;
  const nextId = () => ++id;

  const objects = [];       // 几何/模型/材质/贴图 节点
  const connections = [];   // [cType, from, to, propName?]
  const materials = new Map();
  const textures = new Map();

  for (const mesh of meshes) {
    const t = extractTriangles(mesh, scale);
    if (!t.triCount) continue;
    const name = mesh.name || 'part';
    const gid = nextId(), mid = nextId();

    // 多边形索引:三角形,每条多边形最后一个顶点取 -(i+1)
    const pvi = [];
    for (let f = 0; f < t.triCount; f++) {
      const a = f * 3;
      pvi.push(a, a + 1, -(a + 2 + 1));
    }

    const geom = N('Geometry', [T.L(gid), T.S(name + '\x00\x01' + 'Geometry'), T.S('Mesh')], [
      N('Vertices', [T.d(t.pos)]),
      N('PolygonVertexIndex', [T.i(pvi)]),
      N('GeometryVersion', [T.I(124)]),
      N('LayerElementNormal', [T.I(0)], [
        N('Version', [T.I(101)]),
        N('Name', [T.S('')]),
        N('MappingInformationType', [T.S('ByPolygonVertex')]),
        N('ReferenceInformationType', [T.S('Direct')]),
        N('Normals', [T.d(t.nor)]),
      ]),
      N('LayerElementUV', [T.I(0)], [
        N('Version', [T.I(101)]),
        N('Name', [T.S('UVMap')]),
        N('MappingInformationType', [T.S('ByPolygonVertex')]),
        N('ReferenceInformationType', [T.S('Direct')]),
        N('UV', [T.d(t.uv)]),
      ]),
      N('LayerElementMaterial', [T.I(0)], [
        N('Version', [T.I(101)]),
        N('Name', [T.S('')]),
        N('MappingInformationType', [T.S('AllSame')]),
        N('ReferenceInformationType', [T.S('IndexToDirect')]),
        N('Materials', [T.i([0])]),
      ]),
      N('Layer', [T.I(0)], [
        N('LayerElement', [], [N('Type', [T.S('LayerElementNormal')]), N('TypedIndex', [T.I(0)])]),
        N('LayerElement', [], [N('Type', [T.S('LayerElementMaterial')]), N('TypedIndex', [T.I(0)])]),
        N('LayerElement', [], [N('Type', [T.S('LayerElementUV')]), N('TypedIndex', [T.I(0)])]),
      ]),
    ]);
    objects.push(geom);
    connections.push(['OO', gid, mid]);          // 几何挂在模型下
    connections.push(['OO', mid, 0]);            // 模型挂到场景根(必需,否则不生成物体)

    const model = N('Model', [T.L(mid), T.S(name + '\x00\x01' + 'Model'), T.S('Mesh')], [
      N('Version', [T.I(232)]),
      N('Properties70', [], [
        p70('Lcl Translation', 'Lcl Translation', '', 'A', T.D(0), T.D(0), T.D(0)),
        p70('Lcl Rotation', 'Lcl Rotation', '', 'A', T.D(0), T.D(0), T.D(0)),
        p70('Lcl Scaling', 'Lcl Scaling', '', 'A', T.D(1), T.D(1), T.D(1)),
        p70('DefaultAttributeIndex', 'int', 'Integer', '', T.I(0)),
      ]),
      N('Shading', [T.B(true)]),
      N('Culling', [T.S('CullingOff')]),
    ]);
    objects.push(model);

    // 材质(按 uuid 去重)
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (mat) {
      const key = mat.uuid || mat.name || String(mat.color);
      if (!materials.has(key)) {
        const matId = nextId();
        const col = mat.color || { r: 0.8, g: 0.8, b: 0.8 };
        const emi = mat.emissive || { r: 0, g: 0, b: 0 };
        const rough = mat.roughness !== undefined ? mat.roughness : 0.6;
        const opacity = mat.opacity !== undefined ? mat.opacity : 1;
        const rec = {
          id: matId, name: mat.name || key.slice(0, 8),
          texName: null,
        };
        const matNode = N('Material', [T.L(matId), T.S(rec.name + '\x00\x01' + 'Material'), T.S('')], [
          N('Version', [T.I(102)]),
          N('ShadingModel', [T.S('phong')]),
          N('MultiLayer', [T.I(0)]),
          N('Properties70', [], [
            p70('DiffuseColor', 'Color', '', 'A', T.D(col.r), T.D(col.g), T.D(col.b)),
            p70('DiffuseFactor', 'Number', '', 'A', T.D(1)),
            p70('SpecularColor', 'Color', '', 'A', T.D(0.25), T.D(0.25), T.D(0.25)),
            p70('SpecularFactor', 'Number', '', 'A', T.D(0.15 + (mat.metalness || 0) * 0.6)),
            p70('ShininessExponent', 'Number', '', 'A', T.D(2 + (1 - rough) * 200)),
            p70('Shininess', 'Number', '', 'A', T.D(2 + (1 - rough) * 200)),
            p70('EmissiveColor', 'Color', '', 'A', T.D(emi.r), T.D(emi.g), T.D(emi.b)),
            p70('EmissiveFactor', 'Number', '', 'A', T.D(0)),
            p70('Opacity', 'Number', '', 'A', T.D(opacity)),
            p70('TransparencyFactor', 'Number', '', 'A', T.D(1 - opacity)),
          ]),
        ]);
        objects.push(matNode);
        materials.set(key, rec);
        if (mat.map && mat.map.image) {
          const png = canvasPngBytes(mat.map.image);
          if (png) {
            const texName = (mat.name || key.slice(0, 8)) + '.png';
            if (!textures.has(texName)) {
              const texId = nextId(), vid = nextId();
              objects.push(N('Texture', [T.L(texId), T.S(texName + '\x00\x01' + 'Texture'), T.S('')], [
                N('Type', [T.S('TextureVideoClip')]),
                N('Version', [T.I(202)]),
                N('TextureName', [T.S(texName + '\x00\x01' + 'Texture')]),
                N('Properties70', [], [
                  p70('UVSet', 'KString', '', '', T.S('UVMap')),
                  p70('UseMaterial', 'bool', '', '', T.B(true)),
                ]),
                N('Media', [T.S(texName + '\x00\x01' + 'Video')]),
                N('ModelUVTranslation', [T.D(0), T.D(0)]),
                N('ModelUVScaling', [T.D(1), T.D(1)]),
                N('FileName', [T.S(texName)]),
                N('RelativeFilename', [T.S(texName)]),
              ]));
              objects.push(N('Video', [T.L(vid), T.S(texName + '\x00\x01' + 'Video'), T.S('Clip')], [
                N('Type', [T.S('Clip')]),
                N('UseMipMap', [T.I(0)]),
                N('Filename', [T.S(texName)]),
                N('RelativeFilename', [T.S(texName)]),
                N('ImageSequence', [T.I(0)]),
                N('FrameRate', [T.I(0)]),
                N('LastFrame', [T.I(0)]),
                N('Width', [T.I(0)]),
                N('Height', [T.I(0)]),
              ]));
              textures.set(texName, { texId, vid, bytes: png });
            }
            rec.texName = texName;
          }
        }
        if (rec.texName) {
          const tx = textures.get(rec.texName);
          connections.push(['OP', tx.texId, matId, 'DiffuseColor']);
          connections.push(['OO', tx.vid, tx.texId]);
        }
      }
      const rec = materials.get(key);
      connections.push(['OO', rec.id, mid]);
    }
  }

  const now = new Date();
  const header = N('FBXHeaderExtension', [], [
    N('FBXHeaderVersion', [T.I(1003)]),
    N('FBXVersion', [T.I(7400)]),
    N('CreationTimeStamp', [], [
      N('Version', [T.I(1000)]),
      N('Year', [T.I(now.getFullYear())]),
      N('Month', [T.I(now.getMonth() + 1)]),
      N('Day', [T.I(now.getDate())]),
      N('Hour', [T.I(now.getHours())]),
      N('Minute', [T.I(now.getMinutes())]),
      N('Second', [T.I(now.getSeconds())]),
      N('Millisecond', [T.I(0)]),
    ]),
    N('Creator', [T.S('hikvision-cam fbx-exporter.js')]),
  ]);

  const globalSettings = N('GlobalSettings', [], [
    N('Version', [T.I(1000)]),
    N('Properties70', [], [
      p70('UpAxis', 'int', 'Integer', '', T.I(1)),          // Y-up(与 three.js 一致)
      p70('UpAxisSign', 'int', 'Integer', '', T.I(1)),
      p70('FrontAxis', 'int', 'Integer', '', T.I(2)),
      p70('FrontAxisSign', 'int', 'Integer', '', T.I(1)),
      p70('CoordAxis', 'int', 'Integer', '', T.I(0)),
      p70('CoordAxisSign', 'int', 'Integer', '', T.I(1)),
      p70('UnitScaleFactor', 'double', 'Number', '', T.D(100)), // 1 单位 = 1 米(FBX 内部基准厘米)
      p70('OriginalUnitScaleFactor', 'double', 'Number', '', T.D(100)),
    ]),
  ]);

  const defCount = objects.length + textures.size + 1;
  const definitions = N('Definitions', [], [
    N('Version', [T.I(100)]),
    N('Count', [T.I(defCount)]),
    N('ObjectType', [T.S('GlobalSettings')], [N('Count', [T.I(1)])]),
    N('ObjectType', [T.S('Model')], [N('Count', [T.I(meshes.filter(m => !m.userData.noExport).length)])]),
    N('ObjectType', [T.S('Geometry')], [N('Count', [T.I(objects.filter(o => o.id === 'Geometry').length)])]),
    N('ObjectType', [T.S('Material')], [N('Count', [T.I(materials.size)])]),
    N('ObjectType', [T.S('Texture')], [N('Count', [T.I(textures.size)])]),
    N('ObjectType', [T.S('Video')], [N('Count', [T.I(textures.size)])]),
  ]);

  const connNodes = connections.map(([ctype, from, to, prop]) =>
    N('C', [T.S(ctype), T.L(from), T.L(to), ...(prop ? [T.S(prop)] : [])]));

  // Documents / References / Takes:FBX SDK 期望这些顶层节点存在,缺了 Unity 会视为不完整文件
  const documents = N('Documents', [], [
    N('Count', [T.I(1)]),
    N('Document', [T.L(1000), T.S(''), T.S('Scene')], [
      N('Properties70', [], [
        N('P', [T.S('SourceObject'), T.S('object'), T.S(''), T.S('')]),
        N('P', [T.S('ActiveAnimStackName'), T.S('KString'), T.S(''), T.S('')]),
      ]),
      N('RootNode', [T.L(0)]),
    ]),
  ]);
  const references = N('References', [], []);
  const takes = N('Takes', [], [N('Current', [T.S('')])]);

  const root = N('', [], [
    header,
    N('FileId', [T.R(new Uint8Array([0x28, 0xb3, 0x2a, 0xeb, 0xb6, 0x24, 0xcc, 0xc2, 0xbf, 0xc8, 0xb0, 0x2a, 0xa9, 0x2b, 0xfc, 0xf1]))]),
    N('CreationTime', [T.S('1970-01-01 10:00:00:000')]),
    N('Creator', [T.S('threejstest fbx-exporter.js')]),
    globalSettings,
    documents,
    references,
    definitions,
    N('Objects', [], objects),
    N('Connections', [], connNodes),
    takes,
  ]);
  root.__textures = textures;
  return root;
}

// ---------- 二进制序列化(FBX 7.4:元素元数据 3×uint32,哨兵 13 字节) ----------
function serializeFBXBinary(root) {
  const enc = new TextEncoder();
  const parts = [];
  let length = 0;
  const push = (bytes) => { parts.push(bytes); length += bytes.length; };

  // 先算每个节点的结束偏移(深度优先,先序即写序)
  function calc(node, offset, isLast) {
    offset += 12;                         // 元数据
    offset += 1 + node.id.length;         // 名字
    let propsLen = 0;
    for (const p of node.props) propsLen += 1 + propDataLength(p);
    offset += propsLen;
    node._propLen = propsLen;
    if (node.kids.length) {
      let off = offset;
      for (let i = 0; i < node.kids.length; i++) off = calc(node.kids[i], off, i === node.kids.length - 1);
      off += 13;                          // 子节点哨兵
      offset = off;
    } else if (node.props.length === 0 && !isLast) {
      offset += 13;                       // 空节点哨兵
    }
    node._end = offset;
    return offset;
  }

  function propDataLength(p) {
    switch (p.t) {
      case 'C': return 1;
      case 'I': return 4;
      case 'F': return 4;
      case 'D': return 8;
      case 'L': return 8;
      case 'S': return 4 + enc.encode(p.v).length;   // 长度必须是 UTF-8 字节数(不能用 .length)
      case 'R': return 4 + p.v.length;
      case 'd': return 12 + p.v.length * 8;
      case 'i': return 12 + p.v.length * 4;
    }
    return 0;
  }

  function writeNode(node, isLast) {
    const head = new DataView(new ArrayBuffer(13));
    head.setUint32(0, node._end, true);
    head.setUint32(4, node.props.length, true);
    head.setUint32(8, node._propLen, true);
    head.setUint8(12, node.id.length);
    push(new Uint8Array(head.buffer));
    push(enc.encode(node.id));
    for (const p of node.props) writeProp(p);
    if (node.kids.length) {
      for (let i = 0; i < node.kids.length; i++) writeNode(node.kids[i], i === node.kids.length - 1);
      push(new Uint8Array(13));           // 哨兵
    } else if (node.props.length === 0 && !isLast) {
      push(new Uint8Array(13));
    }
  }

  function writeProp(p) {
    push(new Uint8Array([p.t.charCodeAt(0)]));
    const dv = n => new DataView(new ArrayBuffer(n));
    switch (p.t) {
      case 'C': { const b = new Uint8Array([p.v ? 0x54 : 0x46]); push(b); break; }   // 'T' / 'F'
      case 'I': { const d = dv(4); d.setInt32(0, p.v, true); push(new Uint8Array(d.buffer)); break; }
      case 'L': { const d = dv(8); d.setBigInt64(0, BigInt(p.v), true); push(new Uint8Array(d.buffer)); break; }
      case 'D': { const d = dv(8); d.setFloat64(0, p.v, true); push(new Uint8Array(d.buffer)); break; }
      case 'S': case 'R': {
        const bytes = p.t === 'S' ? enc.encode(p.v) : p.v;
        const d = dv(4); d.setUint32(0, bytes.length, true);
        push(new Uint8Array(d.buffer)); push(bytes); break;
      }
      case 'd': {
        const d = dv(12);
        d.setUint32(0, p.v.length, true); d.setUint32(4, 0, true); d.setUint32(8, p.v.length * 8, true);
        push(new Uint8Array(d.buffer));
        push(new Uint8Array(Float64Array.from(p.v).buffer)); break;
      }
      case 'i': {
        const d = dv(12);
        d.setUint32(0, p.v.length, true); d.setUint32(4, 0, true); d.setUint32(8, p.v.length * 4, true);
        push(new Uint8Array(d.buffer));
        push(new Uint8Array(Int32Array.from(p.v).buffer)); break;
      }
    }
  }

  // FBX 顶层是平铺元素序列(无包裹根),结尾一个 13 字节哨兵
  let topOff = 27;                          // 文件头 23 + 版本 4
  for (let i = 0; i < root.kids.length; i++) topOff = calc(root.kids[i], topOff, i === root.kids.length - 1);
  topOff += 13;
  push(enc.encode('Kaydara FBX Binary  \u0000\u001a\u0000'));
  const vd = new DataView(new ArrayBuffer(4));
  vd.setUint32(0, 7400, true);
  push(new Uint8Array(vd.buffer));
  for (let i = 0; i < root.kids.length; i++) writeNode(root.kids[i], i === root.kids.length - 1);
  push(new Uint8Array(13));                 // 根节点列表结束哨兵

  // ---- 文件尾(顺序与对齐都不可省,否则 FBX SDK 判定 "File is corrupted")----
  const bodyLen = length;                   // 含上面 13 字节哨兵
  const pad = 16 - ((bodyLen + 16) % 16);   // 1..16,保证总长是 16 的整数倍
  push(FBX_FOOTER_ID);                      // ① 16 字节固定 ID
  push(new Uint8Array(pad));                // ② 对齐填充
  push(new Uint8Array(4));                  // ③ 0u32
  const fv = new DataView(new ArrayBuffer(4));
  fv.setUint32(0, 7400, true);
  push(new Uint8Array(fv.buffer));          // ④ 版本重复
  push(new Uint8Array(120));                // ⑤ 保留区
  push(FBX_FOOTER_MAGIC);                   // ⑥ 结尾魔法字(文件最后 16 字节)

  const out = new Uint8Array(length);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

function exportFBX(scene, opts = {}) {
  const root = buildFBXTree(scene, opts);
  const bytes = serializeFBXBinary(root);
  const images = [];
  if (root.__textures) {
    for (const [name, t] of root.__textures) images.push({ name, bytes: t.bytes });
  }
  return { bytes, images };
}

// ============================================================
//  GLB (glTF 2.0 二进制,贴图内嵌)
// ============================================================
function exportGLB(scene, opts = {}) {
  const scale = opts.scale || EXPORT_SCALE_DEFAULT;
  const meshes = collectMeshes(scene);

  const binParts = [];
  let binLen = 0;
  const pad4 = n => (n + 3) & ~3;
  const pushBin = (bytes) => {
    const offset = binLen;
    binParts.push(bytes);
    binLen = pad4(binLen + bytes.byteLength);
    return { offset, length: bytes.byteLength };
  };

  const accessors = [], bufferViews = [], materialsJson = [], imagesJson = [], texturesJson = [];
  const meshesJson = [], nodesJson = [];
  const texIndexByMat = new Map();

  for (const mesh of meshes) {
    const t = extractTriangles(mesh, scale);
    if (!t.triCount) continue;
    const name = mesh.name || 'part';

    const indexArr = new Uint32Array(t.triCount * 3);
    for (let i = 0; i < indexArr.length; i++) indexArr[i] = i;
    const idxView = pushBin(new Uint8Array(indexArr.buffer));
    bufferViews.push({ buffer: 0, byteOffset: idxView.offset, byteLength: idxView.length, target: 34963 });

    const posView = pushBin(new Uint8Array(new Float32Array(t.pos).buffer));
    const norView = pushBin(new Uint8Array(new Float32Array(t.nor).buffer));
    const uvView = pushBin(new Uint8Array(new Float32Array(t.uv).buffer));
    bufferViews.push({ buffer: 0, byteOffset: posView.offset, byteLength: posView.length, target: 34962 });
    bufferViews.push({ buffer: 0, byteOffset: norView.offset, byteLength: norView.length, target: 34962 });
    bufferViews.push({ buffer: 0, byteOffset: uvView.offset, byteLength: uvView.length, target: 34962 });

    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < t.pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        mn[k] = Math.min(mn[k], t.pos[i + k]);
        mx[k] = Math.max(mx[k], t.pos[i + k]);
      }
    }

    const accBase = accessors.length;
    accessors.push({ bufferView: bufferViews.length - 4, componentType: 5125, count: indexArr.length, type: 'SCALAR' });
    accessors.push({ bufferView: bufferViews.length - 3, componentType: 5126, count: t.pos.length / 3, type: 'VEC3', min: mn, max: mx });
    accessors.push({ bufferView: bufferViews.length - 2, componentType: 5126, count: t.nor.length / 3, type: 'VEC3' });
    accessors.push({ bufferView: bufferViews.length - 1, componentType: 5126, count: t.uv.length / 2, type: 'VEC2' });

    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    let matIdx = 0;
    if (mat) {
      const key = mat.uuid || mat.name;
      if (!texIndexByMat.has(key)) {
        const col = mat.color || { r: 0.8, g: 0.8, b: 0.8 };
        const opacity = mat.opacity !== undefined ? mat.opacity : 1;
        const mj = {
          name: mat.name || key.slice(0, 8),
          pbrMetallicRoughness: {
            baseColorFactor: [col.r, col.g, col.b, opacity],
            metallicFactor: mat.metalness !== undefined ? mat.metalness : 0,
            roughnessFactor: mat.roughness !== undefined ? mat.roughness : 0.6,
          },
          doubleSided: mat.side === 2,
        };
        if (mat.emissive && (mat.emissive.r || mat.emissive.g || mat.emissive.b)) {
          mj.emissiveFactor = [mat.emissive.r, mat.emissive.g, mat.emissive.b];
        }
        if (mat.transparent && opacity < 1) mj.alphaMode = 'BLEND';
        if (mat.map && mat.map.image) {
          const png = canvasPngBytes(mat.map.image);
          if (png) {
            const v = pushBin(png);
            bufferViews.push({ buffer: 0, byteOffset: v.offset, byteLength: v.length });
            imagesJson.push({ name: mj.name + '_tex', mimeType: 'image/png', bufferView: bufferViews.length - 1 });
            texturesJson.push({ source: imagesJson.length - 1, sampler: 0 });
            mj.pbrMetallicRoughness.baseColorTexture = { index: texturesJson.length - 1 };
          }
        }
        materialsJson.push(mj);
        texIndexByMat.set(key, materialsJson.length - 1);
      }
      matIdx = texIndexByMat.get(key);
    }

    meshesJson.push({
      name,
      primitives: [{
        attributes: { POSITION: accBase + 1, NORMAL: accBase + 2, TEXCOORD_0: accBase + 3 },
        indices: accBase,
        material: matIdx,
      }],
    });
    nodesJson.push({ name, mesh: meshesJson.length - 1 });
  }

  const gltf = {
    asset: { version: '2.0', generator: 'hikvision-cam fbx-exporter.js' },
    scene: 0,
    scenes: [{ name: 'scene', nodes: nodesJson.map((_, i) => i) }],
    nodes: nodesJson,
    meshes: meshesJson,
    materials: materialsJson,
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    images: imagesJson,
    textures: texturesJson,
    bufferViews,
    accessors,
    buffers: [{ byteLength: binLen }],
  };

  const bin = new Uint8Array(binLen);
  let off = 0;
  for (const p of binParts) { bin.set(p, off); off += p.byteLength; off = (off + 3) & ~3; }

  // GLB chunks align by UTF-8 byte count, not JavaScript character count.
  // Chinese node/material names may take three bytes per character.
  const encodedJson = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonBytes = new Uint8Array(pad4(encodedJson.length));
  jsonBytes.fill(0x20);
  jsonBytes.set(encodedJson);

  const total = 12 + 8 + jsonBytes.length + 8 + bin.length;
  const out = new ArrayBuffer(total);
  const dv = new DataView(out);
  const u8 = new Uint8Array(out);
  let p = 0;
  dv.setUint32(p, 0x46546C67, true); p += 4;
  dv.setUint32(p, 2, true); p += 4;
  dv.setUint32(p, total, true); p += 4;
  dv.setUint32(p, jsonBytes.length, true); p += 4;
  dv.setUint32(p, 0x4E4F534A, true); p += 4;
  u8.set(jsonBytes, p); p += jsonBytes.length;
  dv.setUint32(p, bin.length, true); p += 4;
  dv.setUint32(p, 0x004E4942, true); p += 4;
  u8.set(bin, p);
  return new Uint8Array(out);
}
