#!/usr/bin/env python3
"""Vendor the pinned PDF.js legacy runtime into installable packages."""
from pathlib import Path
import argparse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'app' / 'assets' / 'vendor' / 'pdfjs'
BASES = [
    'https://unpkg.com/pdfjs-dist@4.10.38',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38',
]
FILES = {
    'pdf.min.mjs': 'legacy/build/pdf.min.mjs',
    'pdf.worker.min.mjs': 'legacy/build/pdf.worker.min.mjs',
    'LICENSE': 'LICENSE',
}


def download_first_available(target: Path, relative: str):
    errors = []
    urls = [f'{base}/{relative}' for base in BASES]
    for url in urls:
        try:
            print(f'Downloading {url}')
            req = urllib.request.Request(url, headers={'User-Agent': 'L26-GitHub-Build/1.0'})
            with urllib.request.urlopen(req, timeout=60) as response, target.open('wb') as out:
                out.write(response.read())
            if target.stat().st_size <= 100:
                raise RuntimeError('archivo descargado demasiado pequeño')
            return
        except Exception as exc:
            errors.append(f'{url}: {exc}')
            target.unlink(missing_ok=True)
    raise RuntimeError(' | '.join(errors))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--required', action='store_true', help='fail if a pinned asset cannot be downloaded')
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    failures = []
    for name, relative in FILES.items():
        target = DEST / name
        if target.is_file() and target.stat().st_size > 100:
            print(f'PDF.js local: {target.relative_to(ROOT)}')
            continue
        try:
            download_first_available(target, relative)
        except Exception as exc:
            failures.append((name, exc))
            target.unlink(missing_ok=True)
    if failures:
        for name, exc in failures:
            print(f'ERROR {name}: {exc}')
        if args.required:
            raise SystemExit(2)
    else:
        print('PDF.js 4.10.38 legacy vendored successfully.')


if __name__ == '__main__':
    main()
