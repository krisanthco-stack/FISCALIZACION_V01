from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def test_release_workflow_sets_version_from_git_tag_before_both_builds():
    workflow = read('.github/workflows/release.yml')
    assert workflow.count('scripts/set_release_version.py "$GITHUB_REF_NAME"') >= 2
    assert (ROOT / 'scripts/set_release_version.py').is_file()


def test_release_version_script_updates_desktop_and_android_versions():
    script = read('scripts/set_release_version.py')
    assert "desktop/package.json" in script
    assert "android/app/build.gradle.kts" in script
    assert 'versionName' in script
    assert 'versionCode' in script
    assert 'v26.2.3' in script


def test_release_version_script_updates_visible_app_version_in_both_entrypoints():
    script = read('scripts/set_release_version.py')
    assert "index.html" in script
    assert "Fiscalizacion_BI_V27_FINAL.html" in script
    assert 'APP_VERSION' in script
    assert 'update_html' in script


def test_current_source_versions_are_consistent_before_release():
    import json, re
    html = read('index.html')
    desktop = json.loads(read('desktop/package.json'))
    android = read('android/app/build.gradle.kts')
    app_version = re.search(r"const APP_VERSION='([^']+)'", html).group(1)
    android_version = re.search(r'versionName\s*=\s*"([^"]+)"', android).group(1)
    assert app_version == desktop['version'] == android_version
    assert f'Fiscalización B.I. {app_version}' in html
    assert f'Protección V{app_version}' in html
    assert f'Actualización segura V{app_version}' in html


def test_release_version_script_versions_service_worker_cache_generation():
    script = read('scripts/set_release_version.py')
    assert "sw.js" in script
    assert 'release-' in script
    sw = read('sw.js')
    assert 'release-27.3.9' in sw
