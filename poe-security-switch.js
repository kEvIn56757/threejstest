/**
 * DS-3E1526P-LAB 实验室视频安防系统 24口千兆 PoE+ + 2口千兆 SFP 机架式交换机
 * 适配 kEvIn56757/threejstest 仓库规范：直接导出 buildPoeSecuritySwitch(THREE)
 * 支持 fbx-exporter.js 无依赖二进制 FBX / GLB 导出
 */

function applyColorSpace(tex, THREE) {
      if (!tex) return tex;
      // 项目固定 three 0.186,只有 colorSpace(老的 sRGBEncoding 在 r152 之后已移除)
      if ('colorSpace' in tex && THREE.SRGBColorSpace) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      return tex;
    }

function makeRoundedRectShape(THREE, w, h, r) {
      const shape = new THREE.Shape();
      const hw = w / 2;
      const hh = h / 2;
      const cr = Math.min(r, hw, hh);
      shape.moveTo(-hw + cr, -hh);
      shape.lineTo(hw - cr, -hh);
      shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
      shape.lineTo(hw, hh - cr);
      shape.quadraticCurveTo(hw, hh, hw - cr, hh);
      shape.lineTo(-hw + cr, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
      shape.lineTo(-hw, -hh + cr);
      shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
      return shape;
    }

function createPowderCoatBumpTexture(THREE) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 118 + ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 28;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 5);
      return tex;
    }

function createFrontSilkscreenTexture(THREE) {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Base dark anodized aluminum brushed background
      const grad = ctx.createLinearGradient(0, 0, 2048, 256);
      grad.addColorStop(0, '#141820');
      grad.addColorStop(0.5, '#191e28');
      grad.addColorStop(1, '#12151c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 256);

      // Subtle horizontal brushed lines
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      for (let y = 0; y < 256; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      // Security Red Top Accent Line
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(24, 10, 2000, 7);

      // Left Branding & Model Identity
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(36, 30, 12, 34);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px Inter, Arial, sans-serif';
      ctx.fillText('LAB-SEC', 58, 55);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('DS-3E1526P-LAB', 58, 76);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.fillText('24-Port GE PoE+ Security Switch', 36, 96);

      // Console & Reset Labels (Left section)
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2;
      ctx.strokeRect(272, 38, 118, 176);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(272, 38, 118, 24);
      ctx.fillStyle = '#082f49';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('CONSOLE', 298, 55);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('115200 8N1', 293, 204);

      // System Status LED Legend Block
      const leds = ['PWR', 'SYS', 'PoE-MAX', 'ALM'];
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      leds.forEach((lbl, idx) => {
        const ly = 122 + idx * 24;
        ctx.fillText(lbl, 72, ly);
      });
      ctx.fillText('RST', 220, 195);

      // 3 Port Banks (Ports 1-8, 9-16, 17-24) Zone Headers & Port Numbers
      const bankConfigs = [
        { startPort: 1, xLeft: 590, title: 'PoE+ HIGH PRIORITY // PTZ & AI CAMERAS (PORTS 1-8)', color: '#f59e0b' },
        { startPort: 9, xLeft: 976, title: 'PoE+ STANDARD // LAB DOME CAMERAS (PORTS 9-16)', color: '#38bdf8' },
        { startPort: 17, xLeft: 1362, title: 'PoE+ PERIMETER & NVR LINK (PORTS 17-24)', color: '#10b981' }
      ];

      bankConfigs.forEach((b) => {
        const bw = 352;
        // Top Bracket & Zone Label
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.xLeft, 44);
        ctx.lineTo(b.xLeft, 30);
        ctx.lineTo(b.xLeft + bw, 30);
        ctx.lineTo(b.xLeft + bw, 44);
        ctx.stroke();

        ctx.fillStyle = b.color;
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText(b.title, b.xLeft + 8, 25);

        // Individual column numbers (4 columns per bank: odd top, even bottom)
        for (let col = 0; col < 4; col++) {
          const oddPort = b.startPort + col * 2;
          const evenPort = oddPort + 1;
          const cx = b.xLeft + 44 + col * 88;
          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.fillText(String(oddPort) + '▲', cx - 14, 58);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(String(evenPort) + '▼', cx - 14, 236);
        }
      });

      // Right Section: CCTV DIP Switch & Dual Gigabit SFP Uplinks
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(1742, 32, 118, 204);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('CCTV MODE', 1762, 50);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('1:250m EXT', 1752, 192);
      ctx.fillText('2:VLAN ISO', 1752, 206);
      ctx.fillText('3:WATCHDOG', 1752, 220);

      // SFP Uplinks Box
      ctx.strokeStyle = '#a855f7';
      ctx.strokeRect(1876, 32, 144, 204);
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText('1000M SFP', 1906, 52);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('G25/SFP1 ▲', 1902, 74);
      ctx.fillText('G26/SFP2 ▼', 1902, 224);

      const tex = new THREE.CanvasTexture(canvas);
      return applyColorSpace(tex, THREE);
    }

function createOledDisplayTexture(THREE, state) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const renderOled = (st) => {
        ctx.fillStyle = '#04080e';
        ctx.fillRect(0, 0, 512, 256);

        // Subtle cyan frame
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, 496, 240);

        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(8, 8, 496, 42);
        ctx.fillStyle = '#020617';
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText('PoE+ GUARD // TELEMETRY', 24, 37);

        // Wattage readout
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 46px "JetBrains Mono", monospace';
        ctx.fillText(st.watts.toFixed(1) + 'W', 26, 108);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillText('/ 370W MAX', 225, 108);

        // Progress Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(26, 126, 460, 22);
        const ratio = Math.min(1, st.watts / 370);
        const barGrad = ctx.createLinearGradient(26, 0, 486, 0);
        barGrad.addColorStop(0, '#10b981');
        barGrad.addColorStop(0.7, '#f59e0b');
        barGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = barGrad;
        ctx.fillRect(26, 126, Math.round(460 * ratio), 22);

        // Status Bottom Lines
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 21px "JetBrains Mono", monospace';
        ctx.fillText('IPC ONLINE: ' + st.cams + '/24   TEMP: 38.4C', 26, 186);

        const modes = [];
        if (st.dip[0]) modes.push('250m');
        if (st.dip[1]) modes.push('VLAN');
        if (st.dip[2]) modes.push('WDOG');
        if (st.dip[3]) modes.push('QoS');
        ctx.fillStyle = '#facc15';
        ctx.fillText('MODE: ' + (modes.length ? modes.join('+') : 'STANDARD L2'), 26, 224);
      };

      renderOled(state);
      const tex = new THREE.CanvasTexture(canvas);
      applyColorSpace(tex, THREE);
      tex.userData = { updateOled: (newState) => { renderOled(newState); tex.needsUpdate = true; } };
      return tex;
    }

function createTopAssetLabelTexture(THREE) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 1024, 512);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 992, 480);

      // Header Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 16, 992, 76);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(16, 16, 180, 76);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "JetBrains Mono", monospace';
      ctx.fillText('LAB-SEC', 34, 65);
      ctx.fillText('LABORATORY VIDEO SURVEILLANCE CORE SWITCH', 216, 65);

      // Specs Table
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('MODEL: DS-3E1526P-LAB (24×GE PoE+ + 2×GE SFP)', 42, 138);
      ctx.font = '21px "JetBrains Mono", monospace';
      ctx.fillText('• PoE STANDARD : IEEE 802.3af/at (Max 30W/Port, 370W Total Budget)', 42, 180);
      ctx.fillText('• VLAN SEGMENT : Video Lab VLAN 102 / Access Control VLAN 105', 42, 218);
      ctx.fillText('• SURGE PROTECT: 6kV Common-Mode Lightning Protection (All Ports)', 42, 256);
      ctx.fillText('• POWER INPUT  : 100-240V~ 50/60Hz 6.0A Max | Protective Earth Required', 42, 294);
      ctx.fillText('• ASSET ID     : LAB-BLDG-A3-RACK02-SW01    S/N: LS202610289941A', 42, 332);

      // High Voltage & ESD Warning Box
      ctx.fillStyle = '#facc15';
      ctx.fillRect(42, 366, 560, 102);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(42, 366, 560, 102);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px Inter, Arial, sans-serif';
      ctx.fillText('▲ CAUTION: HIGH POWER PoE+ & AC MAINS', 62, 408);
      ctx.font = '19px Inter, Arial, sans-serif';
      ctx.fillText('Verify rear earth grounding lug before powering IP cameras.', 62, 444);

      // Simulated Barcode
      ctx.fillStyle = '#0f172a';
      for (let x = 650; x < 968; x += 6) {
        const w = ((x * 7) % 5 === 0) ? 4 : 2;
        ctx.fillRect(x, 368, w, 74);
      }
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillText('*LAB-SW-3E1526P-2026*', 688, 464);

      const tex = new THREE.CanvasTexture(canvas);
      return applyColorSpace(tex, THREE);
    }

