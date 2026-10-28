# 工业模型 3D 查看器(Three.js)

用 Three.js 程序化建模的工业产品查看器,可在浏览器里拖动旋转查看,
并支持一键导出 **FBX / GLB**,导入 Blender、Unity 使用。

当前内置模型(顶部下拉列表切换):

| 模型 | 文件 | 说明 |
|---|---|---|
| 海康威视枪机 | `app.js` | 枪式摄像机,含玻璃镜片/尾盖/遮罩等 ①–⑤ 轮廓修正 |
| RONK 工业UPS机柜 | `ronk-ups.js` | 新H型系列 340×720×855 mm,外观按三视图建模;内部三层:上/中层各 4 只 12V 蓄电池(96VDC)、下层电脑主机;「查看内部」按钮透视外壳,导出含隐藏外壳 |
| 海康威视网络音柱 | `hikvision-column-speaker.js` | 446.8×160×160 mm,弧面冲孔网罩、四单元扬声器阵列、壁挂支架与底部状态灯 |
| 数字万用表2 | `multimeter-2.js` | 按 FLUKE 117C 正反面实拍建模：黄色收腰护套、熄屏 LCD、大旋钮、三插孔及背面支架；尺寸为照片估算 |
| 空气检测仪 | `air-detector.js` | 按 UNI-T UT334G 正反面实拍建模：黑红收腰外壳、顶部采气嘴、灰色导航按键、背面金属夹与挂环；尺寸为照片估算 |
| 幼儿园墙挂相框 | `kindergarten-frame.js` | 约 88×64 cm，深棕木纹、暖橙内线、米白卡纸、绿叶角饰，配背板和挂件；独立节点与材质均命名为 `照片`，替换其材质或贴图即可换照片（70:46 比例） |

![预览](cam.html)

## 快速开始

```bash
npm install          # 安装 three(开发依赖)
npm start            # 零依赖静态服务器,默认端口 8889
# 打开 http://localhost:8889  (开发版:模块化,便于学习)
# 换端口:PORT=8890 npm start
# 也可用 python -m http.server 8889 / npx serve -l 8889
# 直接双击 cam.html 也可以(单文件版,无任何依赖)
```

> 默认端口选 8889 是为了避开常见的 8080(很多 MCP 服务占用)。

网页右上角两个按钮:

| 按钮 | 产物 | 用途 |
|---|---|---|
| 导出压缩包 | 一个 zip:`<模型id>.fbx` + 全部贴图 PNG + `<模型id>.glb` + `导入说明.txt` | Blender / Unity,整包解压即可 |
| 导出 GLB | `<模型id>.glb`(贴图内嵌单文件) | 单文件分发 / 任何 glTF 工具 |

> 早期版本点「导出 FBX」会连续触发 1 个模型 + N 张贴图的多个下载,浏览器还会弹「允许多文件下载」,
> 现改为在浏览器内就地打成 **一个 zip**(零依赖实现,见 `zip.js`),一次下载完成。

**Blender**:文件 → 导入 → FBX / glTF 2.0
**Unity**:解压后整个文件夹拖入 `Assets/`,或安装 glTFast 包后直接用 .glb

> 模型单位为米(整机约 0.2 m)。FBX 的 `UnitScaleFactor=100` 表示 1 单位 = 1 米。

### FBX 结构校验

导出器必须写出符合 FBX SDK 预期的完整结构,否则 Unity 会直接报
`File is corrupted`(Blender 容忍度高,看不出问题)。两处易错点已处理:

1. **文件尾(trailer)**:`FOOTER_ID` + 1~16 字节对齐填充 + `0u32` + 版本 + 120 字节保留区 + 16 字节魔法字,
   且文件总长必须是 16 的整数倍 —— 读取器从末尾回溯定位。
2. **布尔属性类型码是 `C`(单字节,取 `T`/`F`)**,不是 `B`。写错会让 SDK 解析失步。

改动后可运行 `python tools/fbx-strict.py <file.fbx>` 做属性级校验(逐属性核对长度与节点偏移),
不要只看节点数量。已验证:Unity 2022.3 导入成功(枪机 24 网格 / 10452 顶点,机柜 474 网格 / 33541 顶点)。

