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
| 征服 CONQUEST 三防终端 | `rugged-phone.js` | 8.2×16.6×1.86 cm(含橡胶护框);正面朝 +Z:顶部亮面镜片区、卡槽翻盖+长条槽、大面 45° 棱纹板(左上大圆角、右侧竖条导轨、对角沟槽)、底部橡胶护块压印徽标;背面朝 −Z:顶部 45° 切角三摄面板(64MP AI CAMERA / 双点感应窗 / NFC)、四螺丝主板盖(竖棱纹翼板)、八角「征服 CONQUEST」牌、RFID 双弧 + IP-68、下部人字纹;侧面红电源键/蓝快捷键/黑音量键、顶部蓝键、底部 Type-C,左上挂绳孔 + 编绳 + CONQUEST 织带;「查看内部」露出主板/电池/摄像头模组/RFID 天线线圈/扬声器 |
| HM-TPH11 手持热成像仪 | `thermal-imager.js` | 海康微影 H11(HM-TPH11-3AXF),221.7×73.5×80.5 mm;屏幕面朝 +X、镜头面朝 −X;九键键盘/侧板丝印/红外镜头组/握把棱纹/银色电池分界环;「查看内部」露出主控板·探测器·电芯 |

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

网页右上角四个按钮:

| 按钮 | 产物 | 用途 |
|---|---|---|
| 导入模型 | 把外部 FBX 加进下拉列表 | 见下文「导入外部 FBX」 |
| 查看内部 | 切换外壳显隐(仅内置模型) | 看内部结构 |
| 导出压缩包 | 一个 zip:`<模型id>.fbx` + 全部贴图 PNG + `<模型id>.glb` + `导入说明.txt` | Blender / Unity,整包解压即可 |
| 导出 GLB | `<模型id>.glb`(贴图内嵌单文件) | 单文件分发 / 任何 glTF 工具 |

> 早期版本点「导出 FBX」会连续触发 1 个模型 + N 张贴图的多个下载,浏览器还会弹「允许多文件下载」,
> 现改为在浏览器内就地打成 **一个 zip**(零依赖实现,见 `zip.js`),一次下载完成。

**Blender**:文件 → 导入 → FBX / glTF 2.0
**Unity**:解压后整个文件夹拖入 `Assets/`,或安装 glTFast 包后直接用 .glb

> 模型单位为米(整机约 0.2 m)。FBX 的 `UnitScaleFactor=100` 表示 1 单位 = 1 米。

## 导入外部 FBX

点「导入模型」,或把文件 / 整个文件夹 / zip 直接拖进页面:

- **接受**:`*.fbx` + 贴图(`png/jpg/webp/bmp/tga/tif`),或包含它们的 `*.zip`
- **整包拖入时**:自动解压,按文件名把 fbx 里引用的贴图(可能写成 `textures/a.png`、
  `C:\proj\a.png`)映射到内存文件;内嵌在 fbx 里的贴图也会被提取
- 导入后模型进入下拉列表(`导入 · <文件名>`),转台、自动取景、导出压缩包全部照旧
- 左侧面板可做「导入后修改」:
  - **位置 / 旋转 / 缩放**:相对导入状态的增量,缩放会同时改变导出尺寸
  - **部件列表**:474 个零件逐个勾选,取消勾选 = 不显示 且 **不进导出**;支持按名称筛选
  - 顶部一行显示部件数 / 三角面 / 材质数 / 实际尺寸,以及导入时做过的自动修正

导入链路上会做的自动处理(都在面板里写明):

| 情况 | 处理 |
|---|---|
| `UnitScaleFactor` ≠ 1 | 按该因子换算到厘米(three 的 FBXLoader 只记录不缩放) |
| 尺寸量级离谱(<1 或 >10000 cm) | 按 10 的整数次幂校正到常见量级 |
| 一个物体挂多个材质 | 按 geometry.groups 拆成独立部件(本项目导出器是「一网格一材质」) |
| 材质声明了顶点色但几何体没有 color 属性 | 关闭顶点色 —— 否则着色器乘 0,模型渲染成纯黑 |
| 材质/贴图重名 | 自动加序号,避免导出时贴图互相覆盖 |
| 贴图缺失 | 面板里列出缺哪几张,不会静默失败 |

> 导入用的是 three 官方 `FBXLoader`(已摊平到 `vendor/addons/`,无 CDN 依赖),
> 由 `node tools/vendor-addons.js` 从 `node_modules/three` 生成,升级 three 后重跑即可。

### 实测过的导入场景

| 文件 | 结果 |
|---|---|
| 本项目导出的 `hikvision-bullet.zip`(整包) | 24 部件 / 9,470 三角面 / 4 张贴图,尺寸 17.6×8.0×7.3 cm(原值) |
| 本项目导出的 `ronk-ups.fbx` + 9 张 PNG | 474 部件 / 36,418 三角面 / 42 材质,尺寸 90.8 cm 高 |
| 外部 `气动三联件.fbx`(usf=2.54,多材质) | 71 部件 / 11,116 面,自动拆 10 个多材质网格、关闭顶点色 |
| 外部 `手操器.fbx`(usf=0.1,平躺) | 1 部件 / 956 面,按最长边取景 |
| 外部 `BPS系统.fbx` / `AI、DO浪涌.fbx` | 正常导入,缺 1 张贴图时面板明确提示 |

导入 → 调整 → 导出 → Unity 2022.3 导入:24 网格 / 10,444 顶点 / 9,436 三角面,无 `corrupted` 报错。

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
| `importer.js` | 导入模块:解析外部 FBX(含 zip 解包、贴图路径映射、单位换算、多材质拆分、顶点色兜底) |
| `zip.js` | 浏览器端零依赖 ZIP 打包 / 解包(CRC32 + CompressionStream,不支持时退化为 store) |
| `serve.js` | 零依赖静态开发服务器,默认端口 8889(`npm start`) |
| `cam.html` | 构建产物:单文件版(内联 three.js 与全部脚本,双击即用) |
| `build-single.js` | 以 index.html 为模板,把所有脚本内联进 cam.html(`node build-single.js`) |
| `fix-collisions.js` | 构建后处理:消除 three 内部重名(`node fix-collisions.js`) |
| `vendor/` | three.js 模块副本(three.module.js + three.core.js) |
| `vendor/addons/` | three addons:FBXLoader + NURBS + fflate(`node tools/vendor-addons.js` 生成) |
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

- **导入进来是纯黑?** 面板提示「关闭顶点色」说明材料声明了顶点色但模型没有数据,已自动修;
  若仍发黑,多半是贴图没挂上(面板会列出缺失的文件名),把同名 PNG 一起选中/放进 zip 再导入
- **导入后尺寸不对?** 面板显示的实际尺寸是判据。按 `10^k` 手改「缩放」即可,导出会一起跟着变
- **导入的模型能直接再导出吗?** 能,流程和内置模型完全一致(导出压缩包 / 导出 GLB)
- **FBX 进 Blender 丢材质?** 把同目录的 `logo.png`、`glass_streak.png` 一起拷贝
- **尺寸不对?** 模型按米导出;若软件按厘米解释,整体缩放 0.01 即可
- **想要 ASCII FBX?** Blender 4.x 只支持二进制 FBX;如需调试格式可看
  `fbx-exporter.js` 中的树构建部分(`buildFBXTree`)
