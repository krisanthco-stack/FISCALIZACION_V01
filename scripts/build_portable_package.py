#!/usr/bin/env python3
"""Build a portable ZIP with exactly one top-level repository directory."""
from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

EXCLUDED_DIRS = {'.git', '__pycache__', '.pytest_cache', '.mypy_cache'}
EXCLUDED_FILES = {'.DS_Store'}
EXCLUDED_SUFFIXES = {'.pyc', '.pyo'}


def _include(path: Path, source: Path) -> bool:
    rel = path.relative_to(source)
    if any(part in EXCLUDED_DIRS for part in rel.parts):
        return False
    if path.name in EXCLUDED_FILES or path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    return path.is_file()


def build_portable_zip(source: Path | str, output: Path | str, *, root_name: str) -> Path:
    source = Path(source).resolve()
    output = Path(output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(source.rglob('*')):
            if not _include(path, source):
                continue
            arcname = Path(root_name) / path.relative_to(source)
            zf.write(path, arcname.as_posix())
    return output


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('source', type=Path)
    ap.add_argument('output', type=Path)
    ap.add_argument('--root-name', default='SARAPIQUI_FISCALIZACION_V26_V27_FINAL_REPO')
    args = ap.parse_args()
    path = build_portable_zip(args.source, args.output, root_name=args.root_name)
    print(path)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
