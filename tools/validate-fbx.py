#!/usr/bin/env python3
"""validate-fbx.py — 二进制 FBX 结构校验器(零依赖)

用途:导出后用它在本地自检,避免把 Unity / Blender 无法识别的文件交出去。
检查项:
  1. 文件头(21 字节标识 + 0x1a00 + 版本号)
  2. 节点树:每个节点的 EndOffset 必须与实际位置一致,哨兵完整
  3. 文件尾:总长 %16 == 0;末 16 字节为 magic;往前依次是 120 字节保留区、
     版本重复、0u32、1~16 字节对齐填充、16 字节 FOOTER_ID
  4. 贴图引用(可选):FBX 引用的 PNG 是否与文件同目录存在

用法:
  python tools/validate-fbx.py model.fbx [更多文件...]
  exit code 0 = 全部通过,1 = 有问题
"""
import os
import struct
import sys

HEADER_MAGIC = b'Kaydara FBX Binary  \x00\x1a\x00'
FOOTER_ID = bytes([0xfa, 0xbc, 0xab, 0x09, 0xd0, 0xc8, 0xd4, 0x66,
                   0xb1, 0x76, 0xfb, 0x83, 0x1c, 0xf7, 0x26, 0x7e])
FOOTER_MAGIC = bytes([0xf8, 0x5a, 0x8c, 0x6a, 0xde, 0xf5, 0xd9, 0x7e,
                      0xec, 0xe9, 0x0c, 0xe3, 0x75, 0x8f, 0x29, 0x0b])
ZERO13 = b'\x00' * 13
RESERVED = 120


def parse_tree(buf, errors):
    """遍历节点树,校验每个节点的 EndOffset。返回 (顶层节点名列表, 根结束偏移)"""
    names = []

    def node(p):
        if p + 13 > len(buf):
            errors.append('节点记录越界 @%d' % p)
            return p
        end, _nprops, plen = struct.unpack('<III', buf[p:p + 12])
        nlen = buf[p + 12]
        name = buf[p + 13:p + 13 + nlen].decode('ascii', 'replace')
        q = p + 13 + nlen + plen
        if q > end:
            errors.append('%s: 属性区超出声明结束偏移' % name)
            return end
        while q < end:
            if end - q == 13 and buf[q:q + 13] == ZERO13:
                q += 13
                break
            q = node(q)
        if q != end:
            errors.append('%s: 声明结束 %d 实际 %d' % (name, end, q))
        return end

    pos = 27
    root_end = None
    while pos + 13 <= len(buf):
        end = struct.unpack('<I', buf[pos:pos + 4])[0]
        if end == 0:
            root_end = pos + 13
            break
        nlen = buf[pos + 12]
        names.append(buf[pos + 13:pos + 13 + nlen].decode('ascii', 'replace'))
        pos = node(pos)
    if root_end is None:
        errors.append('找不到根节点列表结束哨兵')
        root_end = len(buf)
    return names, root_end


def check_footer(buf, root_end, errors):
    """按 FBX 规范正向推导 trailer:ID → 对齐填充 → 0u32 → 版本 → 120 零 → magic"""
    size = len(buf)
    if size % 16 != 0:
        errors.append('文件总长 %d 不是 16 的整数倍(读取器靠此回溯定位 trailer)' % size)

    pad = 16 - ((root_end + 16) % 16)     # 1..16,与写入端同一公式
    p = root_end
    footer_id = buf[p:p + 16]
    p += 16
    if buf[p:p + pad] != b'\x00' * pad:
        errors.append('对齐填充区(%d 字节)应全零' % pad)
    p += pad
    zero = struct.unpack('<I', buf[p:p + 4])[0]
    if zero != 0:
        errors.append('版本号前的 u32 应为 0')
    p += 4
    ver = struct.unpack('<I', buf[p:p + 4])[0]
    if ver != 7400:
        errors.append('footer 版本号 %d != 7400' % ver)
    p += 4
    if buf[p:p + RESERVED] != b'\x00' * RESERVED:
        errors.append('magic 前 %d 字节保留区应全零' % RESERVED)
    p += RESERVED
    if buf[p:p + 16] != FOOTER_MAGIC:
        errors.append('末尾 16 字节不是 FOOTER_MAGIC')
    p += 16
    if p != size:
        errors.append('footer 结束位置 %d 与文件大小 %d 不符' % (p, size))

    return {'size': size, 'footer': size - root_end, 'pad': pad,
            'version': ver, 'id_standard': footer_id == FOOTER_ID}


def check_textures(buf, path, errors, warnings):
    import re
    refs = sorted(set(x.decode() for x in re.findall(rb'([A-Za-z0-9_\-]+\.png)', buf)))
    folder = os.path.dirname(os.path.abspath(path))
    missing = [r for r in refs if not os.path.exists(os.path.join(folder, r))]
    for m in missing:
        warnings.append('贴图 %s 不在同目录,Unity / Blender 会找不到' % m)
    return refs, missing


def main(paths):
    failed = False
    for path in paths:
        buf = open(path, 'rb').read()
        errors, warnings = [], []
        if buf[:23] != HEADER_MAGIC:
            print('%s: ✗ 文件头标识错误' % path)
            failed = True
            continue
        version = struct.unpack('<I', buf[23:27])[0]
        names, root_end = parse_tree(buf, errors)
        info = check_footer(buf, root_end, errors)
        refs, _ = check_textures(buf, path, errors, warnings)

        status = '✓ 通过' if not errors else '✗ 失败'
        print('=== %s  %s' % (path, status))
        print('    大小 %d B  版本 %d  节点树结束 %d  顶层节点 %d 个  贴图引用 %d 张'
              % (len(buf), version, root_end, len(names), len(refs)))
        if info:
            print('    footer %d 字节(对齐填充 %d 字节, ID %s)'
                  % (info['footer'], info['pad'], '标准' if info['id_standard'] else 'SDK 变体'))
        print('    顶层节点: %s' % ', '.join(names))
        for e in errors:
            print('    ✗ ' + e)
        for w in warnings:
            print('    ! ' + w)
        if errors:
            failed = True
    return 1 if failed else 0


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1:]))
