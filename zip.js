// zip.js — 零依赖 ZIP 打包器(浏览器端),用于把「模型 + 多张贴图」合成一个压缩包
// 暴露 window.ZipPack.makeZip(files, {compress}) -> Promise<Uint8Array>
//   files: [{ name: 'model.fbx', data: Uint8Array }, ...]
//   浏览器支持 CompressionStream 时用 deflate(方法 8),否则退化为 store(方法 0)
(function (global) {
  'use strict';

  // ---------- CRC32 ----------
  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // ---------- DOS 时间 ----------
  function dosDateTime(d) {
    const time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((d.getSeconds() >> 1) & 0x1F);
    const date = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
    return { time, date };
  }

  // ---------- deflate-raw(不支持则返回 null) ----------
  async function deflateRaw(bytes) {
    if (typeof global.CompressionStream === 'undefined' || typeof global.Blob === 'undefined') return null;
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new global.CompressionStream('deflate-raw'));
      const buf = await new Response(stream).arrayBuffer();
      return new Uint8Array(buf);
    } catch (e) {
      return null;
    }
  }

  const UTF8_FLAG = 0x0800; // 文件名按 UTF-8 编码
  const SIG_LOCAL = 0x04034b50;
  const SIG_CENTRAL = 0x02014b50;
  const SIG_EOCD = 0x06054b50;

  async function makeZip(files, opts) {
    const compress = !opts || opts.compress !== false;
    const enc = new TextEncoder();
    const now = new Date();
    const { time, date } = dosDateTime(now);

    const parts = [];       // 所有待拼接的字节块(本地头 + 数据)
    const central = [];     // 中央目录记录
    let offset = 0;

    for (const f of files) {
      const nameBytes = enc.encode(f.name);
      const raw = f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data);
      const crc = crc32(raw);

      let method = 0;
      let payload = raw;
      if (compress && raw.length > 256) {
        const packed = await deflateRaw(raw);
        if (packed && packed.length < raw.length) { method = 8; payload = packed; }
      }

      // 本地文件头 30 字节 + 文件名
      const lh = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, SIG_LOCAL, true);
      lv.setUint16(4, 20, true);          // 解压所需版本
      lv.setUint16(6, UTF8_FLAG, true);
      lv.setUint16(8, method, true);
      lv.setUint16(10, time, true);
      lv.setUint16(12, date, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, payload.length, true);
      lv.setUint32(22, raw.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);          // extra 长度
      lh.set(nameBytes, 30);

      parts.push(lh, payload);

      // 中央目录记录 46 字节 + 文件名
      const cd = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, SIG_CENTRAL, true);
      cv.setUint16(4, 20, true);          // 创建版本
      cv.setUint16(6, 20, true);          // 解压所需版本
      cv.setUint16(8, UTF8_FLAG, true);
      cv.setUint16(10, method, true);
      cv.setUint16(12, time, true);
      cv.setUint16(14, date, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, payload.length, true);
      cv.setUint32(24, raw.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);          // extra
      cv.setUint16(32, 0, true);          // comment
      cv.setUint16(34, 0, true);          // 起始磁盘号
      cv.setUint16(36, 0, true);          // 内部属性
      cv.setUint32(38, 0, true);          // 外部属性
      cv.setUint32(42, offset, true);     // 本地头偏移
      cd.set(nameBytes, 46);
      central.push(cd);

      offset += lh.length + payload.length;
    }

    const cdSize = central.reduce((s, c) => s + c.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, SIG_EOCD, true);
    ev.setUint16(4, 0, true);                    // 当前磁盘号
    ev.setUint16(6, 0, true);                    // 中央目录起始磁盘号
    ev.setUint16(8, files.length, true);         // 本盘条目数
    ev.setUint16(10, files.length, true);        // 总条目数
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);              // 中央目录偏移
    ev.setUint16(20, 0, true);                   // 注释长度

    const total = offset + cdSize + eocd.length;
    const out = new Uint8Array(total);
    let p = 0;
    for (const chunk of parts) { out.set(chunk, p); p += chunk.length; }
    for (const chunk of central) { out.set(chunk, p); p += chunk.length; }
    out.set(eocd, p);
    return out;
  }

  // ---------- 解包(导入模型时读 zip) ----------
  // 只依赖 DecompressionStream,支持 store(0) / deflate(8) 两种方式。
  // zip64 暂不支持(单包 >4GB 或 >65535 个文件),直接报错让人去手工解压。
  async function inflateRaw(bytes) {
    if (typeof global.DecompressionStream === 'undefined') {
      throw new Error('当前浏览器不支持 DecompressionStream,无法解压 zip,请手工解压后再拖入文件');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new global.DecompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  async function readZip(input, opts) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const dec = new TextDecoder('utf-8');
    const filter = (opts && opts.filter) || null;   // (entryName) => boolean

    // 从尾部往前找 EOCD(结尾可能带最多 64KB 注释)
    let eocd = -1;
    const stop = Math.max(0, bytes.length - 66000);
    for (let i = bytes.length - 22; i >= stop; i--) {
      if (dv.getUint32(i, true) === SIG_EOCD) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('不是有效的 zip 文件(找不到目录结尾记录)');

    const count = dv.getUint16(eocd + 10, true);
    if (count === 0xFFFF) throw new Error('这个 zip 是 zip64 格式,暂不支持,请手工解压后再拖入文件');
    let p = dv.getUint32(eocd + 16, true);

    const out = [];
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== SIG_CENTRAL) throw new Error('zip 中央目录损坏(第 ' + (i + 1) + ' 项)');
      const flags = dv.getUint16(p + 8, true);
      const method = dv.getUint16(p + 10, true);
      const csize = dv.getUint32(p + 20, true);
      const usize = dv.getUint32(p + 24, true);
      const nlen = dv.getUint16(p + 28, true);
      const elen = dv.getUint16(p + 30, true);
      const clen = dv.getUint16(p + 32, true);
      const lho = dv.getUint32(p + 42, true);
      // 0x0800 = 文件名是 UTF-8;没有该位时按 GBK 解也常见,这里先按 UTF-8,失败退回 latin1
      let name;
      const nameBytes = bytes.subarray(p + 46, p + 46 + nlen);
      try { name = dec.decode(nameBytes); }
      catch (_) { name = Array.from(nameBytes, b => String.fromCharCode(b)).join(''); }
      p += 46 + nlen + elen + clen;

      if (csize === 0xFFFFFFFF || usize === 0xFFFFFFFF) throw new Error('zip64 条目暂不支持:' + name);
      if (name.endsWith('/')) continue;                  // 目录项
      if (filter && !filter(name)) continue;

      // 数据起点要按本地头里的文件名/扩展区长度现算(可能与中央目录不同)
      if (dv.getUint32(lho, true) !== SIG_LOCAL) throw new Error('zip 本地头损坏:' + name);
      const lnlen = dv.getUint16(lho + 26, true);
      const lelen = dv.getUint16(lho + 28, true);
      const start = lho + 30 + lnlen + lelen;
      const raw = bytes.subarray(start, start + csize);

      let data;
      if (method === 0) data = raw.slice();
      else if (method === 8) data = await inflateRaw(raw);
      else throw new Error('不支持的压缩方式 ' + method + '(仅 store/deflate):' + name);

      out.push({ name, bytes: data, size: usize, flags });
    }
    return out;
  }

  global.ZipPack = { makeZip, readZip, crc32 };
})(typeof window !== 'undefined' ? window : globalThis);
