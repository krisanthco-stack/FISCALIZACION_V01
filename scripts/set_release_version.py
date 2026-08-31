#!/usr/bin/env python3
"""Set Windows and Android package versions from a Git tag such as v26.2.3."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = ROOT / 'desktop/package.json'
ANDROID = ROOT / 'android/app/build.gradle.kts'


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


def main():
    tag = sys.argv[1] if len(sys.argv) > 1 else ''
    version, version_code = parse_tag(tag)
    update_desktop(version)
    update_android(version, version_code)
    print(f'L26 release version: {version} (Android versionCode {version_code})')


if __name__ == '__main__':
    main()
