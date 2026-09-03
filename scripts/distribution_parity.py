#!/usr/bin/env python3
"""Assemble and verify L-26 distribution runtime from one canonical checkout."""
from __future__ import annotations

from pathlib import Path
import argparse
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / 'config/runtime_distribution_manifest.json'


def load_manifest(root: str | Path = ROOT) -> dict:
    root = Path(root)
    return json.loads((root / 'config/runtime_distribution_manifest.json').read_text(encoding='utf-8'))


def iter_runtime_files(root: str | Path = ROOT):
    root = Path(root)
    manifest = load_manifest(root)
    seen: set[Path] = set()
    for rel in manifest['runtime_files']:
        path = Path(rel)
        if path in seen:
            continue
        seen.add(path)
        if not (root / path).is_file():
            raise FileNotFoundError(f'Falta archivo runtime canónico: {path.as_posix()}')
        yield path
    for rel_dir in manifest['runtime_dirs']:
        base = root / rel_dir
        if not base.is_dir():
            raise FileNotFoundError(f'Falta directorio runtime canónico: {rel_dir}')
        for src in sorted(p for p in base.rglob('*') if p.is_file()):
            rel = src.relative_to(root)
            if rel in seen:
                continue
            seen.add(rel)
            yield rel


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def copy_runtime_tree(source_root: str | Path, target_root: str | Path) -> None:
    source_root = Path(source_root)
    target_root = Path(target_root)
    if target_root.exists():
        shutil.rmtree(target_root)
    target_root.mkdir(parents=True, exist_ok=True)
    for rel in iter_runtime_files(source_root):
        src = source_root / rel
        dst = target_root / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def _mirror_errors(source_root: Path) -> list[dict]:
    manifest = load_manifest(source_root)
    canonical = source_root / manifest['canonical_entrypoint']
    canonical_bytes = canonical.read_bytes()
    errors = []
    for rel in manifest.get('mirror_entrypoints', []):
        path = source_root / rel
        if not path.is_file() or path.read_bytes() != canonical_bytes:
            errors.append({'path': rel, 'reason': 'mirror_entrypoint_differs_from_canonical'})
    return errors


def compare_runtime_tree(source_root: str | Path, target_root: str | Path) -> dict:
    source_root = Path(source_root)
    target_root = Path(target_root)
    mismatches = _mirror_errors(source_root)
    checked = 0
    for rel in iter_runtime_files(source_root):
        checked += 1
        src = source_root / rel
        dst = target_root / rel
        if not dst.is_file():
            mismatches.append({'path': rel.as_posix(), 'reason': 'missing'})
            continue
        source_hash = sha256_bytes(src.read_bytes())
        target_hash = sha256_bytes(dst.read_bytes())
        if source_hash != target_hash:
            mismatches.append({
                'path': rel.as_posix(),
                'reason': 'sha256_mismatch',
                'source_sha256': source_hash,
                'target_sha256': target_hash,
            })
    return {'ok': not mismatches, 'checked': checked, 'mismatches': mismatches}


def compare_runtime_zip(source_root: str | Path, archive: str | Path, prefix: str = '') -> dict:
    source_root = Path(source_root)
    archive = Path(archive)
    mismatches = _mirror_errors(source_root)
    checked = 0
    prefix = prefix.lstrip('/')
    if prefix and not prefix.endswith('/'):
        prefix += '/'
    with zipfile.ZipFile(archive) as zf:
        names = set(zf.namelist())
        for rel in iter_runtime_files(source_root):
            checked += 1
            name = prefix + rel.as_posix()
            if name not in names:
                mismatches.append({'path': rel.as_posix(), 'reason': 'missing'})
                continue
            source_hash = sha256_bytes((source_root / rel).read_bytes())
            target_hash = sha256_bytes(zf.read(name))
            if source_hash != target_hash:
                mismatches.append({
                    'path': rel.as_posix(),
                    'reason': 'sha256_mismatch',
                    'source_sha256': source_hash,
                    'target_sha256': target_hash,
                })
    return {'ok': not mismatches, 'checked': checked, 'mismatches': mismatches}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', default=str(ROOT))
    parser.add_argument('--tree', help='Comparar un árbol runtime contra la fuente')
    parser.add_argument('--zip', dest='archive', help='Comparar un ZIP/APK contra la fuente')
    parser.add_argument('--prefix', default='', help='Prefijo interno para --zip')
    parser.add_argument('--copy-to', help='Construir una copia runtime exacta y verificarla')
    args = parser.parse_args()
    source = Path(args.source_root)
    if args.copy_to:
        copy_runtime_tree(source, args.copy_to)
        report = compare_runtime_tree(source, args.copy_to)
    elif args.tree:
        report = compare_runtime_tree(source, args.tree)
    elif args.archive:
        report = compare_runtime_zip(source, args.archive, args.prefix)
    else:
        report = compare_runtime_tree(source, source)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report['ok'] else 2)


if __name__ == '__main__':
    main()
