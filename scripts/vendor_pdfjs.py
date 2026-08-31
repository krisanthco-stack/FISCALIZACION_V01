#!/usr/bin/env python3
"""Vendor the pinned PDF.js legacy runtime and support data into installable packages."""
from pathlib import Path
import argparse
import shutil
import tarfile
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'app' / 'assets' / 'vendor' / 'pdfjs'
VERSION = '4.10.38'
ARCHIVE_NAME = 'pdfjs-dist-4.10.38.tgz'
ARCHIVE_URLS = [
    f'https://registry.npmjs.org/pdfjs-dist/-/{ARCHIVE_NAME}',
    f'https://registry.yarnpkg.com/pdfjs-dist/-/{ARCHIVE_NAME}',
]
REQUIRED_FILES = {
    'pdf.min.mjs': 'package/legacy/build/pdf.min.mjs',
    'pdf.worker.min.mjs': 'package/legacy/build/pdf.worker.min.mjs',
    'LICENSE': 'package/LICENSE',
}
REQUIRED_DIRS = {
    'cmaps': 'package/cmaps/',
    'standard_fonts': 'package/standard_fonts/',
    'image_decoders': 'package/image_decoders/',
}


def runtime_ready():
    if not (DEST / 'pdf.min.mjs').is_file() or (DEST / 'pdf.min.mjs').stat().st_size < 100_000:
        return False
    if not (DEST / 'pdf.worker.min.mjs').is_file() or (DEST / 'pdf.worker.min.mjs').stat().st_size < 500_000:
        return False
    return all((DEST / name).is_dir() and any((DEST / name).iterdir()) for name in ('cmaps', 'standard_fonts'))


def download_archive(target: Path):
    errors = []
    for url in ARCHIVE_URLS:
        try:
            print(f'Downloading {url}')
            req = urllib.request.Request(url, headers={'User-Agent': 'L26-GitHub-Build/1.0'})
            with urllib.request.urlopen(req, timeout=90) as response, target.open('wb') as out:
                shutil.copyfileobj(response, out)
            if target.stat().st_size < 1_000_000:
                raise RuntimeError('archivo PDF.js descargado demasiado pequeño')
            return
        except Exception as exc:
            errors.append(f'{url}: {exc}')
            target.unlink(missing_ok=True)
    raise RuntimeError(' | '.join(errors))


def copy_member(archive: tarfile.TarFile, member: tarfile.TarInfo, target: Path):
    if not member.isfile():
        return
    source = archive.extractfile(member)
    if source is None:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    with source, target.open('wb') as out:
        shutil.copyfileobj(source, out)


def extract_runtime(archive_path: Path):
    DEST.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive_path, 'r:gz') as archive:
        members = {member.name: member for member in archive.getmembers() if member.isfile()}
        for output_name, member_name in REQUIRED_FILES.items():
            member = members.get(member_name)
            if member is None:
                raise RuntimeError(f'Falta {member_name} en {ARCHIVE_NAME}')
            copy_member(archive, member, DEST / output_name)
        for output_dir, prefix in REQUIRED_DIRS.items():
            target_dir = DEST / output_dir
            if target_dir.exists():
                shutil.rmtree(target_dir)
            count = 0
            for name, member in members.items():
                if not name.startswith(prefix):
                    continue
                relative = Path(name[len(prefix):])
                if not relative.parts or '..' in relative.parts:
                    continue
                copy_member(archive, member, target_dir / relative)
                count += 1
            if output_dir != 'image_decoders' and count == 0:
                raise RuntimeError(f'Falta directorio {prefix} en {ARCHIVE_NAME}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--required', action='store_true', help='fail if the pinned runtime cannot be vendored')
    args = parser.parse_args()
    if runtime_ready():
        print('PDF.js 4.10.38 legacy ya está incluido localmente.')
        return
    try:
        with tempfile.TemporaryDirectory(prefix='l26-pdfjs-') as tmp:
            archive_path = Path(tmp) / ARCHIVE_NAME
            download_archive(archive_path)
            extract_runtime(archive_path)
        if not runtime_ready():
            raise RuntimeError('la extracción terminó sin todos los archivos PDF.js requeridos')
        print('PDF.js 4.10.38 legacy + cmaps + standard_fonts vendored successfully.')
    except Exception as exc:
        print(f'ERROR PDF.js: {exc}')
        if args.required:
            raise SystemExit(2)


if __name__ == '__main__':
    main()