## 文件结构

| 文件 | 说明 |
|---|---|
| `index.html` | 开发版页面(加载模块化脚本 + 导出按钮) |
| `app.js` | **主体**:场景、灯光、相机交互、程序化建模(放样 loft + 圆角截面) |
| `hikvision-column-speaker.js` | 海康威视网络音柱程序化模型(外壳、冲孔网罩、内部单元和壁挂支架) |
| `fbx-exporter.js` | 导出模块:二进制 FBX 7.4 + GLB 写出器(零依赖,不依赖 three) |
| `zip.js` | 浏览器端零依赖 ZIP 打包器(CRC32 + deflate,不支持时自动退化为 store) |
| `serve.js` | 零依赖静态开发服务器,默认端口 8889(`npm start`) |
| `cam.html` | 构建产物:单文件版(内联 three.js 与全部脚本,双击即用) |
| `build-single.js` | 以 index.html 为模板,把所有脚本内联进 cam.html(`node build-single.js`) |
| `fix-collisions.js` | 构建后处理:消除 three 内部重名(`node fix-collisions.js`) |
| `vendor/` | three.js 模块副本(three.module.js + three.core.js) |
| `shot.js` | 自动截图验证脚本(Playwright,多角度渲染存图) |

## 技术要点(学习参考)

- **程序化建模**:没有外部模型文件,全部几何体用代码生成
  - `loftGeometry()` 放样:给定一串截面站位,把圆角矩形截面拉伸成机身/遮阳罩
  - `roundedRectOutline()` 生成圆角矩形截面轮廓
  - 罩檐前缘用逐点变形(`xOf/yOf/zOf/sFn`)做下垂、前伸、斜切收口
- **Canvas 程序化贴图**:logo、玻璃高光条纹都是 Canvas 2D 画出来再作纹理
- **交互**:指针拖动轨道旋转 + 滚轮缩放(自写极简 orbit,无 OrbitControls)
- **导出**:`fbx-exporter.js` 遍历场景收集网格,世界变换烘焙进顶点,再按
  FBX 二进制规范(参考 Blender 官方 `encode_bin.py`)写出;贴图从 canvas
  转 PNG 作为同名附件;GLB 按 glTF 2.0 规范打包(贴图内嵌)

## 构建流程

```bash
npm run build          # 等价于下面两步,顺序不可颠倒
node build-single.js   # 生成 cam.html(内联全部脚本)
node fix-collisions.js # 必须执行!消除 three 内部 7 处重名
```

## 如何添加新模型(模型下拉列表)

顶部工具栏有一个模型下拉列表。新增模型只需两步:

1. 在 `app.js` 里写一个构建函数,返回 `THREE.Group`:

```js
function buildMyModel() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
  mat.name = 'my_material';            // 材质命名会带到导出文件里
  group.add(new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), mat));
  return group;
}
```

2. 在 `MODELS` 注册表里登记一条:

```js
const MODELS = [
  { id: 'hikvision-bullet', name: '海康威视枪机', build: buildCamera },
  { id: 'my-model', name: '我的模型', build: buildMyModel },   // ← 新增
];
```

下拉列表会自动出现新选项;切换时自动取景(按包围球调整视距),
导出 FBX / GLB 导出的是当前选中的模型。

技巧:
- 不想导出的物体(背景、阴影地面)设 `mesh.userData.noExport = true`
- 网格自动补名(`材质名_序号`),也可以自己给 `mesh.name` 起名
- 材质设 `.name`,导出后 Blender / Unity 里按名字识别

## 常见问题

- **FBX 进 Blender 丢材质?** 把同目录的 `logo.png`、`glass_streak.png` 一起拷贝
- **尺寸不对?** 模型按米导出;若软件按厘米解释,整体缩放 0.01 即可
- **想要 ASCII FBX?** Blender 4.x 只支持二进制 FBX;如需调试格式可看
  `fbx-exporter.js` 中的树构建部分(`buildFBXTree`)
