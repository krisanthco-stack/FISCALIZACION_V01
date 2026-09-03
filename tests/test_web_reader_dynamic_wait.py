from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DESKTOP=(ROOT/'desktop/main.js').read_text(encoding='utf-8')
ANDROID=(ROOT/'android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/ReaderActivity.java').read_text(encoding='utf-8')

def test_windows_reader_waits_for_dynamic_dom_stability_not_only_ready_state():
    assert 'minimumReadyMs = 3000' in DESKTOP
    assert 'stableContentMs = 1500' in DESKTOP
    assert 'textLength' in DESKTOP
    assert 'signature' in DESKTOP
    assert '60000' in DESKTOP

def test_android_reader_waits_for_dynamic_dom_stability_not_only_on_page_finished():
    assert 'MINIMUM_READY_MS = 3000L' in ANDROID
    assert 'CONTENT_STABLE_MS = 1500L' in ANDROID
    assert 'lastContentSignature' in ANDROID
    assert 'contentStableAt' in ANDROID
    assert 'innerText' in ANDROID
    assert '60000L' in ANDROID