function createMainboardPcbTexture(THREE) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Deep emerald solder mask
      ctx.fillStyle = '#063927';
      ctx.fillRect(0, 0, 1024, 512);

      // Copper trace bus lines
      ctx.strokeStyle = '#107c55';
      ctx.lineWidth = 2;
      for (let i = 0; i < 65; i++) {
        const y = 30 + i * 7;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(520, y);
        ctx.lineTo(560, y + (i % 2 === 0 ? 18 : -18));
        ctx.lineTo(960, y + (i % 2 === 0 ? 18 : -18));
        ctx.stroke();
      }

      // Gold SMD pads & vias
      ctx.fillStyle = '#eab308';
      for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 28; c++) {
          ctx.fillRect(60 + c * 32, 40 + r * 32, 5, 5);
        }
      }

      // White PCB Silkscreen markings
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 984, 472);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText('REV 4.2 // LAB-SEC-26G-POE-MAINBOARD // RoHS COMPLIANT', 44, 480);

      const tex = new THREE.CanvasTexture(canvas);
      return applyColorSpace(tex, THREE);
    }

function createRearSilkscreenTexture(THREE, plateW, plateH) {
      const canvas = document.createElement('canvas');
      // 画布必须与面板同比例(原 2048×256 = 8:1,面板 10.3:1,文字被横向拉宽 29%)
      const PX_PER_CM = 46.7;
      const CW = plateW || 43.84;
      const CH = plateH || 4.24;
      canvas.width = Math.round(CW * PX_PER_CM);
      canvas.height = Math.round(CH * PX_PER_CM);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#181c24';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 后面板朝外的是 BoxGeometry 的 −Z 面,它的 UV 与画布左右相反:
      // 观察者站在机箱后方时世界 +X 落在画面左侧,对应画布 u=0。
      // 所以画布坐标必须用 0.5 − x/宽 反算 —— 直接按像素写会把标签印到面板另一头
      // (原来的 AC 电源标签就跑到了接地柱旁边、序列号压在了电源插座上)。
      const X = wx => (0.5 - wx / CW) * canvas.width;
      const Y = wy => (0.5 - wy / CH) * canvas.height;
      const label = (text, wx, wy, opt) => {
        const o = opt || {};
        ctx.save();
        ctx.font = (o.weight || 'bold') + ' ' + (o.px || 13) + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = o.color || '#cbd5e1';
        ctx.textAlign = o.align || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, X(wx), Y(wy));
        ctx.restore();
      };

      // —— 电源输入区:插座本体 x −17.1…−13.9、高 −1.22…+1.02,标签只能放它上下 ——
      label('AC INPUT', -15.5, 1.60, { px: 13, color: '#e2e8f0' });
      label('100-240V~ 50/60Hz 6.0A MAX', -15.5, -1.72, { px: 12, color: '#e2e8f0' });
      // 船型开关 x −13.2…−11.6、高 −1.15…+0.95
      label('POWER', -12.4, 1.60, { px: 13, color: '#e2e8f0' });

      // —— 双 40mm 风扇(x −4.1…−0.3 与 +2.3…+6.1,上下都只剩 0.2cm)——
      // 扇体上下的空位放不下一行字,任何压在此处的标签都会被扇框盖掉,
      // 所以只在扇体左侧空区写一条,指向这两台风扇
      // 注意:镜像映射下 canvas 的 textAlign 伸展方向是反的,
      // 这里一律用居中对齐 + 中心坐标,避免又压回扇框上
      label('EXHAUST ×2', -5.30, -1.45, { px: 13, color: '#94a3b8' });

      // —— 风扇与接地柱之间的空区(x +6.1…+13.9)——
      label('SERIAL: LS202610289941A', 10.0, 1.50, { px: 12, color: '#94a3b8' });
      label('6kV SURGE PROTECTION', 10.0, -1.50, { px: 12, color: '#facc15' });

      // —— 接地柱(x +14.8,washer φ0.68 占据 13.9…15.7):符号在柱右侧,文字再往右 ——
      const gx = X(16.75), gy = Y(-0.45);
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = Math.max(2, PX_PER_CM * 0.045);
      ctx.lineCap = 'round';
      [[0.34, -0.16], [0.23, 0.10], [0.12, 0.36]].forEach(([half, dy]) => {
        const y0 = gy + dy * PX_PER_CM;
        ctx.beginPath();
        ctx.moveTo(gx - half * PX_PER_CM, y0);
        ctx.lineTo(gx + half * PX_PER_CM, y0);
        ctx.stroke();
      });
      // 竖引线
      ctx.beginPath();
      ctx.moveTo(gx, gy - 0.38 * PX_PER_CM);
      ctx.lineTo(gx, gy - 0.16 * PX_PER_CM);
      ctx.stroke();
      ctx.restore();
      label('GND', 18.05, -0.45, { px: 13, color: '#facc15' });

      const tex = new THREE.CanvasTexture(canvas);
      return applyColorSpace(tex, THREE);
    }

