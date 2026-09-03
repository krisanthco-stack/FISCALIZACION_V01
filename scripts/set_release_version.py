#!/usr/bin/env python3
"""Set L-26 visible, Windows and Android package versions from a Git tag."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = ROOT / 'desktop/package.json'
ANDROID = ROOT / 'android/app/build.gradle.kts'
INDEX = ROOT / 'index.html'
ALT_INDEX = ROOT / 'Fiscalizacion_BI_V27_FINAL.html'
SW = ROOT / 'sw.js'


def parse_tag(tag: str):
    value = tag.strip()
    match = re.fullmatch(r'v?(\d+)\.(\d+)\.(\d+)', value)
    if not match:
        raise SystemExit(f'Versión inválida: {tag!r}. Ejemplo válido: v26.2.3')
    major, minor, patch = map(int, match.groups())
    if minor > 99 or patch > 99:
        raise SystemExit('minor y patch deben estar entre 0 y 99')
    version = f'{major}.{minor}.{patch}'
    version_code = major * 10000 + minor * 100 + patch
    return version, version_code


def update_desktop(version: str):
    data = json.loads(DESKTOP.read_text(encoding='utf-8'))
    data['version'] = version
    DESKTOP.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def update_android(version: str, version_code: int):
    text = ANDROID.read_text(encoding='utf-8')
    text, n_code = re.subn(r'versionCode\s*=\s*\d+', f'versionCode = {version_code}', text, count=1)
    text, n_name = re.subn(r'versionName\s*=\s*"[^"]+"', f'versionName = "{version}"', text, count=1)
    if n_code != 1 or n_name != 1:
        raise SystemExit('No se pudo localizar versionCode/versionName en Android')
    ANDROID.write_text(text, encoding='utf-8')


def update_html(version: str):
    text = INDEX.read_text(encoding='utf-8')
    text, n_app = re.subn(r"const APP_VERSION='[^']+'", f"const APP_VERSION='{version}'", text, count=1)
    if n_app != 1:
        raise SystemExit('No se pudo localizar APP_VERSION en index.html')
    # Keep visible update/protection labels synchronized with the package release.
    text = re.sub(r'Fiscalización B\.I\. \d+\.\d+\.\d+(?:-FINAL)?', f'Fiscalización B.I. {version}', text)
    text = re.sub(r'Protección V\d+\.\d+\.\d+(?:-FINAL)?', f'Protección V{version}', text)
    text = re.sub(r'Actualización segura V\d+\.\d+\.\d+(?:-FINAL)?', f'Actualización segura V{version}', text)
    text = re.sub(r'actualización V\d+\.\d+\.\d+(?:-FINAL)?', f'actualización V{version}', text)
    text = re.sub(r'V\d+\.\d+\.\d+(?:-FINAL)? FINAL: IndexedDB activa', f'V{version}: IndexedDB activa', text)
    INDEX.write_text(text, encoding='utf-8')
    ALT_INDEX.write_text(text, encoding='utf-8')



def update_service_worker(version: str):
    text = SW.read_text(encoding='utf-8')
    match = re.search(r"const CACHE='([^']+)'", text)
    if not match:
        raise SystemExit('No se pudo localizar CACHE en sw.js')
    cache = re.sub(r'-release-\d+\.\d+\.\d+$', '', match.group(1)) + f'-release-{version}'
    text = text[:match.start(1)] + cache + text[match.end(1):]
    SW.write_text(text, encoding='utf-8')

def main():
    tag = sys.argv[1] if len(sys.argv) > 1 else ''
    version, version_code = parse_tag(tag)
    update_desktop(version)
    update_android(version, version_code)
    update_html(version)
    update_service_worker(version)
    print(f'L26 release version: {version} (Android versionCode {version_code})')


if __name__ == '__main__':
    main()
