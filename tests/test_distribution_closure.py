from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
README=(ROOT/'README.md').read_text(encoding='utf-8')
DIST=(ROOT/'GITHUB_DISTRIBUCION_WINDOWS_ANDROID.md').read_text(encoding='utf-8')
DESC=json.loads((ROOT/'REPOSITORY_DESCRIPTOR.json').read_text(encoding='utf-8'))
WIN_README=(ROOT/'LEAME_PRIMERO_WINDOWS.txt').read_text(encoding='utf-8')


def test_native_installed_apps_do_not_claim_service_worker_updates():
    assert 'function isNativeInstalledApp()' in HTML
    assert "window.l26Desktop?.openSource" in HTML
    assert "window.L26Android?.openSource" in HTML
    assert "data-update-state='native'" in HTML or "dataset.updateState='native'" in HTML
    assert 'Versión ${APP_VERSION}' in HTML
    assert 'GitHub Releases' in HTML


def test_distribution_docs_do_not_instruct_windows_users_to_open_index_html():
    assert 'Los bytes del artefacto ejecutable/código fuente V26/V27 no están presentes' not in README
    assert 'entrada portable para abrir con doble clic' not in README
    assert 'Haga doble clic en: ABRIR_L26_WINDOWS.cmd' not in WIN_README
    assert 'instalador .exe' in WIN_README.lower()
    assert 'app/assets/vendor/pdfjs-4.10.38-legacy/' in DIST
    assert 'app/assets/vendor/pdfjs/' not in DIST


def test_repository_descriptor_distinguishes_source_from_built_native_binaries():
    assert DESC.get('native_binaries_present') is False
    assert DESC.get('native_distribution') == 'github_actions_builds_exe_and_apk'
    assert 'GitHub' in DESC.get('load_note','')
