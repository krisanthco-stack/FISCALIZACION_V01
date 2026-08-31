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
