#!/usr/bin/env python3
"""Copy the canonical L-26 runtime into the Android APK web root."""
from pathlib import Path

from distribution_parity import copy_runtime_tree, compare_runtime_tree

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'android/app/src/main/assets/www'
PDF_RUNTIME = ROOT / 'app/assets/vendor/pdfjs-4.10.38-legacy'
PDF_REQUIRED = [
    PDF_RUNTIME / 'pdf.min.mjs',
    PDF_RUNTIME / 'pdf.worker.min.mjs',
    PDF_RUNTIME / 'cmaps',
    PDF_RUNTIME / 'standard_fonts',
]
COMPAT_ENTRYPOINT = 'app/index.html'


def main():
    missing = [str(path.relative_to(ROOT)) for path in PDF_REQUIRED if not path.exists()]
    if missing:
        raise SystemExit('No se puede construir el APK offline; faltan recursos PDF locales: ' + ', '.join(missing))
    copy_runtime_tree(ROOT, DEST)
    report = compare_runtime_tree(ROOT, DEST)
    if not report['ok']:
        details = ', '.join(item['path'] for item in report['mismatches'][:10])
        raise SystemExit('La copia Android diverge de la fuente canónica: ' + details)
    print(f'Android assets synchronized from canonical runtime: {DEST.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
