from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = (ROOT/'app/assets/l26_pdf_reader.js').read_text(encoding='utf-8')
SW = (ROOT/'sw.js').read_text(encoding='utf-8')
DESKTOP = (ROOT/'desktop/main.js').read_text(encoding='utf-8')
ANDROID = (ROOT/'android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/ReaderActivity.java').read_text(encoding='utf-8')
PRELOAD = (ROOT/'desktop/reader-preload.js').read_text(encoding='utf-8')


def test_pdf_runtime_uses_new_versioned_vendor_path_and_cache_generation():
    assert 'vendor/pdfjs-4.10.38-legacy/pdf.min.mjs' in PDF
    assert 'vendor/pdfjs-4.10.38-legacy/pdf.worker.min.mjs' in PDF
    assert "PDFJS_CACHE='l26-pdfjs-4.10.38-legacy-v2'" in PDF
    assert 'vendor/pdfjs/pdf.min.mjs' not in PDF
    assert 'vendor/pdfjs/pdf.worker.min.mjs' not in PDF
    assert "PDFJS_CACHE='l26-pdfjs-4.10.38-legacy-v2'" in SW
    assert 'pdfjs-4.10.38-legacy/pdf.min.mjs' in SW


def test_pdf_runtime_has_older_webview_promise_compatibility():
    assert 'Promise.withResolvers' in PDF
    assert 'installRuntimeCompatibility' in PDF


def test_desktop_reader_waits_for_page_readiness_before_reading():
    assert 'waitForRemotePageReady' in DESKTOP
    assert 'await waitForRemotePageReady(view.webContents' in DESKTOP
    assert '60000' in DESKTOP
    assert "status:'Esperando a que termine de cargar la página…'" in DESKTOP
    assert "readPage.disabled=Boolean(state.loading)" in PRELOAD.replace(' ', '')


def test_android_reader_tracks_page_loading_and_waits_before_read():
    assert 'private boolean pageLoading = true;' in ANDROID
    assert 'onPageStarted' in ANDROID
    assert 'onPageFinished' in ANDROID
    assert 'waitUntilPageReady' in ANDROID
    assert '60000L' in ANDROID
    assert 'Leyendo la página visible' in ANDROID
