#!/usr/bin/env python3
"""Verify that packaged Windows/Android artifacts contain the L-26 runtime needed offline."""
from __future__ import annotations

from pathlib import Path
import argparse
import json
import zipfile
import sys

SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT = SCRIPTS_DIR.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
from distribution_parity import compare_runtime_tree, compare_runtime_zip

PDF_VENDOR = Path('app/assets/vendor/pdfjs-4.10.38-legacy')
HTML_MARKERS = (
    'globalJsonExportBtn',
    'consolidateHistoricalFolioDuplicates',
    'l26-reader://',
)


def _result(**kwargs):
    errors = kwargs.pop('errors', [])
    return {'ok': not errors, 'errors': errors, **kwargs}


def _find_windows_unpacked(path: Path) -> Path | None:
    path = path.resolve()
    if (path / 'resources').is_dir():
        return path
    direct = path / 'win-unpacked'
    if direct.is_dir():
        return direct
    matches = sorted(p for p in path.rglob('win-unpacked') if (p / 'resources').is_dir())
    return matches[0] if matches else None


def _check_runtime_tree(runtime_root: Path) -> list[str]:
    errors: list[str] = []
    required_files = [
        Path('index.html'),
        Path('sw.js'),
        Path('app/assets/l26_integrity_core.js'),
        PDF_VENDOR / 'pdf.min.mjs',
        PDF_VENDOR / 'pdf.worker.min.mjs',
    ]
    for rel in required_files:
        path = runtime_root / rel
        if not path.is_file():
            errors.append(f'Falta archivo empaquetado: {rel.as_posix()}')
    for rel_dir in (PDF_VENDOR / 'cmaps', PDF_VENDOR / 'standard_fonts'):
        path = runtime_root / rel_dir
        if not path.is_dir() or not any(p.is_file() for p in path.rglob('*')):
            errors.append(f'Falta directorio PDF offline con contenido: {rel_dir.as_posix()}')
    pdf = runtime_root / PDF_VENDOR / 'pdf.min.mjs'
    if pdf.is_file() and pdf.stat().st_size < 100_000:
        errors.append('pdf.min.mjs empaquetado es anormalmente pequeño')
    worker = runtime_root / PDF_VENDOR / 'pdf.worker.min.mjs'
    if worker.is_file() and worker.stat().st_size < 500_000:
        errors.append('pdf.worker.min.mjs empaquetado es anormalmente pequeño')
    index = runtime_root / 'index.html'
    if index.is_file():
        text = index.read_text(encoding='utf-8', errors='replace')
        for marker in HTML_MARKERS:
            if marker not in text:
                errors.append(f'Falta marcador funcional en index.html empaquetado: {marker}')
    return errors


def verify_windows(dist_path: str | Path, source_root: str | Path | None = None) -> dict:
    dist = Path(dist_path)
    errors: list[str] = []
    unpacked = _find_windows_unpacked(dist)
    if unpacked is None:
        return _result(errors=['No se encontró win-unpacked/resources en el build Windows.'], windows=str(dist))
    resources = unpacked / 'resources'
    asar = resources / 'app.asar'
    if not asar.is_file() or asar.stat().st_size < 1024:
        errors.append('Falta resources/app.asar o es anormalmente pequeño.')
    else:
        asar_bytes=asar.read_bytes()
        for marker in (b'l26-reader', b'reader-preload.js'):
            if marker not in asar_bytes:
                errors.append(f'Falta marcador Electron dentro de app.asar: {marker.decode()}')
    runtime_root = resources / 'app'
    if not runtime_root.is_dir():
        errors.append('Falta resources/app: extraResources no incluyó la aplicación L-26.')
    else:
        errors.extend(_check_runtime_tree(runtime_root))
        if source_root is not None:
            parity = compare_runtime_tree(source_root, runtime_root)
            for item in parity['mismatches']:
                errors.append(f"Paridad Windows: {item['path']} ({item['reason']})")
    return _result(
        errors=errors,
        windows=str(dist),
        unpacked=str(unpacked),
        runtime_root=str(runtime_root),
    )


def _zip_has_prefixed_file(names: set[str], prefix: str) -> bool:
    return any(name.startswith(prefix) and not name.endswith('/') for name in names)


def verify_android(apk_path: str | Path, source_root: str | Path | None = None) -> dict:
    apk = Path(apk_path)
    errors: list[str] = []
    if not apk.is_file():
        return _result(errors=[f'APK no encontrado: {apk}'], apk=str(apk))
    try:
        with zipfile.ZipFile(apk) as zf:
            bad = zf.testzip()
            if bad:
                errors.append(f'APK ZIP corrupto en: {bad}')
            names = set(zf.namelist())
            root = 'assets/www/'
            vendor = root + PDF_VENDOR.as_posix() + '/'
            required = [
                root + 'index.html',
                root + 'app/assets/l26_integrity_core.js',
                vendor + 'pdf.min.mjs',
                vendor + 'pdf.worker.min.mjs',
            ]
            for name in required:
                if name not in names:
                    errors.append(f'Falta archivo dentro del APK: {name}')
            if not _zip_has_prefixed_file(names, vendor + 'cmaps/'):
                errors.append(f'Faltan cmaps PDF offline dentro del APK: {vendor}cmaps/')
            if not _zip_has_prefixed_file(names, vendor + 'standard_fonts/'):
                errors.append(f'Faltan standard_fonts PDF offline dentro del APK: {vendor}standard_fonts/')
            if root + 'index.html' in names:
                text = zf.read(root + 'index.html').decode('utf-8', errors='replace')
                for marker in HTML_MARKERS:
                    if marker not in text:
                        errors.append(f'Falta marcador funcional en index.html del APK: {marker}')
            for name, minimum in ((vendor + 'pdf.min.mjs', 100_000), (vendor + 'pdf.worker.min.mjs', 500_000)):
                if name in names and zf.getinfo(name).file_size < minimum:
                    errors.append(f'{name} dentro del APK es anormalmente pequeño')
    except zipfile.BadZipFile as exc:
        errors.append(f'APK no es un ZIP válido: {exc}')
    if source_root is not None and apk.is_file():
        try:
            parity = compare_runtime_zip(source_root, apk, 'assets/www/')
            for item in parity['mismatches']:
                errors.append(f"Paridad Android: {item['path']} ({item['reason']})")
        except zipfile.BadZipFile:
            pass
    return _result(errors=errors, apk=str(apk))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--windows', help='desktop/dist o ruta a win-unpacked')
    group.add_argument('--android', help='ruta al APK generado')
    args = parser.parse_args()
    report = verify_windows(args.windows, source_root=ROOT) if args.windows else verify_android(args.android, source_root=ROOT)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report['ok'] else 2)


if __name__ == '__main__':
    main()
