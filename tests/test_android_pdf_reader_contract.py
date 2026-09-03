from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / 'index.html').read_text(encoding='utf-8')
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')


def test_pdf_reader_asset_and_canvas_modal_exist():
    assert 'app/assets/l26_pdf_reader.js' in INDEX
    assert 'id="pdfViewerCanvas"' in INDEX
    assert 'id="pdfViewerStage"' in INDEX
    assert 'id="pdfViewerStatus"' in INDEX


def test_pdf_reader_has_touch_friendly_controls():
    for control in (
        'pdfViewerPrev', 'pdfViewerNext', 'pdfViewerZoomOut', 'pdfViewerZoomIn',
        'pdfViewerFit', 'pdfViewerOpenSystem', 'pdfViewerDownload'
    ):
        assert f'id="{control}"' in INDEX


def test_pdf_viewer_is_not_iframe_only_anymore():
    assert '<iframe id="pdfViewerFrame"' not in INDEX
    assert 'L26PdfReader.open' in INDEX


def test_reader_asset_is_precached_for_offline_shell():
    assert './app/assets/l26_pdf_reader.js' in SW

READER = (ROOT / 'app/assets/l26_pdf_reader.js').read_text(encoding='utf-8')


def test_pdfjs_is_loaded_lazily_and_cached():
    assert './app/assets/vendor/pdfjs-4.10.38-legacy/pdf.min.mjs' in READER
    assert './app/assets/vendor/pdfjs-4.10.38-legacy/pdf.worker.min.mjs' in READER
    assert 'cdn.jsdelivr.net/npm/pdfjs-dist' not in READER
    assert 'pdfjs-dist@6.2.108' not in READER
    assert 'caches.open(PDFJS_CACHE)' in READER
    assert 'GlobalWorkerOptions.workerSrc' in READER


def test_reader_renders_pdf_pages_to_canvas():
    assert '.getDocument(' in READER
    assert '.getPage(' in READER
    assert '.render(' in READER
    assert 'devicePixelRatio' in READER
    assert 'pdfViewerPageLabel' in READER or 'pageLabel' in READER


def test_pdf_viewer_does_not_expose_web_reader_page_or_area_controls():
    assert 'id="pdfViewerReadPage"' not in INDEX
    assert 'id="pdfViewerSelectArea"' not in INDEX
    modal = INDEX[INDEX.index('id="pdfViewerModal"'):INDEX.index('id="managementActionModal"')]
    assert 'Leer página' not in modal and 'Leer área' not in modal


def test_pdf_automatic_ocr_fallback_is_internal_not_a_web_reader_action():
    assert 'extractOcrTextFromPdf' in READER
    assert 'ocrCanvas' in READER
    assert 'TextDetector' in READER
    assert 'L26Android' in READER


def test_detected_case_fields_are_applied_automatically_without_prompts():
    start = INDEX.index('async function applyReadCandidates')
    end = INDEX.index('async function readPdfDocumentIntoCase', start)
    body = INDEX[start:end]
    assert 'prompt(' not in body
    assert 'confirm(' not in body
    assert 'automáticamente' in body or 'automaticamente' in body


def test_pdf_preview_is_display_only_and_keeps_system_fallback():
    start = INDEX.index('async function openPdfPreview')
    end = INDEX.index("$('#pdfViewerClose')", start)
    body = INDEX[start:end]
    assert 'L26PdfReader.open' in body
    assert 'onText' not in body
    assert 'applyReadCandidates' not in body
    assert 'systemUrl' in body


def test_web_source_reader_is_separate_from_pdf_attachment_pipeline():
    start = INDEX.index('async function openCaseSource')
    end = INDEX.index('function caseFieldValue', start)
    body = INDEX[start:end]
    assert 'readPdfDocumentIntoCase' not in body
    assert 'openPdfPreview' not in body
    assert 'window.L26Android?.openSource' in body
    assert 'window.l26Desktop?.openSource' in body


def test_reader_exports_full_document_text_extraction_for_auto_fill():
    assert 'async function extractDocumentText' in READER
    assert 'async function extractTextFromPdf' in READER
    assert 'extractDocumentText' in READER.split('return {', 1)[1]


def test_pdf_upload_auto_reads_and_applies_detected_fields():
    assert 'async function readPdfDocumentIntoCase' in INDEX
    start = INDEX.index('async function readPdfDocumentIntoCase')
    end = INDEX.index('function pdfMatchConfirmation', start)
    body = INDEX[start:end]
    assert 'L26PdfReader.extractDocumentText' in body
    assert 'ImportRules.detectFields' in body
    assert 'applyReadCandidates' in body


def test_manual_attachment_auto_reads_pdf_without_area_reader_fallback():
    start = INDEX.index('function chooseCaseAttachment')
    end = INDEX.index('function openCaseSource', start)
    body = INDEX[start:end]
    assert 'readPdfDocumentIntoCase' in body
    assert 'openPdfPreview' not in body
    assert 'readCount' in body


def test_import_pdf_auto_reads_after_attaching_to_matched_case():
    start = INDEX.index('async function importAndMatchPdfFiles')
    end = INDEX.index("$('#pdfAutoImport')", start)
    body = INDEX[start:end]
    assert 'readPdfDocumentIntoCase' in body


def test_read_candidates_support_location_fields_from_pdf_or_page():
    start = INDEX.index('async function applyReadCandidates')
    end = INDEX.index('async function readPdfDocumentIntoCase', start)
    body = INDEX[start:end]
    for field in ('district', 'locality', 'province', 'canton'):
        assert field in body

def test_attached_pdf_text_extraction_has_automatic_ocr_fallback_without_ui_area_reader():
    reader = READER
    start = reader.index('async function extractDocumentText')
    end = reader.index('function textItemsForViewport', start)
    body = reader[start:end]
    assert 'ocrFallback' in body
    assert 'extractOcrTextFromPdf' in body
    assert 'TextDetector' in reader
