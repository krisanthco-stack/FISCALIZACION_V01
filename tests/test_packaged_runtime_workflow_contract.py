from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / '.github/workflows' / name).read_text(encoding='utf-8')


def test_windows_workflow_verifies_packaged_runtime():
    text = read('windows.yml')
    assert 'verify_packaged_runtime.py --windows desktop/dist' in text
    assert text.index('npm run dist:win') < text.index('verify_packaged_runtime.py --windows desktop/dist')


def test_android_workflow_verifies_final_apk():
    text = read('android.yml')
    assert 'verify_packaged_runtime.py --android android/app/build/outputs/apk/debug/app-debug.apk' in text
    assert text.index('assembleDebug') < text.index('verify_packaged_runtime.py --android android/app/build/outputs/apk/debug/app-debug.apk')


def test_release_workflow_verifies_both_artifacts():
    text = read('release.yml')
    assert 'verify_packaged_runtime.py --windows desktop/dist' in text
    assert 'verify_packaged_runtime.py --android android/app/build/outputs/apk/release/app-release.apk' in text
