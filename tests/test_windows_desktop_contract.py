import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = ROOT / 'desktop'


def test_desktop_package_contract():
    package = json.loads((DESKTOP / 'package.json').read_text(encoding='utf-8'))
    assert package['main'] == 'main.js'
    assert package['scripts']['test'] == 'node --test test/*.test.js'
    assert package['scripts']['start'] == 'electron .'
    assert 'dist:win' in package['scripts']
    assert 'electron' in package['devDependencies']
    assert 'electron-builder' in package['devDependencies']

    build = package['build']
    assert build['appId'] == 'cr.go.sarapiqui.fiscalizacion.l26'
    assert set(build['win']['target']) == {'nsis', 'portable'}
    assert build['win']['icon'] == 'build-icon.png'
    extra = build['extraResources']
    assert any(item.get('to') == 'app' for item in extra)
    app_resource = next(item for item in extra if item.get('to') == 'app')
    assert app_resource['from'] == '..'
    assert '!desktop/**' in app_resource['filter']
    assert '!**/desktop/**' in app_resource['filter']


def test_windows_readme_documents_offline_installation():
    text = (DESKTOP / 'README_WINDOWS.md').read_text(encoding='utf-8')
    assert 'GitHub' in text
    assert '127.0.0.1' in text
    assert 'npm run dist:win' in text
    assert 'IndexedDB' in text


def test_windows_build_script_is_one_click_and_runs_verification():
    text = (DESKTOP / 'BUILD_WINDOWS.cmd').read_text(encoding='utf-8')
    assert 'npm install' in text
    assert 'npm test' in text
    assert 'npm run dist:win' in text
    assert 'Fiscalizacion-L26-Setup-26.0.0.exe' in text
