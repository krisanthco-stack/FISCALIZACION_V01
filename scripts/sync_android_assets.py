#!/usr/bin/env python3
"""Copy only L-26 runtime assets into the Android APK web root."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'android/app/src/main/assets/www'
ROOT_FILES = [
    'index.html', 'sw.js', 'manifest.webmanifest', 'favicon-48.png',
    'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
    'icon-maskable-192.png', 'icon-maskable-512.png',
]
ROOT_DIRS = ['app/assets', 'templates', 'config']
EXCLUDED_NAMES = {'desktop', 'tests', 'audit', 'control', 'release', 'docs', '.github', 'android'}


def copy_file(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def main():
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)
    for name in ROOT_FILES:
        src = ROOT / name
        if src.is_file():
            copy_file(src, DEST / name)
    for rel in ROOT_DIRS:
        src_dir = ROOT / rel
        if not src_dir.is_dir():
            continue
        for src in src_dir.rglob('*'):
            if not src.is_file() or any(part in EXCLUDED_NAMES for part in src.parts):
                continue
            copy_file(src, DEST / src.relative_to(ROOT))
    print(f'Android assets synchronized: {DEST.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
