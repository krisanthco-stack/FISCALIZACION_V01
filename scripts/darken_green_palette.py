#!/usr/bin/env python3
"""Darken only green hexadecimal colors while leaving every non-green color unchanged.

This is intentionally conservative: it does not invent a palette. Run it against an
exact V26/V27 copy and review the reported substitutions before writing changes.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

HEX_RE = re.compile(r"#[0-9a-fA-F]{6}")
TEXT_EXTS = {'.css', '.html', '.htm', '.js', '.ts', '.tsx', '.jsx'}


def rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def luma(hex_color: str) -> float:
    r, g, b = rgb(hex_color)
    return 0.2126*r + 0.7152*g + 0.0722*b


def is_greenish(hex_color: str) -> bool:
    r, g, b = rgb(hex_color)
    return g >= r + 12 and g >= b + 12


def darker_green(hex_color: str, factor: float = 0.82) -> str:
    if not 0 < factor < 1:
        raise ValueError('factor must be between 0 and 1')
    r, g, b = rgb(hex_color)
    # Darken uniformly to preserve hue; only called for greenish colors.
    nr, ng, nb = (max(0, min(255, round(v * factor))) for v in (r, g, b))
    return f'#{nr:02x}{ng:02x}{nb:02x}'


def transform_css_text(text: str, factor: float = 0.82) -> tuple[str, list[dict]]:
    changes: list[dict] = []

    def repl(match: re.Match[str]) -> str:
        old = match.group(0)
        if not is_greenish(old):
            return old
        new = darker_green(old, factor)
        if new.lower() != old.lower():
            changes.append({'old': old.lower(), 'new': new.lower()})
        return new

    return HEX_RE.sub(repl, text), changes


def process_file(path: Path, factor: float = 0.82, write: bool = False) -> dict:
    original = path.read_text(encoding='utf-8', errors='ignore')
    transformed, changes = transform_css_text(original, factor)
    if write and changes:
        path.write_text(transformed, encoding='utf-8')
    return {'file': str(path), 'changes': changes, 'written': bool(write and changes)}


def iter_files(root: Path):
    if root.is_file():
        if root.suffix.lower() in TEXT_EXTS:
            yield root
        return
    for p in root.rglob('*'):
        if p.is_file() and p.suffix.lower() in TEXT_EXTS:
            yield p


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('path', type=Path)
    ap.add_argument('--factor', type=float, default=0.82)
    ap.add_argument('--write', action='store_true', help='Apply changes; default is dry-run')
    ap.add_argument('--json-out', type=Path)
    args = ap.parse_args()

    results = [process_file(p, args.factor, args.write) for p in iter_files(args.path)]
    payload = {'path': str(args.path), 'factor': args.factor, 'write': args.write,
               'files_changed': sum(bool(r['changes']) for r in results), 'results': results}
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    print(text)
    if args.json_out:
        args.json_out.write_text(text, encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
