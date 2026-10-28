// rugged-phone.js — 征服 CONQUEST 三防智能终端(IP-68 / 64MP AI CAMERA / NFC / RFID)
// 单位:厘米(cm)。整机 8.2(宽 X) × 16.6(高 Y) × 1.86(厚 Z,含橡胶护框)。
// 朝向:正面(棱纹面板 + 顶部亮面镜片区)朝 +Z,背面(三摄 / NFC / RFID / logo 牌)朝 −Z,上下 ±Y。
// 依据实拍正反两面反推的结构:
//   正面 —— 顶部亮面镜片区(前摄方窗 + 感光点) / 卡槽翻盖 + 长条槽 / 大面 45° 棱纹板
//            (左上大圆角包边、右侧竖条导轨、板上一条对角大沟槽) / 底部橡胶护块压印徽标
//   背面 —— 红色内嵌装饰线 / 左上三摄模组(64MP AI CAMERA + 闪光灯 + 双点感应窗 + NFC) /
//            中央主板盖(两侧竖棱纹翼板 + 四颗银螺丝) / 八角 logo 牌(征服 CONQUEST) /
//            RFID 印字与双弧 / IP-68 / 下部人字纹 / 周边黑螺丝
//   侧面 —— 右侧红电源键 + 蓝快捷键 + 黑音量键,左侧卡托橡胶塞,顶部蓝键与黑键,底部 Type-C
//   附件 —— 左上挂绳孔 + 编绳 + 印字织带(CONQUEST)
// 「查看内部」可透视外壳,露出主板 / 电池 / 摄像头模组 / RFID 天线线圈 / 扬声器 / 振子。
// THREE 由参数传入,便于 build-single.js 内联成单文件。
function buildRuggedPhone(THREE) {
  const group = new THREE.Group();
  group.name = 'conquest_rugged_phone';

  // ============================================================
  //  0. 关键尺寸(cm)
  // ============================================================
  const W = 8.20;               // 宽(X)
  const H = 16.60;              // 高(Y)
  const R = 1.15;               // 机身圆角
  const ZF = 0.79;              // 正面外表面
  const ZB = -0.86;             // 背面外表面
  const BUMP = 0.13;            // 橡胶护框外扩量

  // ============================================================
  //  1. 材质
  // ============================================================
  const mk = (name, color, opts) => {
    const m = new THREE.MeshStandardMaterial(Object.assign(
      { color: color, roughness: 0.72, metalness: 0.05 }, opts || {}));
    m.name = name;
    return m;
  };
  const matShell    = mk('shell_charcoal', 0x353a41, { roughness: 0.80, metalness: 0.04 });
  const matShellDk  = mk('shell_dark',     0x2c3037, { roughness: 0.84, metalness: 0.03 });
  const matPanel    = mk('panel_matte',    0x4a5059, { roughness: 0.74, metalness: 0.05 });
  const matPanelDk  = mk('panel_recess',   0x22262c, { roughness: 0.88, metalness: 0.02 });
  const matRubber   = mk('rubber_bumper',  0x24272c, { roughness: 0.94, metalness: 0.0 });
  const matRubberHi = mk('rubber_pad',     0x33383f, { roughness: 0.90, metalness: 0.0 });
  const matGloss    = new THREE.MeshPhysicalMaterial({
    color: 0x31363f, roughness: 0.18, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06
  });
  matGloss.name = 'front_glass_zone';
  const matBlack    = mk('plastic_black',  0x16181c, { roughness: 0.55, metalness: 0.10 });
  const matRed      = mk('accent_red',     0xd0301f, { roughness: 0.42, metalness: 0.08 });
  const matRedDk    = mk('accent_red_dark', 0x8a1a15, { roughness: 0.55 });
  const matBlue     = mk('accent_blue',    0x2358a8, { roughness: 0.42, metalness: 0.08 });
  const matSilver   = mk('trim_silver',    0xc3c8cf, { roughness: 0.22, metalness: 0.92 });
  const matScrew    = mk('screw_steel',    0xa8aeb6, { roughness: 0.30, metalness: 0.88 });
  const matScrewDk  = mk('screw_black',    0x101215, { roughness: 0.48, metalness: 0.55 });
  const matLensRing = mk('lens_ring',      0x2a2e34, { roughness: 0.28, metalness: 0.70 });
  const matLensGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0a1420, roughness: 0.06, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.04
  });
  matLensGlass.name = 'lens_glass';
  const matFlash = new THREE.MeshStandardMaterial({
    color: 0xf2f4f7, roughness: 0.28, metalness: 0.0,
    emissive: 0xbfc6cf, emissiveIntensity: 0.35
  });
  matFlash.name = 'flash_led';
  const matLogoEdge = mk('logo_plate_edge', 0xb6bcc4, { roughness: 0.30, metalness: 0.86 });
  // 内部件
  const matPcb      = mk('inner_pcb',      0x1f5c3a, { roughness: 0.80 });
  const matChip     = mk('inner_chip',     0x14171b, { roughness: 0.45, metalness: 0.28 });
  const matShield   = mk('inner_shield',   0xa9aeb4, { roughness: 0.32, metalness: 0.85 });
  const matBat      = mk('inner_battery',  0x2c3037, { roughness: 0.62, metalness: 0.18 });
  const matBatWrap  = mk('inner_battery_film', 0x3a4048, { roughness: 0.72 });
  const matWire     = mk('inner_cable',    0x3d2f26, { roughness: 0.85 });
  const matCoil     = mk('inner_rfid_coil', 0xb07a3a, { roughness: 0.38, metalness: 0.80 });

  // ============================================================
  //  2. 几何工具
  // ============================================================
  // 背面装配阶段置为 −1:实拍是"把机器翻过来看背面"的镜像坐标,装配时把 x 取负即可照实拍描述
  let MX = 1;

  // 圆角矩形采样点(四角可不同半径),中心在原点
  function rrPoints(w, h, rs, seg) {
    const S = seg || 7;
    const r = Array.isArray(rs) ? rs : [rs, rs, rs, rs];
    const cl = (v) => Math.max(0, v);
    const tl = cl(Math.min(r[0], w / 2, h / 2)), tr = cl(Math.min(r[1], w / 2, h / 2));
    const br = cl(Math.min(r[2], w / 2, h / 2)), bl = cl(Math.min(r[3], w / 2, h / 2));
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
    const pts = [];
    const arc = (cx, cy, rad, a0, a1) => {
      if (rad <= 0.0001) { pts.push(new THREE.Vector2(cx, cy)); return; }
      for (let i = 0; i <= S; i++) {
        const a = a0 + (a1 - a0) * (i / S);
        pts.push(new THREE.Vector2(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad));
      }
    };
    arc(x1 - br, y0 + br, br, -Math.PI / 2, 0);          // 右下
    arc(x1 - tr, y1 - tr, tr, 0, Math.PI / 2);           // 右上
    arc(x0 + tl, y1 - tl, tl, Math.PI / 2, Math.PI);     // 左上
    arc(x0 + bl, y0 + bl, bl, Math.PI, Math.PI * 1.5);   // 左下
    return pts;
  }
  const rrShape = (w, h, rs) => new THREE.Shape(rrPoints(w, h, rs));
  const rrHole = (w, h, rs) => new THREE.Path(rrPoints(w, h, rs).reverse());
  const ringShape = (ow, oh, ors, iw, ih, irs) => {
    const s = rrShape(ow, oh, ors);
    s.holes.push(rrHole(iw, ih, irs));
    return s;
  };
  // 45° 切角矩形(切角 c)
  function chamferShape(w, h, c) {
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
    return new THREE.Shape([
      new THREE.Vector2(x0 + c, y0), new THREE.Vector2(x1 - c, y0),
      new THREE.Vector2(x1, y0 + c), new THREE.Vector2(x1, y1 - c),
      new THREE.Vector2(x1 - c, y1), new THREE.Vector2(x0 + c, y1),
      new THREE.Vector2(x0, y1 - c), new THREE.Vector2(x0, y0 + c),
    ]);
  }
  // 正多边形(八角 logo 牌)
  function polyShape(rx, ry, n, rot) {
    const s = new THREE.Shape();
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i / n * Math.PI * 2;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      i ? s.lineTo(x, y) : s.moveTo(x, y);
    }
    s.closePath();
    return s;
  }

  // 沿 Z 拉伸的板。dir=+1:正面用,占 [zOut-thick, zOut];dir=-1:背面用,占 [zOut, zOut+thick]
  function plate(shape, thick, bevel, mat, name, x, y, zOut, dir, isShell) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thick, bevelEnabled: bevel > 0,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10
    });
    if (dir > 0) geo.translate(0, 0, -thick);
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x * MX, y, zOut);
    if (isShell) m.userData.shell = true;
    group.add(m);
    return m;
  }
  // 薄片(贴图面/印字面)。UV 以 cm 为单位,便于按 tile 平铺
  function face(shape, mat, name, x, y, zOut, dir, isShell) {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), mat);
    m.name = name;
    m.position.set(x * MX, y, zOut);
    if (dir < 0) m.rotation.y = Math.PI;
    if (isShell) m.userData.shell = true;
    group.add(m);
    return m;
  }
  function box(w, h, d, mat, name, x, y, z, isShell) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.name = name;
    m.position.set(x * MX, y, z);
    if (isShell) m.userData.shell = true;
    group.add(m);
    return m;
  }
  // 沿 Z 轴的圆柱,zOut 为外端面
  function cyl(rTop, rBot, len, mat, name, x, y, zOut, seg, dir, isShell) {
    const g = new THREE.CylinderGeometry(rTop, rBot, len, seg || 24);
    g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.name = name;
    m.position.set(x * MX, y, dir > 0 ? zOut - len / 2 : zOut + len / 2);
    if (isShell) m.userData.shell = true;
    group.add(m);
    return m;
  }
  // Canvas 程序化贴图
  function canvasTex(w, h, draw, name) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.name = name;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  // 印字贴图(透明底)
  function printMat(tex, name, rough) {
    const m = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, roughness: rough || 0.6, metalness: 0.0
    });
    m.name = name;
    return m;
  }

  // ============================================================
  //  3. 程序化贴图(棱纹 / 人字纹 / 印字)
  // ============================================================
  // 45° 棱纹:1 cm 一个 tile,内含 3 道棱;UV 以 cm 计 ⇒ repeat = 1/tile
  const RIB_TILE = 1.0;
  const ribTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3b424b'; g.fillRect(0, 0, w, h);
    for (let i = -2; i <= 3; i++) {
      const o = i * (w / 3);
      g.lineWidth = 6; g.strokeStyle = '#59626d';
      g.beginPath(); g.moveTo(o, h); g.lineTo(o + h, 0); g.stroke();
      g.lineWidth = 5; g.strokeStyle = '#22262c';
      g.beginPath(); g.moveTo(o + 7, h); g.lineTo(o + h + 7, 0); g.stroke();
    }
  }, 'rib_texture');
  ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping;
  ribTex.repeat.set(1 / RIB_TILE, 1 / RIB_TILE);
  const matRib = new THREE.MeshStandardMaterial({ map: ribTex, roughness: 0.80, metalness: 0.05 });
  matRib.name = 'rib_panel';

  // 竖向密棱(主板盖两侧翼板)
  const VRIB_TILE = 0.60;
  const vribTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#414851'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      g.fillStyle = '#59616c'; g.fillRect(x, 0, 6, h);
      g.fillStyle = '#22262c'; g.fillRect(x + 9, 0, 4, h);
    }
  }, 'vertical_rib_texture');
  vribTex.wrapS = vribTex.wrapT = THREE.RepeatWrapping;
  vribTex.repeat.set(1 / VRIB_TILE, 1 / VRIB_TILE);
  const matVRib = new THREE.MeshStandardMaterial({ map: vribTex, roughness: 0.84, metalness: 0.04 });
  matVRib.name = 'vertical_rib_panel';

  // 人字纹(背面下部)
  const HB_TILE = 0.72;
  const hbTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#464e58'; g.fillRect(0, 0, w, h);
    g.lineWidth = 7; g.lineCap = 'round';
    for (let r = 0; r < 9; r++) {
      for (let c = -1; c < 9; c++) {
        const cx = c * 32, cy = r * 32;
        g.strokeStyle = '#646d79';
        g.beginPath(); g.moveTo(cx, cy + 22); g.lineTo(cx + 16, cy + 6); g.lineTo(cx + 32, cy + 22); g.stroke();
        g.strokeStyle = '#1d2126';
        g.beginPath(); g.moveTo(cx, cy + 28); g.lineTo(cx + 16, cy + 12); g.lineTo(cx + 32, cy + 28); g.stroke();
      }
    }
  }, 'herringbone_texture');
  hbTex.wrapS = hbTex.wrapT = THREE.RepeatWrapping;
  hbTex.repeat.set(1 / HB_TILE, 1 / HB_TILE);
  const matHB = new THREE.MeshStandardMaterial({ map: hbTex, roughness: 0.86, metalness: 0.03 });
  matHB.name = 'herringbone_panel';

  // 八角 logo 牌:征服 / CONQUEST
  const logoTex = canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#101216'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b9bfc7'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#f0f2f5'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 128px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
    g.fillText('征 服', w / 2, h * 0.38);
    g.font = 'bold 60px "Helvetica Neue",Arial,sans-serif';
    g.fillText('CONQUEST', w / 2, h * 0.70);
  }, 'logo_conquest_plate');
  const matLogo = new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.42, metalness: 0.12 });
  matLogo.name = 'logo_conquest';

  // "64MP AI CAMERA"
  const camTex = canvasTex(512, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#c9ced5'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = 'bold 62px "Helvetica Neue",Arial,sans-serif';
    g.fillText('64MP AI', 4, h * 0.32);
    g.font = '600 48px "Helvetica Neue",Arial,sans-serif';
    g.fillText('CAMERA', 4, h * 0.74);
  }, 'print_camera_label');
  const matCamLabel = printMat(camTex, 'print_camera', 0.55);

  // NFC 图标 + 文字
  const nfcTex = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ccd1d7'; g.fillStyle = '#ccd1d7'; g.lineWidth = 13; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.arc(w * 0.30, h * 0.34, 20 + i * 19, -Math.PI / 3, Math.PI / 3); g.stroke();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 52px "Helvetica Neue",Arial,sans-serif';
    g.fillText('NFC', w * 0.56, h * 0.80);
  }, 'print_nfc');
  const matNfc = printMat(nfcTex, 'print_nfc', 0.55);

  // RFID + 左右双弧
  const rfidTex = canvasTex(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#6d757f'; g.fillStyle = '#6d757f'; g.lineWidth = 9; g.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.arc(w / 2 + s * 112, h / 2, 60 + i * 26, s > 0 ? -0.60 : Math.PI - 0.60, s > 0 ? 0.60 : Math.PI + 0.60);
        g.stroke();
      }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 64px "Helvetica Neue",Arial,sans-serif';
    g.fillText('RFID', w / 2, h / 2);
  }, 'print_rfid');
  const matRfid = printMat(rfidTex, 'print_rfid', 0.62);

  // IP-68
  const ipTex = canvasTex(256, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#6d757f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 58px "Helvetica Neue",Arial,sans-serif';
    g.fillText('IP-68', w / 2, h / 2);
  }, 'print_ip68');
  const matIp = printMat(ipTex, 'print_ip68', 0.62);

  // 织带印字(CONQUEST,纵向重复)
  const strapTex = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#101114'; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = '#c02a22'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 30px "Helvetica Neue",Arial,sans-serif';
    g.fillText('CONQUEST', 0, 0);
    g.restore();
  }, 'strap_print');
  strapTex.wrapS = strapTex.wrapT = THREE.RepeatWrapping;

  // ============================================================
  //  4. 中框 + 橡胶护框
  // ============================================================
  // 中框(「查看内部」时隐藏,透视内部)
  plate(rrShape(W - 0.50, H - 0.50, R - 0.03), 1.30, 0.10, matShell, 'body_frame', 0, 0, 0.65, 1, true);

  // 橡胶护框:外圈圆角矩形挖孔,前后各包 0.86
  {
    const outer = ringShape(W + BUMP * 2, H + BUMP * 2, R + BUMP, W - 0.52, H - 0.52, R - 0.04);
    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: 1.72, bevelEnabled: true, bevelThickness: 0.10, bevelSize: 0.10,
      bevelSegments: 2, curveSegments: 14
    });
    geo.translate(0, 0, -0.86);
    const m = new THREE.Mesh(geo, matRubber);
    m.name = 'rubber_bumper_frame';
    group.add(m);
  }
  // 顶边三处圆润护角凸包(实拍顶边三个凸起)
  [-2.45, 0, 2.45].forEach((x, i) => {
    const g = new THREE.CapsuleGeometry(0.30, 1.45, 6, 16);
    g.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(g, matRubber);
    m.name = 'bumper_bump_' + (i + 1);
    m.position.set(x, H / 2 + BUMP * 0.50, 0.10);
    m.scale.set(1, 1, 2.1);
    group.add(m);
  });

  // ============================================================
  //  5. 正面(+Z:棱纹面板一侧)
  // ============================================================
  plate(rrShape(W - 0.56, H - 0.56, R - 0.06), 0.14, 0.03, matShell, 'front_cover', 0, 0, ZF, 1, true);

  // 5.1 顶部亮面镜片区
  plate(rrShape(6.70, 2.30, [0.45, 0.45, 0.10, 0.10]), 0.07, 0.02, matGloss,
        'front_gloss_cap', 0, 6.62, ZF + 0.06, 1, true);
  box(0.55, 0.55, 0.04, matBlack, 'front_cam_window', -0.95, 6.95, ZF + 0.07, true);
  cyl(0.15, 0.15, 0.04, matLensGlass, 'front_sensor_dot', 1.05, 7.03, ZF + 0.09, 20, 1, true);
  box(6.90, 0.055, 0.02, matPanelDk, 'seam_top', 0, 5.42, ZF + 0.055, true);

  // 5.2 卡槽翻盖 + 长条槽 + 竖向分模线
  plate(rrShape(3.92, 1.42, 0.30), 0.12, 0.04, matShell, 'hatch_cover', -0.55, 3.96, ZF + 0.18, 1, true);
  box(3.30, 0.34, 0.10, matPanelDk, 'hatch_slot', -0.55, 3.08, ZF + 0.05, true);
  box(3.30, 0.06, 0.02, matBlack, 'hatch_slot_shadow', -0.55, 3.22, ZF + 0.08, true);
  box(0.055, 2.60, 0.02, matPanelDk, 'seam_vertical', 1.18, 4.36, ZF + 0.02, true);

  // 5.3 主棱纹面板(左上大圆角)
  const RIB = { w: 5.30, h: 8.70, cx: -0.62, cy: -2.00, rs: [2.30, 0.55, 0.55, 0.55] };
  const ribShape = rrShape(RIB.w, RIB.h, RIB.rs);
  face(ribShape, matRib, 'rib_front_panel', RIB.cx, RIB.cy, ZF + 0.045, 1, true);
  // 隆起包边
  plate(ringShape(RIB.w + 0.90, RIB.h + 0.90, [2.72, 1.02, 1.02, 1.02],
                  RIB.w + 0.06, RIB.h + 0.06, [2.33, 0.58, 0.58, 0.58]),
        0.11, 0.035, matPanel, 'rib_bezel', RIB.cx, RIB.cy, ZF + 0.14, 1, true);
  // 外侧沟槽线
  plate(ringShape(RIB.w + 1.56, RIB.h + 1.56, [3.06, 1.35, 1.35, 1.35],
                  RIB.w + 1.32, RIB.h + 1.32, [2.94, 1.23, 1.23, 1.23]),
        0.035, 0, matPanelDk, 'rib_groove_line', RIB.cx, RIB.cy, ZF + 0.055, 1, true);
  // 对角大沟槽
  {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.10, 12.4, 0.06), matPanelDk);
    m.name = 'rib_diagonal_groove';
    m.position.set(RIB.cx + 0.02, RIB.cy - 0.10, ZF + 0.05);
    m.rotation.z = -Math.PI / 4 * 0.92;
    m.userData.shell = true;
    group.add(m);
  }

  // 5.4 右侧竖条导轨 + 边沟
  plate(rrShape(1.02, 4.60, 0.30), 0.14, 0.04, matPanel, 'side_rail_plate', 2.86, -1.90, ZF + 0.16, 1, true);
  box(0.07, 4.90, 0.03, matPanelDk, 'side_rail_groove', 3.46, -1.90, ZF + 0.03, true);

  // 5.5 底部橡胶护块 + 压印徽标
  plate(rrShape(7.00, 1.62, 0.58), 0.22, 0.06, matRubberHi, 'bottom_rubber_pad', 0, -6.94, ZF + 0.22, 1, true);
  {
    const mMat = mk('mark_engrave', 0x0e1013, { roughness: 0.98 });
    const zMark = ZF + 0.305;
    [-0.62, 0, 0.62].forEach((dx, i) => box(0.36, 0.13, 0.05, mMat, 'mark_dash_' + (i + 1), dx, -6.50, zMark, true));
    // 双层人字
    [[0, 0.00], [1, -0.32]].forEach((layer) => {
      const li = layer[0], dy = layer[1];
      [-1, 1].forEach((s) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 0.06), mMat);
        b.name = 'mark_chevron_' + li + (s > 0 ? '_r' : '_l');
        b.position.set(s * 0.40, -7.06 + dy, zMark);
        b.rotation.z = s * Math.PI / 4;
        b.userData.shell = true;
        group.add(b);
      });
      box(0.22, 0.13, 0.055, mMat, 'mark_tip_' + li, 0, -7.35 + dy, zMark, true);
    });
    [-1, 1].forEach((s) => box(0.13, 0.58, 0.05, mMat, 'mark_bar_' + (s > 0 ? 'r' : 'l'), s * 0.78, -7.10, zMark, true));
  }

  // ============================================================
  //  6. 背面(−Z:摄像头 / logo 一侧)
  //  注:相机在 −Z 一侧时,屏幕右方对应世界 −X(左右镜像)。实拍是"把机器翻过来看背面",
  //      为了照实拍描述(画面右 = +X)直接写坐标,这一段把 MX 置 −1,装配工具会把 x 取负。
  // ============================================================
  MX = -1;
  plate(rrShape(W - 1.00, H - 1.00, R - 0.20), 0.21, 0.04, matShell, 'back_cover', 0, 0, ZB, -1, true);

  // 6.1 红色内嵌装饰线
  plate(ringShape(W - 1.24, H - 1.24, R - 0.32, W - 1.66, H - 1.66, R - 0.49),
        0.05, 0, matRed, 'red_trim_line', 0, 0, ZB - 0.015, -1, true);

  // 6.2 摄像头模组面板(上部大块 45° 切角面板)
  const CAM = { cx: -0.10, cy: 5.72 };
  plate(chamferShape(5.70, 3.16, 0.52), 0.18, 0.05, matPanelDk, 'camera_module_plate',
        -0.10, CAM.cy, ZB - 0.13, -1, true);
  // 一排三个环:两枚镜头 + 右侧补光/闪光灯(实拍为亮白发光体)
  const RING_Y = 6.22;
  [[-1.30, 0], [0, 0], [1.30, 1]].forEach((l) => {
    const x = l[0], isFlash = l[1];
    cyl(0.36, 0.36, 0.06, matLensGlass, 'cam_bezel_' + x, x, RING_Y, ZB - 0.18, 32, -1, true);
    // 蓝色装饰环(实拍三道环都带蓝灰描边)
    plate(ringShape(0.78, 0.78, 0.39, 0.64, 0.64, 0.32), 0.05, 0,
          mk('lens_ring_blue', 0x3d5a6b, { roughness: 0.35, metalness: 0.55 }),
          'cam_ring_' + x, x, RING_Y, ZB - 0.235, -1, true);
    if (isFlash) {
      cyl(0.21, 0.21, 0.07, matFlash, 'cam_flash', x, RING_Y, ZB - 0.26, 24, -1, true);
    } else {
      cyl(0.20, 0.22, 0.07, matLensGlass, 'cam_lens_' + x, x, RING_Y, ZB - 0.26, 28, -1, true);
      cyl(0.09, 0.09, 0.05, matBlack, 'cam_pupil_' + x, x, RING_Y, ZB - 0.30, 18, -1, true);
    }
  });
  // 下方一行:64MP AI CAMERA / 双点感应窗 / NFC
  {
    const g = new THREE.PlaneGeometry(1.75, 0.54);
    const m = new THREE.Mesh(g, matCamLabel);
    m.name = 'print_camera_64mp';
    m.position.set(-1.76 * MX, 4.86, ZB - 0.225);
    m.rotation.y = Math.PI;
    m.userData.shell = true;
    group.add(m);
  }
  plate(rrShape(1.00, 0.44, 0.22), 0.06, 0.02, matBlack, 'sensor_window', -0.02, 4.86, ZB - 0.20, -1, true);
  cyl(0.072, 0.072, 0.04, matRedDk, 'sensor_dot_a', -0.20, 4.86, ZB - 0.25, 16, -1, true);
  cyl(0.072, 0.072, 0.04, matRedDk, 'sensor_dot_b', 0.16, 4.86, ZB - 0.25, 16, -1, true);
  {
    const g = new THREE.PlaneGeometry(0.86, 0.86);
    const m = new THREE.Mesh(g, matNfc);
    m.name = 'print_nfc_icon';
    m.position.set(1.76 * MX, 4.84, ZB - 0.225);
    m.rotation.y = Math.PI;
    m.userData.shell = true;
    group.add(m);
  }

  // 6.3 中央主板盖
  const PLATE = { h: 8.55, cy: 0.42 };
  plate(rrShape(5.90, PLATE.h, 0.80), 0.22, 0.09, matPanel, 'main_plate', 0, PLATE.cy, ZB - 0.12, -1, true);
  // 两侧竖向棱纹翼板
  [-2.62, 2.62].forEach((x, i) => {
    face(rrShape(0.78, PLATE.h - 1.10, 0.16), matVRib,
         'plate_rib_wing_' + (i ? 'R' : 'L'), x, PLATE.cy, ZB - 0.125, -1, true);
  });
  // 八角 logo 牌(银边 + 黑底印字)
  // 银边(放大 0.10 的八角框)+ 黑底印字面
  plate(polyShape(1.52, 1.08, 8, Math.PI / 8), 0.10, 0.02, matLogoEdge,
        'logo_plate_edge', 0.06, 1.62, ZB - 0.235, -1, true);
  plate(polyShape(1.42, 0.98, 8, Math.PI / 8), 0.10, 0.02, matShellDk,
        'logo_plate_base', 0.06, 1.62, ZB - 0.30, -1, true);
  {
    const g = new THREE.PlaneGeometry(2.40, 1.68);
    const m = new THREE.Mesh(g, matLogo);
    m.name = 'logo_plate';
    m.position.set(0.06 * MX, 1.62, ZB - 0.335);
    m.rotation.y = Math.PI;
    m.userData.shell = true;
    group.add(m);
  }
  // RFID 印字 + IP-68 印字
  {
    const g = new THREE.PlaneGeometry(1.90, 0.95);
    const m = new THREE.Mesh(g, matRfid);
    m.name = 'print_rfid_marks';
    m.position.set(0.80 * MX, -0.30, ZB - 0.215);
    m.rotation.y = Math.PI;
    m.userData.shell = true;
    group.add(m);
  }
  {
    const g = new THREE.PlaneGeometry(1.15, 0.43);
    const m = new THREE.Mesh(g, matIp);
    m.name = 'print_ip68';
    m.position.set(0.30 * MX, -2.30, ZB - 0.215);
    m.rotation.y = Math.PI;
    m.userData.shell = true;
    group.add(m);
  }
  // 四颗银色螺丝
  [[-2.88, 3.92], [2.88, 3.92], [-2.52, -3.50], [2.24, -3.50]].forEach((p, i) => {
    cyl(0.19, 0.19, 0.10, matScrew, 'screw_silver_' + (i + 1), p[0], p[1], ZB - 0.25, 22, -1, true);
    cyl(0.10, 0.10, 0.04, matScrewDk, 'screw_silver_slot_' + (i + 1), p[0], p[1], ZB - 0.265, 12, -1, true);
  });

  // 6.4 下部人字纹板
  face(rrShape(6.40, 2.30, 0.62), matHB, 'back_herringbone', 0, -5.95, ZB - 0.03, -1, true);

  // 6.5 周边黑螺丝 / 扬声器缝 / 麦克风孔
  [[-1.05, 7.62], [1.05, 7.62], [-3.30, 6.85], [3.30, 6.85], [-3.55, 2.60], [3.55, 2.60], [-3.55, -2.20],
   [3.55, -2.20], [-3.30, -6.40], [3.30, -6.40], [0, 7.55], [0, -7.55]].forEach((p, i) => {
    cyl(0.12, 0.12, 0.07, matScrewDk, 'screw_black_' + (i + 1), p[0], p[1], ZB - 0.01, 14, -1, true);
  });
  [0, 1, 2, 3].forEach((i) => box(1.20, 0.09, 0.05, matBlack, 'speaker_slit_' + (i + 1), -1.55, -7.18 + i * 0.30, ZB - 0.02, true));
  cyl(0.08, 0.08, 0.05, matBlack, 'mic_hole', 2.40, -7.16, ZB - 0.02, 12, -1, true);

  MX = 1;                    // 背面件装配完毕,后续件回到机身坐标系

  // ============================================================
  //  7. 侧面 / 顶底 按键与接口
  // ============================================================
  // 侧键:圆角矩形沿 X 拉伸。dir=+1 向 +X 伸出,−1 向 −X
  function sideKey(y, len, alongZ, mat, name, xFace, dir) {
    const shape = rrShape(alongZ, len, Math.min(alongZ, len) * 0.42);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.16, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 2, curveSegments: 8
    });
    geo.translate(0, 0, -0.16);
    geo.rotateY(dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(xFace, y, 0.12);
    group.add(m);
    return m;
  }
  const sideR = W / 2 + BUMP;
  const sideL = -W / 2 - BUMP;
  sideKey(4.62, 0.82, 0.30, matRed, 'key_power', sideR - 0.10, 1);        // 红电源键
  sideKey(3.42, 0.95, 0.30, matBlue, 'key_scan', sideR - 0.10, 1);        // 蓝快捷键
  sideKey(1.55, 1.70, 0.26, matShellDk, 'key_volume', sideR - 0.09, 1);   // 黑音量键
  sideKey(2.20, 1.90, 0.22, matRubber, 'side_flap_left', sideL + 0.09, -1);   // 左侧卡托橡胶塞
  sideKey(-3.20, 0.80, 0.20, matShellDk, 'key_left_lower', sideL + 0.08, -1);

  // 顶边按键:蓝键 + 两个黑键
  [[0.95, matBlue, 1.15], [-1.30, matShellDk, 0.95], [-2.75, matShellDk, 0.85]].forEach((k, i) => {
    box(k[2], 0.46, 0.54, k[1], 'key_top_' + (i + 1), k[0], H / 2 + BUMP * 0.62, 0.10);
  });
  // 底部 Type-C + 螺丝
  box(1.46, 0.44, 0.30, matPanelDk, 'typec_shell', -0.10, -H / 2 - BUMP * 0.55, 0.06);
  box(1.05, 0.20, 0.12, matSilver, 'typec_tongue', -0.10, -H / 2 - BUMP * 0.72, 0.06);
  cyl(0.10, 0.10, 0.10, matScrewDk, 'bottom_screw_l', -2.85, -H / 2 - BUMP * 0.42, 0.06, 12, -1);
  cyl(0.10, 0.10, 0.10, matScrewDk, 'bottom_screw_r', 2.65, -H / 2 - BUMP * 0.42, 0.06, 12, -1);

  // ============================================================
  //  8. 挂绳孔 + 编绳 + 织带
  // ============================================================
  cyl(0.13, 0.13, 0.40, matPanelDk, 'lanyard_hole', -3.60, 7.28, 0.24, 16, -1);
  const cordPts = [
    new THREE.Vector3(-3.60, 7.28, 0.18),
    new THREE.Vector3(-4.18, 7.06, 0.30),
    new THREE.Vector3(-4.56, 6.32, 0.34),
    new THREE.Vector3(-4.72, 5.52, 0.30),
    new THREE.Vector3(-4.70, 4.92, 0.26),
  ];
  {
    const curve = new THREE.CatmullRomCurve3(cordPts);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 56, 0.055, 8, false), matScrewDk);
    m.name = 'lanyard_cord';
    group.add(m);
  }
  {
    const g = new THREE.CylinderGeometry(0.16, 0.16, 0.44, 18);
    g.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(g, matSilver);
    m.name = 'lanyard_clip';
    m.position.set(-4.70, 4.74, 0.26);
    group.add(m);
  }
  // 织带:沿曲线生成的带状网格,UV 沿长度平铺印字
  (function strap() {
    const pts = [
      new THREE.Vector3(-4.80, 4.48, 0.24),
      new THREE.Vector3(-5.06, 3.10, 0.20),
      new THREE.Vector3(-5.34, 1.50, 0.14),
      new THREE.Vector3(-5.58, -0.40, 0.08),
      new THREE.Vector3(-5.84, -2.40, 0.02),
      new THREE.Vector3(-6.08, -4.40, -0.04),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const N = 64, halfW = 0.55;
    const pos = [], uvs = [], idx = [];
    let acc = 0, prev = null;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(halfW);
      if (prev) acc += p.distanceTo(prev);
      prev = p;
      pos.push(p.x - side.x, p.y - side.y, p.z);
      pos.push(p.x + side.x, p.y + side.y, p.z);
      uvs.push(0, acc / 1.6, 1, acc / 1.6);
    }
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      map: strapTex, roughness: 0.88, metalness: 0.0, side: THREE.DoubleSide
    });
    mat.name = 'strap_webbing';
    const m = new THREE.Mesh(g, mat);
    m.name = 'lanyard_strap';
    group.add(m);
  })();

  // ============================================================
  //  9. 内部结构(「查看内部」可见)
  // ============================================================
  box(6.30, 11.20, 0.12, matPcb, 'inner_main_pcb', -0.10, 0.30, 0.16);
  box(2.10, 1.90, 0.06, matShield, 'inner_soc_shield', -0.60, 2.60, 0.25);
  box(1.70, 1.30, 0.06, matShield, 'inner_rf_shield', 1.35, 0.55, 0.25);
  box(1.20, 0.90, 0.10, matChip, 'inner_pmic', -1.95, -1.40, 0.22);
  // 主板正面的零散元件(「查看内部」正面视角不再是一片空板)
  box(0.70, 0.45, 0.09, matChip, 'inner_wifi_module', 2.10, -1.90, 0.21);
  box(0.55, 0.35, 0.08, matShield, 'inner_cap_block', -2.35, 0.30, 0.20);
  box(0.90, 0.60, 0.10, matChip, 'inner_usb_controller', 0.30, -5.20, 0.22);
  box(0.60, 0.40, 0.09, matShield, 'inner_audio_codec', -0.90, -4.60, 0.21);
  cyl(0.16, 0.16, 0.09, matChip, 'inner_button_dome', -2.60, 3.90, 0.22, 16, 1);
  // 屏幕背面(前面板内侧)
  box(6.40, 11.00, 0.08, matChip, 'inner_display_back', 0, 0.40, 0.62);
  // 电池
  box(6.10, 8.60, 0.52, matBat, 'inner_battery', -0.10, -2.20, -0.16);
  box(6.14, 0.10, 0.54, matBatWrap, 'inner_battery_tape', -0.10, 0.92, -0.16);
  box(0.90, 0.60, 0.08, matChip, 'inner_battery_pcb', 1.90, 2.05, -0.16);
  // 摄像头模组
  box(2.60, 2.40, 0.90, matChip, 'inner_camera_module', CAM.cx, CAM.cy, 0.06);
  cyl(0.28, 0.28, 0.26, matBlack, 'inner_lens_tube_1', 0.55, 5.88, 0.30, 18, -1);
  cyl(0.28, 0.28, 0.26, matBlack, 'inner_lens_tube_2', 1.50, 5.88, 0.30, 18, -1);
  // RFID 天线线圈(三层矩形线圈)
  [0, 1, 2].forEach((i) => {
    const w = 4.60 - i * 0.55, h = w * 1.35;
    plate(ringShape(w, h, 0.75, w - 0.16, h - 0.16, 0.68), 0.05, 0, matCoil,
          'inner_rfid_coil_' + (i + 1), 0.05, -0.30, -0.52 - i * 0.02, -1);
  });
  // 扬声器 / 振子 / 软板
  box(1.40, 0.90, 0.30, matChip, 'inner_speaker', -1.55, -6.10, -0.06);
  cyl(0.34, 0.34, 0.55, matChip, 'inner_vibrator', 1.85, -6.20, 0.10, 18, 1);
  box(0.10, 3.60, 0.09, matWire, 'inner_sidekey_flex', 3.30, 1.20, 0.10);
  box(0.09, 2.20, 0.06, matWire, 'inner_coax_1', 3.05, 4.60, 0.06);
  box(0.09, 2.20, 0.06, matWire, 'inner_coax_2', 2.85, 4.35, 0.02);
  box(1.90, 1.10, 0.08, matShellDk, 'inner_sim_tray', -2.30, 3.60, 0.14);

  return group;
}
