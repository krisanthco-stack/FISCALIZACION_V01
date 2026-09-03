from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
READER = (ROOT / 'app/assets/l26_pdf_reader.js').read_text(encoding='utf-8')
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')
GRADLE = (ROOT / 'android/app/build.gradle.kts').read_text(encoding='utf-8')
GRADLE_PROPERTIES = (ROOT / 'android/gradle.properties').read_text(encoding='utf-8')
MAIN = (ROOT / 'android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/MainActivity.java').read_text(encoding='utf-8')
VENDOR = (ROOT / 'scripts/vendor_pdfjs.py').read_text(encoding='utf-8')
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')


def test_pdf_runtime_is_local_only_without_cdn_fallback():
    assert 'cdn.jsdelivr.net/npm/pdfjs-dist' not in READER
    assert 'unpkg.com/pdfjs-dist' not in READER
    assert 'PDFJS_MODULE_URL' not in READER
    assert 'PDFJS_WORKER_URL' not in READER
    assert 'fetchFirstAvailable' not in READER
    assert 'app/assets/vendor/pdfjs-4.10.38-legacy/pdf.min.mjs' in READER
    assert 'app/assets/vendor/pdfjs-4.10.38-legacy/pdf.worker.min.mjs' in READER
    assert 'cdn.jsdelivr.net/npm/pdfjs-dist' not in SW
    assert 'unpkg.com/pdfjs-dist' not in SW


def test_vendor_step_packages_full_pdf_runtime_support_files():
    assert 'pdfjs-dist-4.10.38.tgz' in VENDOR
    assert "'cmaps'" in VENDOR or '"cmaps"' in VENDOR
    assert "'standard_fonts'" in VENDOR or '"standard_fonts"' in VENDOR
    assert 'legacy/build/pdf.min.mjs' in VENDOR
    assert 'legacy/build/pdf.worker.min.mjs' in VENDOR


def test_android_uses_bundled_mlkit_ocr_not_downloadable_play_services_model():
    assert 'com.google.mlkit:text-recognition:16.0.1' in GRADLE
    assert 'play-services-mlkit-text-recognition' not in GRADLE


def test_androidx_is_enabled_for_mlkit_dependencies():
    assert 'android.useAndroidX=true' in GRADLE_PROPERTIES
    assert 'android.useAndroidX=false' not in GRADLE_PROPERTIES


def test_trusted_android_bridge_exposes_local_ocr_for_pdf_images():
    assert 'ocrImage' in MAIN
    assert '@JavascriptInterface' in MAIN
    assert 'TextRecognition.getClient' in MAIN
    assert 'TextRecognizerOptions.DEFAULT_OPTIONS' in MAIN
    assert 'Tasks.await' in MAIN
    assert 'BitmapFactory.decodeByteArray' in MAIN


def test_pdf_reader_uses_android_local_ocr_before_browser_fallback():
    assert 'L26Android?.ocrImage' in READER or 'L26Android.ocrImage' in READER
    assert 'canvas.toDataURL' in READER
    assert 'TextDetector' in READER


def test_pending_general_information_label_is_applied_without_renaming_gps_subsection():
    assert '> Información General</a>' in HTML
    assert '<h2>Información General</h2>' in HTML
    assert '<h3>Ubicación de la inspección</h3>' in HTML


def test_windows_web_mode_uses_functional_web_fallback_instead_of_blocking_warning():
    start = HTML.index('async function openCaseSource')
    end = HTML.index('function caseFieldValue', start)
    body = HTML[start:end]
    assert 'esta abierto en Chrome/Edge' not in body
    assert 'modo Web/PWA' not in body
    assert 'return openWebSourceLink(source)' in body

def test_android_sync_refuses_to_build_without_local_pdf_runtime():
    sync = (ROOT / 'scripts/sync_android_assets.py').read_text(encoding='utf-8')
    assert 'pdf.min.mjs' in sync
    assert 'pdf.worker.min.mjs' in sync
    assert 'cmaps' in sync
    assert 'standard_fonts' in sync
    assert 'raise SystemExit' in sync

def test_android_assets_include_service_worker_compatibility_redirect():
    sync = (ROOT / 'scripts/sync_android_assets.py').read_text(encoding='utf-8')
    assert "'app/index.html'" in sync