function buildPoeSecuritySwitch(THREE, userOpts) {
      const opts = Object.assign({
        activePorts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 17, 24],
        pluggedCablePorts: [1, 2, 3, 5, 9, 17, 24],
        dipState: [true, true, true, false]
      }, userOpts || {});

      const root = new THREE.Group();
      root.name = 'DS3E1526P_LabSecuritySwitch';

      // Sub-groups for Exploded View & Modular Visibility
      const chassisBaseGroup = new THREE.Group();
      chassisBaseGroup.name = 'ChassisBaseGroup';
      const topCoverGroup = new THREE.Group();
      topCoverGroup.name = 'TopCoverGroup';
      const frontPanelGroup = new THREE.Group();
      frontPanelGroup.name = 'FrontPanelGroup';
      const rearPanelGroup = new THREE.Group();
      rearPanelGroup.name = 'RearPanelGroup';
      const rackEarsGroup = new THREE.Group();
      rackEarsGroup.name = 'RackEarsGroup';
      const internalsGroup = new THREE.Group();
      internalsGroup.name = 'InternalsGroup';
      const patchCablesGroup = new THREE.Group();
      patchCablesGroup.name = 'PatchCablesGroup';
      const sfpTransceiverGroup = new THREE.Group();
      sfpTransceiverGroup.name = 'SfpTransceiverGroup';

      root.add(
        chassisBaseGroup,
        topCoverGroup,
        frontPanelGroup,
        rearPanelGroup,
        rackEarsGroup,
        internalsGroup,
        patchCablesGroup,
        sfpTransceiverGroup
      );

      // Shared PBR Materials
      const bumpMap = createPowderCoatBumpTexture(THREE);

      const matChassisCoat = new THREE.MeshPhysicalMaterial({
        name: 'ChassisPowderCoatMat',
        color: 0x1e232b,
        metalness: 0.72,
        roughness: 0.42,
        bumpMap: bumpMap,
        bumpScale: 0.015,
        clearcoat: 0.14,
        clearcoatRoughness: 0.5
      });

      const matTopCoverCoat = new THREE.MeshPhysicalMaterial({
        name: 'TopCoverPowderCoatMat',
        color: 0x222730,
        metalness: 0.72,
        roughness: 0.40,
        bumpMap: bumpMap,
        bumpScale: 0.015,
        clearcoat: 0.16,
        clearcoatRoughness: 0.45,
        transparent: false,
        opacity: 1.0
      });

      const matRackEarMetal = new THREE.MeshPhysicalMaterial({
        name: 'RackEarHeavySteelMat',
        color: 0x181c23,
        metalness: 0.82,
        roughness: 0.36,
        clearcoat: 0.2
      });

      const matShieldNickel = new THREE.MeshPhysicalMaterial({
        name: 'NickelShieldMat',
        color: 0xcbd5e1,
        metalness: 0.92,
        roughness: 0.22,
        clearcoat: 0.3
      });

      const matGoldContact = new THREE.MeshPhysicalMaterial({
        name: 'GoldPlatedPinMat',
        color: 0xfbbf24,
        metalness: 0.96,
        roughness: 0.14
      });

      const matCopperBrass = new THREE.MeshPhysicalMaterial({
        name: 'BrassGroundingMat',
        color: 0xd97706,
        metalness: 0.90,
        roughness: 0.24
      });

      const matBlackLcp = new THREE.MeshStandardMaterial({
        name: 'BlackLcpPlasticMat',
        color: 0x111318,
        metalness: 0.15,
        roughness: 0.65
      });

      const matDarkRubber = new THREE.MeshStandardMaterial({
        name: 'VulcanizedRubberMat',
        color: 0x0f1115,
        metalness: 0.05,
        roughness: 0.88
      });

      const matHeatsinkAlum = new THREE.MeshPhysicalMaterial({
        name: 'AnodizedHeatsinkMat',
        color: 0x262b35,
        metalness: 0.88,
        roughness: 0.28
      });

      const matPsuAluminum = new THREE.MeshPhysicalMaterial({
        name: 'PsuGalvanizedAlumMat',
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.32
      });

      // Dimensions: W = 44.0 cm, H = 4.4 cm, D = 26.0 cm
      const W = 44.0;
      const H = 4.4;
      const D = 26.0;
      const wallT = 0.16;

      // Helper to tag inspection metadata on meshes
      function tagPart(mesh, title, desc, geoName, matName) {
        mesh.userData = Object.assign(mesh.userData || {}, {
          partTitle: title,
          partDesc: desc,
          geoType: geoName,
          matType: matName
        });
        return mesh;
      }

      // -----------------------------------------------------------------------
      // 1. LOWER U-CHASSIS BODY, SIDE LOUVERS & RUBBER FEET
      // -----------------------------------------------------------------------
      const uShape = new THREE.Shape();
      const hw = W / 2;
      const hh = H / 2;
      uShape.moveTo(-hw, hh - 0.15);
      uShape.lineTo(-hw, -hh + 0.12);
      uShape.quadraticCurveTo(-hw, -hh, -hw + 0.12, -hh);
      uShape.lineTo(hw - 0.12, -hh);
      uShape.quadraticCurveTo(hw, -hh, hw, -hh + 0.12);
      uShape.lineTo(hw, hh - 0.15);
      uShape.lineTo(hw - wallT, hh - 0.15);
      uShape.lineTo(hw - wallT, -hh + wallT);
      uShape.lineTo(-hw + wallT, -hh + wallT);
      uShape.lineTo(-hw + wallT, hh - 0.15);
      uShape.closePath();

      const uExtrude = new THREE.ExtrudeGeometry(uShape, {
        depth: D - 0.4,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2
      });
      uExtrude.translate(0, 0, -(D - 0.4) / 2);
      const uChassisMesh = new THREE.Mesh(uExtrude, matChassisCoat);
      uChassisMesh.name = 'Chassis_UBody_SheetMetal';
      uChassisMesh.castShadow = true;
      uChassisMesh.receiveShadow = true;
      tagPart(
        uChassisMesh,
        '1U 下机壳折弯冷轧钢板主体 (1.6mm SECC)',
        '采用 THREE.Shape + ExtrudeGeometry 构建 U 型折弯下机壳，表面覆盖深枪灰色静电粉末微纹理烤漆，具备优异的电磁屏蔽与结构刚性。',
        'Shape + ExtrudeGeometry',
        'MeshPhysicalMaterial (PowderCoat)'
      );
      chassisBaseGroup.add(uChassisMesh);

      // Side Recessed Cooling Louvers (Left & Right)
      const slotGeo = new THREE.BoxGeometry(0.12, 2.5, 0.26);
      const slotMat = new THREE.MeshBasicMaterial({ color: 0x05070a });
      for (let side of [-1, 1]) {
        // Two ventilation zones per side
        for (let zone = 0; zone < 2; zone++) {
          const zStart = -8.5 + zone * 10.5;
          for (let s = 0; s < 16; s++) {
            const slot = new THREE.Mesh(slotGeo, slotMat);
            slot.position.set(side * (hw - 0.02), -0.05, zStart + s * 0.46);
            slot.name = `SideVentSlot_${side > 0 ? 'R' : 'L'}_${zone}_${s}`;
            tagPart(
              slot,
              '侧面阵列冲孔百叶散热窗',
              '对称分布于机身两侧的双区 16 槽冲孔散热格栅，配合尾部双 40mm 风扇形成贯通式风道，保障 370W 满载 PoE 供电散热。',
              'BoxGeometry Array',
              'Recessed Cavity'
            );
            chassisBaseGroup.add(slot);
          }
        }
      }

      // 4 Bottom Anti-Slip Vulcanized Rubber Feet
      const footGeo = new THREE.CylinderGeometry(1.15, 1.0, 0.32, 24);
      const footRingGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.34, 16);
      const footCoords = [
        [-hw + 3.2, -hh - 0.16, D / 2 - 3.2],
        [hw - 3.2, -hh - 0.16, D / 2 - 3.2],
        [-hw + 3.2, -hh - 0.16, -D / 2 + 3.2],
        [hw - 3.2, -hh - 0.16, -D / 2 + 3.2]
      ];
      footCoords.forEach((fc, idx) => {
        const foot = new THREE.Mesh(footGeo, matDarkRubber);
        foot.position.set(fc[0], fc[1], fc[2]);
        foot.name = `RubberFoot_${idx + 1}`;
        foot.castShadow = true;
        tagPart(
          foot,
          '实验室桌面防滑减震橡胶脚垫',
          '高阻尼硫化橡胶脚垫，兼顾实验室桌面平放与机柜层板防滑需求。',
          'CylinderGeometry',
          'MeshStandardMaterial (Rubber)'
        );
        const washer = new THREE.Mesh(footRingGeo, matShieldNickel);
        washer.position.set(fc[0], fc[1] - 0.01, fc[2]);
        chassisBaseGroup.add(foot, washer);
      });

      // -----------------------------------------------------------------------
      // 2. REMOVABLE TOP COVER & LABORATORY ASSET SPEC LABEL
      // -----------------------------------------------------------------------
      const topPlateShape = makeRoundedRectShape(THREE, W - 0.08, D - 0.36, 0.25);
      const topExtrude = new THREE.ExtrudeGeometry(topPlateShape, {
        depth: 0.16,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 2
      });
      topExtrude.rotateX(Math.PI / 2);
      const topCoverMesh = new THREE.Mesh(topExtrude, matTopCoverCoat);
      topCoverMesh.position.set(0, hh, 0);
      topCoverMesh.name = 'Chassis_TopCover_Lid';
      topCoverMesh.castShadow = true;
      topCoverMesh.receiveShadow = true;
      tagPart(
        topCoverMesh,
        '可拆卸顶盖板与加强筋总成',
        '支持在右侧控制面板中调节透明度或爆炸拆解，表面贴有实验室资产管理铭牌与防触电警示标识。',
        'Shape + ExtrudeGeometry',
        'MeshPhysicalMaterial'
      );
      topCoverGroup.add(topCoverMesh);

      // Stamped stiffening ribs on top cover
      const ribGeo = new THREE.BoxGeometry(10.5, 0.06, 0.45);
      for (let r = -1; r <= 1; r += 2) {
        for (let z = -8; z <= 8; z += 8) {
          const rib = new THREE.Mesh(ribGeo, matTopCoverCoat);
          rib.position.set(r * 13.5, hh + 0.03, z);
          rib.name = `TopCover_StiffeningRib_${r}_${z}`;
          topCoverGroup.add(rib);
        }
      }

      // Top Laboratory Asset & Electrical Spec Label
      const topLabelTex = createTopAssetLabelTexture(THREE);
      const topLabelMat = new THREE.MeshStandardMaterial({
        name: 'TopAssetLabelMat',
        map: topLabelTex,
        roughness: 0.35,
        metalness: 0.1
      });
      const topLabelMesh = new THREE.Mesh(new THREE.PlaneGeometry(16.8, 8.4), topLabelMat);
      topLabelMesh.rotation.x = -Math.PI / 2;
      topLabelMesh.position.set(0, hh + 0.045, -1.2);
      topLabelMesh.name = 'TopCover_LabAssetLabel';
      tagPart(
        topLabelMesh,
        '实验室安防资产铭牌与参数标贴',
        '通过 HTML5 Canvas 动态生成的 1024×512 高清工程铭牌，包含设备型号、PoE+ 370W 功率预算、VLAN 规划、6kV 防雷等级及资产条形码。',
        'PlaneGeometry + CanvasTexture',
        'MeshStandardMaterial'
      );
      topCoverGroup.add(topLabelMesh);

      // -----------------------------------------------------------------------
      // 3. DETACHABLE 19-INCH RACK MOUNTING EARS & M4 SCREWS
      // -----------------------------------------------------------------------
      const screwHeadGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16);
      screwHeadGeo.rotateZ(Math.PI / 2);
      const screwSlotGeo1 = new THREE.BoxGeometry(0.05, 0.28, 0.05);
      const screwSlotGeo2 = new THREE.BoxGeometry(0.05, 0.05, 0.28);

      for (let side of [-1, 1]) {
        const earGroup = new THREE.Group();
        earGroup.name = side < 0 ? 'RackEar_Left' : 'RackEar_Right';

        // Side plate bolted to chassis (depth 4.2 cm along Z)
        const sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, H - 0.16, 4.2), matRackEarMetal);
        sidePlate.position.set(side * (hw + 0.13), 0, D / 2 - 2.3);
        tagPart(
          sidePlate,
          '19 英寸标准机柜 L 型金属挂耳',
          '厚 2.6mm 冷轧钢折弯机架挂耳，带标准 M6 椭圆机柜螺母孔与 4 颗沉头十字 M4 固定螺丝，可将交换机稳固安装于实验室安防机柜。',
          'ExtrudeGeometry + BoxGeometry',
          'MeshPhysicalMaterial (HeavySteel)'
        );
        earGroup.add(sidePlate);

        // Front flange with 2 U-notches for rack cage screws
        const flangeShape = new THREE.Shape();
        const fw = 2.25;
        const fh = H - 0.16;
        flangeShape.moveTo(0, -fh / 2);
        flangeShape.lineTo(fw - 0.2, -fh / 2);
        flangeShape.quadraticCurveTo(fw, -fh / 2, fw, -fh / 2 + 0.2);
        flangeShape.lineTo(fw, fh / 2 - 0.2);
        flangeShape.quadraticCurveTo(fw, fh / 2, fw - 0.2, fh / 2);
        flangeShape.lineTo(0, fh / 2);
        flangeShape.closePath();

        // Punch two oval rack mounting holes
        for (let hy of [-1.25, 1.25]) {
          const hole = new THREE.Path();
          hole.absellipse(1.15, hy, 0.46, 0.28, 0, Math.PI * 2, false, 0);
          flangeShape.holes.push(hole);
        }

        const flangeGeo = new THREE.ExtrudeGeometry(flangeShape, {
          depth: 0.26,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.03,
          bevelSegments: 2
        });
        const flangeMesh = new THREE.Mesh(flangeGeo, matRackEarMetal);
        if (side < 0) {
          flangeMesh.rotation.y = Math.PI;
          flangeMesh.position.set(-hw, 0, D / 2 - 0.12);
        } else {
          flangeMesh.position.set(hw, 0, D / 2 - 0.38);
        }
        flangeMesh.castShadow = true;
        tagPart(
          flangeMesh,
          '19 英寸机柜挂耳前法兰盘 (带椭圆安装孔)',
          '采用 THREE.Shape 配合 Path 挖孔拉伸而成，还原真实机架挂耳的双椭圆 M6 螺母安装孔位。',
          'Shape.holes + ExtrudeGeometry',
          'MeshPhysicalMaterial'
        );
        earGroup.add(flangeMesh);

        // 4× M4 Phillips Countersunk Screws on side plate
        const szList = [D / 2 - 1.1, D / 2 - 3.3];
        const syList = [-1.1, 1.1];
        szList.forEach((sz, zi) => {
          syList.forEach((sy, yi) => {
            const screw = new THREE.Mesh(screwHeadGeo, matShieldNickel);
            screw.position.set(side * (hw + 0.28), sy, sz);
            const cross1 = new THREE.Mesh(screwSlotGeo1, matBlackLcp);
            const cross2 = new THREE.Mesh(screwSlotGeo2, matBlackLcp);
            cross1.position.set(side * (hw + 0.32), sy, sz);
            cross2.position.set(side * (hw + 0.32), sy, sz);
            tagPart(screw, 'M4 十字沉头机架固定螺丝', '固定机架挂耳与机箱侧壁的高强度合金钢螺丝。', 'CylinderGeometry', 'NickelSteel');
            earGroup.add(screw, cross1, cross2);
          });
        });

        rackEarsGroup.add(earGroup);
      }

      // -----------------------------------------------------------------------
      // 4. FRONT BEZEL, SILK-SCREEN FACEPLATE, OLED DISPLAY, RJ45 & SFP PORTS
      // -----------------------------------------------------------------------
      const frontZ = D / 2;

      // Outer Chamfered Bezel Frame
      const bezelShape = makeRoundedRectShape(THREE, W + 0.06, H + 0.04, 0.22);
      const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
        depth: 0.45,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.06,
        bevelSegments: 3
      });
      bezelGeo.translate(0, 0, -0.22);
      const bezelMesh = new THREE.Mesh(bezelGeo, matChassisCoat);
      bezelMesh.position.set(0, 0, frontZ);
      bezelMesh.name = 'FrontBezel_MainFrame';
      bezelMesh.castShadow = true;
      tagPart(
        bezelMesh,
        '前面板倒角装饰边框与防尘面板',
        '带 45° 精密导角的铝合金/工程塑胶前面板总成，集成端口限位框与顶部安防红装饰条。',
        'ExtrudeGeometry (3-Seg Bevel)',
        'MeshPhysicalMaterial'
      );
      frontPanelGroup.add(bezelMesh);

      // Front Silk-Screen Faceplate
      const frontSilkTex = createFrontSilkscreenTexture(THREE);
      const frontSilkMat = new THREE.MeshStandardMaterial({
        name: 'FrontSilkscreenMat',
        map: frontSilkTex,
        roughness: 0.38,
        metalness: 0.35
      });
      const faceplateMesh = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.3, H - 0.3), frontSilkMat);
      faceplateMesh.position.set(0, 0, frontZ + 0.295);
      faceplateMesh.name = 'FrontPanel_SilkscreenPlate';
      tagPart(
        faceplateMesh,
        '2K 高清安防分区丝印铝拉丝面板',
        '运行时通过 2048×256 HTML5 Canvas 渲染拉丝金属底纹、海康工业风红线标识、PTZ 高优供电区/普通监控区/NVR 上联区分色框线及端口编号。',
        'PlaneGeometry + 2K CanvasTexture',
        'MeshStandardMaterial'
      );
      frontPanelGroup.add(faceplateMesh);

      // System Status LEDs on Left (PWR, SYS, PoE-MAX, ALM) + Reset Pinhole
      const sysLedGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12);
      sysLedGeo.rotateX(Math.PI / 2);
      const sysLedColors = [0x10b981, 0x22c55e, 0xf59e0b, 0x334155];
      sysLedColors.forEach((col, i) => {
        const isLit = i < 3;
        const lMat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: isLit ? col : 0x000000,
          emissiveIntensity: isLit ? 0.9 : 0.0,
          roughness: 0.2
        });
        const lMesh = new THREE.Mesh(sysLedGeo, lMat);
        lMesh.position.set(-20.6, 0.65 - i * 0.42, frontZ + 0.31);
        lMesh.name = `Front_SysLED_${i + 1}`;
        frontPanelGroup.add(lMesh);
      });

      // Recessed Reset Pinhole & PoE Display Mode Button
      const rstRing = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), matShieldNickel);
      rstRing.rotation.x = Math.PI / 2;
      rstRing.position.set(-17.2, -0.95, frontZ + 0.3);
      const rstHole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12), matBlackLcp);
      rstHole.rotation.x = Math.PI / 2;
      rstHole.position.set(-17.2, -0.95, frontZ + 0.31);
      tagPart(rstRing, '防误触内凹 Reset 复位孔', '需使用卡针长按 5 秒恢复实验室交换机出厂 VLAN 配置。', 'CylinderGeometry', 'Nickel + LCP');
      frontPanelGroup.add(rstRing, rstHole);

      // RJ45 Console Management Port (Left Side)
      const consoleCage = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.45, 1.6), matShieldNickel);
      consoleCage.position.set(-14.9, 0.1, frontZ - 0.42);
      const consoleInner = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.05, 1.5), matBlackLcp);
      consoleInner.position.set(-14.9, 0.1, frontZ - 0.34);
      const consolePinGeo = new THREE.BoxGeometry(0.05, 0.32, 0.6);
      for (let p = 0; p < 8; p++) {
        const pin = new THREE.Mesh(consolePinGeo, matGoldContact);
        pin.position.set(-14.9 - 0.42 + p * 0.12, 0.42, frontZ + 0.05);
        frontPanelGroup.add(pin);
      }
      tagPart(
        consoleCage,
        'RS-232 RJ45 Console 命令行配置口',
        '供实验室网管通过串口线连接配置 VLAN、802.1X 认证、IGMP Snooping 视频组播与 PoE 供电策略。',
        'BoxGeometry + 8 Gold Pins',
        'Shielded Metal + Gold'
      );
      frontPanelGroup.add(consoleCage, consoleInner);

      // Front OLED Real-Time PoE Telemetry Screen (Between Console & Port Bank 1)
      const oledState = {
        watts: opts.activePorts.length * 12.025,
        cams: opts.activePorts.length,
        dip: opts.dipState.slice()
      };
      const oledTex = createOledDisplayTexture(THREE, oledState);
      const oledHousing = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.85, 0.35), matBlackLcp);
      oledHousing.position.set(-11.45, 0.05, frontZ + 0.22);
      const oledScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(3.15, 1.6),
        new THREE.MeshBasicMaterial({ map: oledTex })
      );
      oledScreen.position.set(-11.45, 0.05, frontZ + 0.405);
      const oledGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 1.65),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.18,
          roughness: 0.05,
          metalness: 0.1,
          clearcoat: 1.0
        })
      );
      oledGlass.position.set(-11.45, 0.05, frontZ + 0.415);
      tagPart(
        oledScreen,
        'OLED 实时 PoE 功率与温度监控屏',
        '动态 Canvas 驱动的高对比度 OLED 面板，实时显示当前在线摄像头路数、PoE 总功耗（192.4W/370W）、机箱温度及当前拨码开关工作模式。',
        'PlaneGeometry + Dynamic CanvasTexture',
        'Emissive + Acrylic Glass'
      );
      frontPanelGroup.add(oledHousing, oledScreen, oledGlass);

      // -----------------------------------------------------------------------
      // 5. 24× GIGABIT PoE+ RJ45 PORTS (3 Banks × 8 Ports with 192 Gold Pins)
      // -----------------------------------------------------------------------
      const bankCenterXs = [-5.4, 2.95, 11.3];
      const portPinGeo = new THREE.BoxGeometry(0.04, 0.24, 0.55);
      const portCavityGeo = new THREE.BoxGeometry(1.26, 0.86, 1.35);
      const portLatchGeo = new THREE.BoxGeometry(0.46, 0.22, 1.36);
      const portLedGeo = new THREE.BoxGeometry(0.24, 0.13, 0.08);

      const animatedPortLeds = [];
      const portPositionsMap = {}; // portNumber (1..24) -> { x, y, z, isTopRow }

      bankCenterXs.forEach((bx, bankIdx) => {
        const bankGroup = new THREE.Group();
        bankGroup.name = `RJ45_Bank_${bankIdx + 1}`;

        // Outer Stainless Steel EMI Shield Block for 2×4 Stacked Ports
        const shieldBox = new THREE.Mesh(new THREE.BoxGeometry(7.45, 2.52, 1.75), matShieldNickel);
        shieldBox.position.set(bx, -0.02, frontZ - 0.45);
        tagPart(
          shieldBox,
          `第 ${bankIdx + 1} 组 8 口千兆 PoE+ 屏蔽模块 (Ports ${bankIdx * 8 + 1}-${bankIdx * 8 + 8})`,
          '工业级全金属 EMI 电磁屏蔽双层堆叠 RJ45 座，内置 6kV 防雷击浪涌保护，单口支持 IEEE 802.3at 30W 大功率红外球机供电。',
          'Stacked Modular Group (192 Pins)',
          'Stainless Steel EMI Shield'
        );
        bankGroup.add(shieldBox);

        // Front Metallic Partition Bezel
        const shieldFace = new THREE.Mesh(new THREE.BoxGeometry(7.48, 2.54, 0.12), matShieldNickel);
        shieldFace.position.set(bx, -0.02, frontZ + 0.30);
        bankGroup.add(shieldFace);

        // 4 Columns × 2 Rows = 8 Ports per Bank
        for (let col = 0; col < 4; col++) {
          const px = bx - 2.68 + col * 1.785;
          for (let row = 0; row < 2; row++) {
            const isTop = row === 0;
            const portNum = bankIdx * 8 + col * 2 + (isTop ? 1 : 2);
            const py = isTop ? 0.58 : -0.62;

            portPositionsMap[portNum] = { x: px, y: py, z: frontZ + 0.32, isTop: isTop };

            // Inner black RJ45 socket cavity
            const cavity = new THREE.Mesh(portCavityGeo, matBlackLcp);
            cavity.position.set(px, py, frontZ - 0.25);
            cavity.name = `RJ45_Port_${portNum}_Cavity`;
            tagPart(
              cavity,
              `Port ${portNum} 千兆 PoE+ RJ45 端口内腔`,
              `第 ${portNum} 号千兆供电端口（${portNum <= 8 ? 'PTZ 云台高优先级端口' : portNum <= 16 ? '实验室半球摄像机端口' : '门禁与 NVR 级联端口'}），内含 8 根镀金磷青铜触针。`,
              'BoxGeometry + Stepped Latch',
              'LCP + 24K Gold Contacts'
            );
            bankGroup.add(cavity);

            // Latch T-slot notch
            const latch = new THREE.Mesh(portLatchGeo, matBlackLcp);
            latch.position.set(px, py + (isTop ? 0.44 : -0.44), frontZ - 0.24);
            bankGroup.add(latch);

            // 8 Gold-Plated Phosphor-Bronze Contact Pins per port
            const pinY = py + (isTop ? -0.26 : 0.26);
            for (let p = 0; p < 8; p++) {
              const pin = new THREE.Mesh(portPinGeo, matGoldContact);
              pin.position.set(px - 0.385 + p * 0.11, pinY, frontZ + 0.06);
              bankGroup.add(pin);
            }

            // Dual Status LEDs per Port (Left = Link/Act Green, Right = PoE Power Amber)
            const isOnline = opts.activePorts.indexOf(portNum) !== -1;
            const ledY = py + (isTop ? 0.55 : -0.55);

            const linkMat = new THREE.MeshStandardMaterial({
              color: isOnline ? 0x22c55e : 0x1e293b,
              emissive: isOnline ? 0x16a34a : 0x000000,
              emissiveIntensity: isOnline ? 1.1 : 0.0,
              roughness: 0.2
            });
            const poeMat = new THREE.MeshStandardMaterial({
              color: isOnline ? 0xf59e0b : 0x1e293b,
              emissive: isOnline ? 0xd97706 : 0x000000,
              emissiveIntensity: isOnline ? 0.95 : 0.0,
              roughness: 0.2
            });

            const linkLed = new THREE.Mesh(portLedGeo, linkMat);
            linkLed.position.set(px - 0.42, ledY, frontZ + 0.34);
            const poeLed = new THREE.Mesh(portLedGeo, poeMat);
            poeLed.position.set(px + 0.42, ledY, frontZ + 0.34);

            if (isOnline) {
              animatedPortLeds.push({ mesh: linkLed, mat: linkMat, phase: portNum * 1.37 });
            }
            bankGroup.add(linkLed, poeLed);
          }
        }

        frontPanelGroup.add(bankGroup);
      });

      // -----------------------------------------------------------------------
      // 6. 4-POSITION SECURITY CCTV DIP SWITCH BANK (Right of Port Bank 3)
      // -----------------------------------------------------------------------
      const dipGroup = new THREE.Group();
      dipGroup.name = 'CCTV_DipSwitchBank';
      const dipHousing = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 1.55, 0.32),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45, metalness: 0.1 })
      );
      dipHousing.position.set(16.75, 0.32, frontZ + 0.24);
      tagPart(
        dipHousing,
        '安防专用 4 位硬件 DIP 拨码开关座',
        '无需登录后台即可硬件开启：1-250米超远距离安防供电传输、2-VLAN 端口隔离防广播风暴、3-PoE 智能看门狗自动重启死机摄像头、4-视频流 VIP 优先队列。',
        'BoxGeometry + Moving Actuators',
        'Red Industrial Nylon + White Actuators'
      );
      dipGroup.add(dipHousing);

      const dipActuators = [];
      const actuatorGeo = new THREE.BoxGeometry(0.24, 0.32, 0.18);
      const actuatorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const slotTrackGeo = new THREE.BoxGeometry(0.28, 0.82, 0.08);
      for (let d = 0; d < 4; d++) {
        const dx = 16.75 - 0.54 + d * 0.36;
        const track = new THREE.Mesh(slotTrackGeo, matBlackLcp);
        track.position.set(dx, 0.32, frontZ + 0.37);
        const act = new THREE.Mesh(actuatorGeo, actuatorMat);
        const isUp = opts.dipState[d];
        act.position.set(dx, 0.32 + (isUp ? 0.20 : -0.20), frontZ + 0.44);
        act.name = `DIP_Switch_Actuator_${d + 1}`;
        tagPart(act, `DIP 拨码开关 #${d + 1} 白色拨杆`, '可在右侧控制面板中点击切换 ON/OFF 档位，3D 拨杆位置将实时上下联动。', 'BoxGeometry', 'White ABS');
        dipActuators.push(act);
        dipGroup.add(track, act);
      }
      frontPanelGroup.add(dipGroup);

      // -----------------------------------------------------------------------
      // 7. 2× GIGABIT SFP FIBER CAGES & REMOVABLE LC OPTICAL TRANSCEIVER
      // -----------------------------------------------------------------------
      const sfpX = 19.75;
      const sfpCageOuter = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.48, 2.2), matShieldNickel);
      sfpCageOuter.position.set(sfpX, -0.02, frontZ - 0.65);
      tagPart(
        sfpCageOuter,
        '双千兆 SFP 光纤上联笼子 (G25/SFP1 & G26/SFP2)',
        '用于通过单模/多模光纤将实验室监控汇聚流高速上传至核心机房 NVR 存储矩阵，彻底隔离电磁干扰。',
        'BoxGeometry + EMI Finger Springs',
        'Stainless Steel Cage'
      );
      frontPanelGroup.add(sfpCageOuter);

      // Lower SFP2 Empty Cage Cavity + Removable Rubber Dust Plug
      const sfp2Cavity = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.95, 1.9), matBlackLcp);
      sfp2Cavity.position.set(sfpX, -0.62, frontZ - 0.40);
      const sfp2DustCap = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.88, 0.45), matDarkRubber);
      sfp2DustCap.position.set(sfpX, -0.62, frontZ + 0.40);
      const sfp2PullTab = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.42), matDarkRubber);
      sfp2PullTab.position.set(sfpX, -0.62, frontZ + 0.72);
      tagPart(sfp2DustCap, 'SFP2 光口 EPDM 防尘橡胶塞', '未启用光口标配带拉环的防尘塞，防止实验室粉尘污染光口金手指。', 'BoxGeometry', 'EPDM Rubber');
      frontPanelGroup.add(sfp2Cavity, sfp2DustCap, sfp2PullTab);

      // Upper SFP1 Inserted 1000BASE-LX Dual-LC Optical Transceiver Module (in sfpTransceiverGroup)
      const sfpBody = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.92, 2.6), matShieldNickel);
      sfpBody.position.set(sfpX, 0.58, frontZ + 0.15);
      tagPart(
        sfpBody,
        '1000BASE-LX 1310nm 单模双纤 LC 光模块 (SFP1)',
        '支持热插拔的千兆光模块，带蓝色阳极氧化铝合金解锁拉环（Bail Clasp）、双工 LC 陶瓷插芯与黄色单模尾纤护套。',
        'BoxGeometry + Cylinder Ferrules',
        'Anodized Alum + Ceramic'
      );
      sfpTransceiverGroup.add(sfpBody);

      // Blue Anodized Bail Clasp Handle
      const bailMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, metalness: 0.75, roughness: 0.25 });
      const bailTop = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.14, 0.45), bailMat);
      bailTop.position.set(sfpX, 0.96, frontZ + 1.48);
      const bailLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.14), bailMat);
      bailLeft.position.set(sfpX - 0.68, 0.66, frontZ + 1.56);
      const bailRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.14), bailMat);
      bailRight.position.set(sfpX + 0.68, 0.66, frontZ + 1.56);
      const bailFrontBar = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.16, 0.14), bailMat);
      bailFrontBar.position.set(sfpX, 0.32, frontZ + 1.62);
      sfpTransceiverGroup.add(bailTop, bailLeft, bailRight, bailFrontBar);

      // Dual LC Ceramic Ferrules & Yellow Single-Mode Fiber Boots
      const ferruleGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.55, 16);
      ferruleGeo.rotateX(Math.PI / 2);
      const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15 });
      const fiberYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
      for (let lc of [-0.36, 0.36]) {
        const fer = new THREE.Mesh(ferruleGeo, ceramicMat);
        fer.position.set(sfpX + lc, 0.58, frontZ + 1.52);
        sfpTransceiverGroup.add(fer);

        // Curved fiber optic patch cord tail
        const fCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sfpX + lc, 0.58, frontZ + 1.65),
          new THREE.Vector3(sfpX + lc, 0.45, frontZ + 2.85),
          new THREE.Vector3(sfpX + lc + 0.35, -0.35, frontZ + 4.1),
          new THREE.Vector3(sfpX + lc + 0.85, -1.5, frontZ + 4.9)
        ]);
        const fTube = new THREE.Mesh(new THREE.TubeGeometry(fCurve, 20, 0.12, 12, false), fiberYellowMat);
        tagPart(fTube, 'OS2 单模双工 LC 光纤跳线', '采用 CatmullRomCurve3 + TubeGeometry 生成的自然垂落单模黄色光纤跳线。', 'TubeGeometry (Spline)', 'PVC Jacket');
        sfpTransceiverGroup.add(fTube);
      }

      // -----------------------------------------------------------------------
      // 8. PLUGGED CAT6 RJ45 PATCH CABLES WITH TRANSLUCENT PLUGS & BOOTS
      // -----------------------------------------------------------------------
      const crystalMat = new THREE.MeshPhysicalMaterial({
        name: 'PolycarbonateRJ45PlugMat',
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.68,
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 1.0
      });

      const cablePalette = {
        1: { color: 0xef4444, label: '红色网线 (1号口: 实验室大门 PTZ 红外球机)' },
        2: { color: 0x3b82f6, label: '蓝色网线 (2号口: 光学实验台高清枪机)' },
        3: { color: 0x3b82f6, label: '蓝色网线 (3号口: 危化品柜近景半球机)' },
        5: { color: 0x3b82f6, label: '蓝色网线 (5号口: 洁净室走廊监控)' },
        9: { color: 0x06b6d4, label: '青色网线 (9号口: 生物样本库全景相机)' },
        17: { color: 0xf59e0b, label: '黄色网线 (17号口: 实验室人脸识别门禁主机)' },
        24: { color: 0x10b981, label: '绿色网线 (24号口: 实验室本地 NVR 录像机级联)' }
      };

      opts.pluggedCablePorts.forEach((pNum) => {
        const pInfo = portPositionsMap[pNum];
        if (!pInfo) return;
        const cCfg = cablePalette[pNum] || { color: 0x3b82f6, label: `Cat6 PoE+ 监控网线 (Port ${pNum})` };
        const bootMat = new THREE.MeshStandardMaterial({
          color: cCfg.color,
          roughness: 0.48,
          metalness: 0.08
        });

        // Translucent Polycarbonate RJ45 Plug Body
        const plugBody = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.78, 1.35), crystalMat);
        plugBody.position.set(pInfo.x, pInfo.y, frontZ + 0.58);
        tagPart(
          plugBody,
          `RJ45 透明PC水晶头 (${cCfg.label})`,
          '高透聚碳酸酯水晶头，内置 8 芯镀金压接刀片与弹性防脱卡扣，配合彩色护套区分实验室不同监控回路。',
          'BoxGeometry + TubeGeometry',
          'Translucent Polycarbonate'
        );

        // Angled Locking Latch Clip on crystal plug
        const latchClip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.95), crystalMat);
        latchClip.position.set(pInfo.x, pInfo.y + (pInfo.isTop ? 0.46 : -0.46), frontZ + 0.68);
        latchClip.rotation.x = pInfo.isTop ? 0.18 : -0.18;

        // Molded Strain-Relief Boot
        const bootBody = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.84, 1.15), bootMat);
        bootBody.position.set(pInfo.x, pInfo.y, frontZ + 1.48);

        // Curved Cat6 Cable Tail
        const bendDir = (pNum % 2 === 0) ? -1 : 1;
        const cCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(pInfo.x, pInfo.y, frontZ + 1.95),
          new THREE.Vector3(pInfo.x, pInfo.y - 0.18 * bendDir, frontZ + 3.2),
          new THREE.Vector3(pInfo.x + 0.25, pInfo.y - 0.95, frontZ + 4.35),
          new THREE.Vector3(pInfo.x + 0.45, pInfo.y - 1.85, frontZ + 5.1)
        ]);
        const cTube = new THREE.Mesh(new THREE.TubeGeometry(cCurve, 18, 0.28, 12, false), bootMat);
        tagPart(cTube, cCfg.label, 'Cat6 无氧铜千兆 PoE+ 供电网线，采用三维样条曲线 TubeGeometry 生成自然弯曲走线。', 'TubeGeometry (CatmullRomCurve3)', 'LSZH Low-Smoke Jacket');

        patchCablesGroup.add(plugBody, latchClip, bootBody, cTube);
      });

      // -----------------------------------------------------------------------
      // 9. REAR PANEL: IEC C14 AC SOCKET, ROCKER SWITCH, 2× 40mm FANS & GROUND LUG
      // -----------------------------------------------------------------------
      const rearZ = -D / 2;
      const rearSilkTex = createRearSilkscreenTexture(THREE, W - 0.16, H - 0.16);
      const rearPlate = new THREE.Mesh(
        new THREE.BoxGeometry(W - 0.16, H - 0.16, 0.22),
        new THREE.MeshStandardMaterial({ map: rearSilkTex, roughness: 0.45, metalness: 0.65 })
      );
      rearPlate.position.set(0, 0, rearZ + 0.11);
      rearPlate.name = 'RearPanel_MainPlate';
      tagPart(
        rearPlate,
        '后面板总成（电源输入、双散热风扇与防雷接地端）',
        '集成宽幅交流电源接口、船型电源开关、双 40mm 轴流排风扇、防雷浪涌状态窗及纯铜滚花接地柱。',
        'BoxGeometry + CanvasTexture',
        'Powder-Coated Steel'
      );
      rearPanelGroup.add(rearPlate);

      // IEC C14 AC Inlet Socket + 3 Brass Blades (Rear Left, X = -15.5)
      const iecHousing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.25, 0.9), matBlackLcp);
      iecHousing.position.set(-15.5, -0.1, rearZ + 0.22);
      const iecCavity = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.65, 0.55), new THREE.MeshBasicMaterial({ color: 0x050608 }));
      iecCavity.position.set(-15.5, -0.1, rearZ - 0.04);
      tagPart(
        iecHousing,
        'IEC C14 三芯品字交流电源插座 (100-240V~)',
        '内置 L/N/PE 三根黄铜扁插片与保险丝仓，支持机房 PDU 防脱电源线接入。',
        'BoxGeometry + 3 Brass Blades',
        'Flame-Retardant PBT + Brass'
      );
      rearPanelGroup.add(iecHousing, iecCavity);

      const bladeGeo = new THREE.BoxGeometry(0.14, 0.48, 0.65);
      const bladeOffsets = [[-0.65, -0.22], [0.65, -0.22], [0, 0.32]];
      bladeOffsets.forEach((bo) => {
        const blade = new THREE.Mesh(bladeGeo, matCopperBrass);
        blade.position.set(-15.5 + bo[0], -0.1 + bo[1], rearZ - 0.02);
        rearPanelGroup.add(blade);
      });

      // Illuminated Red Rocker Power Switch
      const swHousing = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.1, 0.45), matBlackLcp);
      swHousing.position.set(-12.4, -0.1, rearZ + 0.02);
      const swRocker = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 1.65, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.45, roughness: 0.3 })
      );
      swRocker.position.set(-12.4, -0.1, rearZ - 0.14);
      swRocker.rotation.x = 0.18;
      tagPart(swRocker, '带灯船型主电源开关', '带暗红背光的工业级大电流船型电源开关。', 'BoxGeometry', 'Illuminated Polycarbonate');
      rearPanelGroup.add(swHousing, swRocker);

      // 2× 40mm High-Speed Axial Cooling Fans (Rear Center, X = -2.2 and +4.2)
      const fanRotors = [];
      const fanXs = [-2.2, 4.2];
      fanXs.forEach((fx, fIdx) => {
        const fanGroup = new THREE.Group();
        fanGroup.name = `RearExhaustFan_${fIdx + 1}`;
        fanGroup.position.set(fx, -0.05, rearZ + 0.18);

        // Outer fan frame
        const fFrame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.8, 1.2), matBlackLcp);
        fFrame.position.set(0, 0, 0.45);
        fanGroup.add(fFrame);

        // Dark circular tunnel
        const fTunnel = new THREE.Mesh(
          new THREE.CylinderGeometry(1.72, 1.72, 1.25, 28),
          new THREE.MeshBasicMaterial({ color: 0x070a0f })
        );
        fTunnel.rotation.x = Math.PI / 2;
        fTunnel.position.set(0, 0, 0.44);
        fanGroup.add(fTunnel);

        // Rotor hub + 7 angled blades
        const rotorGroup = new THREE.Group();
        rotorGroup.position.set(0, 0, 0.25);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.65, 20), matBlackLcp);
        hub.rotation.x = Math.PI / 2;
        rotorGroup.add(hub);

        const bladeShapeGeo = new THREE.BoxGeometry(0.95, 0.42, 0.08);
        for (let b = 0; b < 7; b++) {
          const angle = (b / 7) * Math.PI * 2;
          const bPivot = new THREE.Group();
          bPivot.rotation.z = angle;
          const bMesh = new THREE.Mesh(bladeShapeGeo, matBlackLcp);
          bMesh.position.set(1.12, 0, 0);
          bMesh.rotation.x = 0.52;
          bPivot.add(bMesh);
          rotorGroup.add(bPivot);
        }
        fanRotors.push(rotorGroup);
        fanGroup.add(rotorGroup);

        // Chrome Finger Guard Grille Rings
        for (let r of [0.75, 1.22, 1.65]) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 8, 28), matShieldNickel);
          ring.position.set(0, 0, -0.22);
          tagPart(
            ring,
            `40mm 温控轴流散热风扇 #${fIdx + 1} 与金属防指护网`,
            '7 叶片高静压温控散热风扇，外罩镀镍同心圆防异物金属护网，在 3D 视口中实时高速旋转。',
            'TorusGeometry + 7-Blade Rotor',
            'Nickel Guard + PBT Impeller'
          );
          fanGroup.add(ring);
        }

        // 4 Corner Fan Mounting Screws
        for (let sx of [-1.52, 1.52]) {
          for (let sy of [-1.52, 1.52]) {
            const fScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12), matShieldNickel);
            fScrew.rotation.x = Math.PI / 2;
            fScrew.position.set(sx, sy, -0.22);
            fanGroup.add(fScrew);
          }
        }

        rearPanelGroup.add(fanGroup);
      });

      // Heavy Brass Earth Grounding Terminal Lug (Rear Right, X = +14.8)
      const gndWasher = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.12, 20), matCopperBrass);
      gndWasher.rotation.x = Math.PI / 2;
      gndWasher.position.set(14.8, -0.45, rearZ - 0.05);
      const gndStud = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.25, 16), matCopperBrass);
      gndStud.rotation.x = Math.PI / 2;
      gndStud.position.set(14.8, -0.45, rearZ - 0.58);
      const gndKnurlNut = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.42, 16), matCopperBrass);
      gndKnurlNut.rotation.x = Math.PI / 2;
      gndKnurlNut.position.set(14.8, -0.45, rearZ - 0.55);
      tagPart(
        gndKnurlNut,
        '纯铜滚花防雷保护接地柱 (GND Terminal)',
        '用于连接实验室机房等电位接地铜排，将室外或走廊监控网线感应的 6kV 雷击浪涌电流安全泄放。',
        'CylinderGeometry Assembly',
        'Solid Brass (Metalness 0.90)'
      );
      rearPanelGroup.add(gndWasher, gndStud, gndKnurlNut);

      // -----------------------------------------------------------------------
      // 10. INTERNAL ENGINEERING COMPONENTS (PCB, FINNED HEATSINKS, 370W PSU)
      // -----------------------------------------------------------------------
      const pcbTex = createMainboardPcbTexture(THREE);
      const mainPcb = new THREE.Mesh(
        new THREE.BoxGeometry(28.5, 0.22, 21.5),
        new THREE.MeshStandardMaterial({ map: pcbTex, roughness: 0.42, metalness: 0.25 })
      );
      mainPcb.position.set(-5.8, -1.45, -0.5);
      mainPcb.name = 'Internal_Mainboard_PCB';
      tagPart(
        mainPcb,
        '6 层沉金千兆交换主板 PCB (含走线贴图)',
        '承载交换 ASIC、PoE+ PSE 供电控制器与 12 颗网络隔离变压器的多层电路板，可通过开启“机箱上盖透视”或“爆炸拆解”完整检视。',
        'BoxGeometry + Procedural PCB Texture',
        'FR-4 Solder Mask + Gold Pads'
      );
      internalsGroup.add(mainPcb);

      // 2× Extruded Black Anodized Finned Heatsinks (Over Switch ASIC & PoE Controller)
      const hsConfigs = [
        { x: -7.5, z: -2.0, w: 6.8, d: 5.4, fins: 13, title: '主交换芯片黑化铝挤鳍片散热器 (Layer-2+ Switch ASIC)' },
        { x: 1.5, z: -1.5, w: 5.2, d: 4.4, fins: 10, title: '802.3at PoE+ 供电管理芯片组散热器 (PSE Controllers)' }
      ];
      hsConfigs.forEach((hc, hi) => {
        const hsGroup = new THREE.Group();
        hsGroup.name = `Internal_Heatsink_${hi + 1}`;
        const hsBase = new THREE.Mesh(new THREE.BoxGeometry(hc.w, 0.35, hc.d), matHeatsinkAlum);
        hsBase.position.set(hc.x, -1.12, hc.z);
        tagPart(hsBase, hc.title, '高导热阳极氧化铝合金多鳍片散热器，顺应前后风道方向排列以降低芯片结温。', 'Multi-Fin Array Geometry', 'Anodized Aluminum');
        hsGroup.add(hsBase);

        const finGeo = new THREE.BoxGeometry(0.14, 1.45, hc.d);
        for (let f = 0; f < hc.fins; f++) {
          const fx = hc.x - hc.w / 2 + 0.25 + (f / (hc.fins - 1)) * (hc.w - 0.5);
          const fin = new THREE.Mesh(finGeo, matHeatsinkAlum);
          fin.position.set(fx, -0.32, hc.z);
          tagPart(fin, hc.title, '铝合金阵列散热鳍片。', 'BoxGeometry Fin', 'Anodized Aluminum');
          hsGroup.add(fin);
        }
        internalsGroup.add(hsGroup);
      });

      // 12× RJ45 Isolation Transformer Magnetics Chips (Behind front ports)
      const magGeo = new THREE.BoxGeometry(2.1, 0.58, 1.35);
      for (let m = 0; m < 12; m++) {
        const mag = new THREE.Mesh(magGeo, matBlackLcp);
        mag.position.set(-16.2 + m * 2.35, -1.05, 7.2);
        tagPart(mag, '千兆网络隔离变压器芯片 (Pulse Magnetics)', '位于 RJ45 端口后方的信号耦合与 6kV 高压共模浪涌隔离变压器阵列。', 'BoxGeometry Array', 'SMD IC Package');
        internalsGroup.add(mag);
      }

      // Internal 370W Switching Power Supply Unit (PSU on Right Side of Chassis)
      const psuCage = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.1, 20.5), matPsuAluminum);
      psuCage.position.set(15.2, -0.35, -0.8);
      tagPart(
        psuCage,
        '内置 370W 工业级 PoE+ 开关电源模块 (54V DC 输出)',
        '独立金属屏蔽罩封装的大功率开关电源，为 24 路安防监控摄像头提供稳定的 54V DC PoE+ 直流供电。',
        'BoxGeometry + Toroid Inductors',
        'Galvanized Aluminum Cage'
      );
      internalsGroup.add(psuCage);

      // Electrolytic Bulk Capacitors & Copper Toroid Coil on PSU
      const capGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.2, 20);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35, metalness: 0.3 });
      for (let c = 0; c < 2; c++) {
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(13.2 + c * 2.4, -0.1, -5.5);
        internalsGroup.add(cap);
      }
      const toroid = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.42, 14, 28), matCopperBrass);
      toroid.rotation.x = Math.PI / 2;
      toroid.position.set(15.5, -0.15, 2.5);
      internalsGroup.add(toroid);

      // Expose interactive controller API on root.userData
      root.userData = {
        groups: {
          chassisBaseGroup,
          topCoverGroup,
          frontPanelGroup,
          rearPanelGroup,
          rackEarsGroup,
          internalsGroup,
          patchCablesGroup,
          sfpTransceiverGroup
        },
        materials: {
          matChassisCoat,
          matTopCoverCoat,
          matRackEarMetal
        },
        animatedPortLeds,
        fanRotors,
        dipActuators,
        oledTex,
        oledState,
        setExplodeFactor: (t) => {
          // Smoothly separate sub-assemblies based on factor t in [0, 1]
          topCoverGroup.position.set(0, t * 8.5, 0);
          chassisBaseGroup.position.set(0, -t * 3.2, 0);
          internalsGroup.position.set(0, t * 1.4, 0);
          frontPanelGroup.position.set(0, 0, t * 6.5);
          patchCablesGroup.position.set(0, 0, t * 12.5);
          sfpTransceiverGroup.position.set(0, 0, t * 11.2);
          rearPanelGroup.position.set(0, 0, -t * 6.8);
          if (rackEarsGroup.children.length >= 2) {
            rackEarsGroup.children[0].position.set(-t * 5.5, 0, t * 2.5);
            rackEarsGroup.children[1].position.set(t * 5.5, 0, t * 2.5);
          }
        }
      };

      // 原模型正面(24 口 + 丝印面板)朝 +Z,而本项目默认机位在 (+X, −Z) 一侧,
      // 不转就会一打开只看到背面(风扇/电源插座/接地柱)。绕 Y 转 180° 让正面朝向观察者,
      // 宽度仍沿 X 轴,自动取景按 size.x/size.y 计算的口径不变。
      root.rotation.y = Math.PI;

      // 项目约定:点「查看内部」会隐藏带 userData.shell 的网格。
      // 内部主板/散热器/电源模块平时闭合在机箱内,不把顶盖与 U 型下机壳标成外壳就永远看不到。
      [topCoverGroup, chassisBaseGroup].forEach(g => {
        g.traverse(o => { if (o.isMesh) o.userData.shell = true; });
      });

      return root;
    }