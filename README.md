# 海康威视枪机 3D 模型(Three.js)

一个用 Three.js 程序化建模的海康威视枪式摄像机,可在浏览器里拖动旋转查看,
并支持一键导出 **FBX / GLB**,导入 Blender、Unity 使用。

![预览](cam.html)

## 快速开始

```bash
npm install          # 安装 three(开发依赖)
npx serve .          # 或 python3 -m http.server 8080
# 打开 http://localhost:8080  (开发版:模块化,便于学习)
# 直接双击 cam.html 也可以(单文件版,无任何依赖)
```

网页右上角两个按钮:

| 按钮 | 产物 | 用途 |
|---|---|---|
| 导出 FBX | `model.fbx` + 贴图 PNG | Blender / Unity(贴图 PNG 与 fbx 放同一目录) |
| 导出 GLB | `model.glb`(贴图内嵌单文件) | Blender / Unity / 任何 glTF 工具 |

**Blender**:文件 → 导入 → FBX / glTF 2.0
**Unity**:直接拖入工程(FBX),或安装 glTFast 包后直接用 .glb

> 模型单位为米(整机约 0.2 m)。FBX 的 `UnitScaleFactor=100` 表示 1 单位 = 1 米。

## 文件结构

| 文件 | 说明 |
|---|---|
| `index.html` | 开发版页面(加载模块化脚本 + 导出按钮) |
| `app.js` | **主体**:场景、灯光、相机交互、程序化建模(放样 loft + 圆角截面) |
| `fbx-exporter.js` | 导出模块:二进制 FBX 7.4 + GLB 写出器(零依赖,不依赖 three) |
| `cam.html` | 构建产物:单文件版(内联 three.js 与全部脚本,双击即用) |
| `build-single.js` | 把所有脚本内联进 cam.html 的构建脚本(`node build-single.js`) |
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
node build-single.js   # 生成 cam.html(内联全部脚本)
node fix-collisions.js # 必须执行!消除 three 内部 7 处重名
```

## 常见问题

- **FBX 进 Blender 丢材质?** 把同目录的 `logo.png`、`glass_streak.png` 一起拷贝
- **尺寸不对?** 模型按米导出;若软件按厘米解释,整体缩放 0.01 即可
- **想要 ASCII FBX?** Blender 4.x 只支持二进制 FBX;如需调试格式可看
  `fbx-exporter.js` 中的树构建部分(`buildFBXTree`)
