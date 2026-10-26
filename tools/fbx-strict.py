#!/usr/bin/env python3
"""FBX 二进制严格校验器：逐个属性解析并校验属性区长度与节点结束偏移。

用法: python fbx-strict.py file.fbx [--verbose]
退出码 0 表示通过。
"""
import struct
import sys

ZERO13 = b'\x00' * 13
MAGIC = b'Kaydara FBX Binary  \x00\x1a\x00'

ARRAY_CODE = {'f': ('f', 4), 'd': ('d', 8), 'l': ('q', 8), 'i': ('i', 4), 'b': ('?', 1)}


class Errs:
    def __init__(self, limit=8):
        self.items = []
        self.limit = limit

    def add(self, path, msg, off=None):
        if len(self.items) >= self.limit:
            raise StopIteration('错误过多，停止解析')
        self.items.append(f'{path}: {msg}' + (f'  @{off}' if off is not None else ''))

    def __len__(self):
        return len(self.items)


def read_props(buf, p, nprops, path, errs):
    """解析 nprops 个属性，返回属性区结束位置"""
    start = p
    for i in range(nprops):
        if p >= len(buf):
            errs.add(path, f'属性 {i} 越界（文件截断）', p)
            return p
        code = buf[p:p + 1]
        p += 1
        c = code.decode('ascii', 'replace')
        if c == 'Y':
            if p + 2 > len(buf):
                errs.add(path, f'属性 {i} Y 截断', p); return p
            struct.unpack('<h', buf[p:p + 2]); p += 2
        elif c == 'C':
            p += 1
        elif c == 'I':
            struct.unpack('<i', buf[p:p + 4]); p += 4
        elif c == 'F':
            struct.unpack('<f', buf[p:p + 4]); p += 4
        elif c == 'D':
            struct.unpack('<d', buf[p:p + 8]); p += 8
        elif c == 'L':
            struct.unpack('<q', buf[p:p + 8]); p += 8
        elif c in ARRAY_CODE:
            if p + 12 > len(buf):
                errs.add(path, f'属性 {i} 数组头截断', p); return p
            n, enc, clen = struct.unpack('<III', buf[p:p + 12])
            p += 12
            fmt, size = ARRAY_CODE[c]
            raw = n * size
            if enc == 0:
                if clen != raw:
                    errs.add(path, f'属性 {i} 数组 {c}: 未压缩长度 {n}*{size}={raw} != 声明 {clen}', start)
            else:
                if clen > raw:
                    errs.add(path, f'属性 {i} 数组 {c}: 压缩长度 {clen} > 原文 {raw}', start)
            p += clen
        elif c == 'S':
            if p + 4 > len(buf):
                errs.add(path, f'属性 {i} S 长度截断', p); return p
            n = struct.unpack('<I', buf[p:p + 4])[0]
            p += 4 + n
        elif c == 'R':
            if p + 4 > len(buf):
                errs.add(path, f'属性 {i} R 长度截断', p); return p
            n = struct.unpack('<I', buf[p:p + 4])[0]
            p += 4 + n
        else:
            errs.add(path, f'属性 {i} 未知类型码 {code!r}（值 {ord(c)}）', p - 1)
            return p
    return p


def walk(buf, verbose=False):
    ver = struct.unpack('<I', buf[23:27])[0]
    errs = Errs()
    top = []
    stats = {'nodes': 0, 'props': 0}

    def node(p, depth, parent):
        end, nprops, plen = struct.unpack('<III', buf[p:p + 12])
        nlen = buf[p + 12]
        name = buf[p + 13:p + 13 + nlen].decode('ascii', 'replace')
        path = (parent + '/' if parent else '') + name
        prop_start = p + 13 + nlen
        q = read_props(buf, prop_start, nprops, path, errs)
        if q - prop_start != plen:
            errs.add(path, f'属性区长度声明 {plen}，实际解析出 {q - prop_start}（差 {q - prop_start - plen}）', p)
        stats['nodes'] += 1
        stats['props'] += nprops
        while q < end:
            if end - q == 13 and buf[q:q + 13] == ZERO13:
                q += 13
                break
            q = node(q, depth + 1, path)
        if q != end:
            errs.add(path, f'节点声明结束偏移 {end}，实际 {q}（差 {q - end}）', p)
        if depth == 0:
            top.append((name, nprops))
        return end

    pos = 27
    try:
        while pos + 13 <= len(buf):
            end = struct.unpack('<I', buf[pos:pos + 4])[0]
            if end == 0:
                pos += 13
                break
            pos = node(pos, 0, '')
    except (StopIteration, RecursionError) as e:
        pass
    return ver, pos, top, stats, errs


def check_footer(buf, root_end, errs):
    size = len(buf)
    if size % 16:
        errs.add('footer', f'总长 {size} 非 16 整数倍')
    if buf[-16:] == (b'\x00' * 16):
        errs.add('footer', '末 16 字节全零')
    return size - root_end


def main():
    paths = [a for a in sys.argv[1:] if not a.startswith('-')]
    verbose = '--verbose' in sys.argv
    all_ok = True
    for path in paths:
        buf = open(path, 'rb').read()
        print(f'=== {path}  ({len(buf)} B)')
        if not buf.startswith(b'Kaydara FBX Binary  '):
            print('    ✗ 不是二进制 FBX'); all_ok = False; continue
        ver, root_end, top, stats, errs = walk(buf, verbose)
        foot = check_footer(buf, root_end, errs)
        print(f'    版本 {ver}  节点 {stats["nodes"]}  属性 {stats["props"]}  顶层 {[n for n, _ in top]}')
        print(f'    节点树结束 {root_end}  footer {foot} B')
        if errs.items:
            all_ok = False
            print(f'    ✗ 发现 {len(errs.items)} 处结构错误:')
            for e in errs.items[:20]:
                print('      -', e)
        else:
            print('    ✓ 属性区长度与所有节点偏移全部自洽')
    print('\n结果:', '全部通过' if all_ok else '存在错误')
    return 0 if all_ok else 1


if __name__ == '__main__':
    sys.setrecursionlimit(20000)
    sys.exit(main())
