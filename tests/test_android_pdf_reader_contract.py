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
        'pdfViewerFit', 'pdfViewerReadPage', 'pdfViewerSelectArea',
        'pdfViewerOpenSystem', 'pdfViewerDownload'
    ):
        assert f'id="{control}"' in INDEX


def test_pdf_viewer_is_not_iframe_only_anymore():
    assert '<iframe id="pdfViewerFrame"' not in INDEX
    assert 'L26PdfReader.open' in INDEX


def test_reader_asset_is_precached_for_offline_shell():
    assert './app/assets/l26_pdf_reader.js' in SW

READER = (ROOT / 'app/assets/l26_pdf_reader.js').read_text(encoding='utf-8')


def test_pdfjs_is_loaded_lazily_and_cached():
    assert 'pdfjs-dist@6.2.108/build/pdf.min.mjs' in READER
    assert 'pdfjs-dist@6.2.108/build/pdf.worker.min.mjs' in READER
    assert 'caches.open(PDFJS_CACHE)' in READER
    assert 'GlobalWorkerOptions.workerSrc' in READER


def test_reader_renders_pdf_pages_to_canvas():
    assert '.getDocument(' in READER
    assert '.getPage(' in READER
    assert '.render(' in READER
    assert 'devicePixelRatio' in READER
    assert 'pdfViewerPageLabel' in READER or 'pageLabel' in READER


def test_area_reader_uses_pointer_events_and_local_ocr_fallback():
    assert 'onpointerdown' in READER
    assert 'onpointermove' in READER
    assert 'onpointerup' in READER
    assert 'TextDetector' in READER
    assert 'textFromItemsInRect' in READER
    assert 'onText' in READER


def test_read_buttons_are_wired_by_reader():
    assert "byId('pdfViewerReadPage')" in READER
    assert "byId('pdfViewerSelectArea')" in READER
    assert 'readCurrentPage' in READER
    assert 'enableAreaSelection' in READER


def test_detected_case_fields_are_applied_automatically_without_prompts():
    start = INDEX.index('async function applyReadCandidates')
    end = INDEX.index('async function readCaseSource', start)
    body = INDEX[start:end]
    assert 'prompt(' not in body
    assert 'confirm(' not in body
    assert 'automáticamente' in body or 'automaticamente' in body


def test_pdf_preview_sends_selected_text_to_import_rules_and_case_updater():
    start = INDEX.index('async function openPdfPreview')
    end = INDEX.index("$('#pdfViewerClose')", start)
    body = INDEX[start:end]
    assert 'ImportRules.detectFields' in body
    assert 'applyReadCandidates' in body
    assert 'onText' in body
    assert 'systemUrl' in body


def test_reading_pdf_source_opens_internal_reader_in_area_mode():
    start = INDEX.index('async function readCaseSource')
    end = INDEX.index('async function uploadPdfDocuments', start)
    body = INDEX[start:end]
    assert 'openPdfPreview' in body
    assert 'startSelection:true' in body


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


def test_manual_attachment_auto_reads_pdf_and_falls_back_to_area_reader():
    start = INDEX.index('function chooseCaseAttachment')
    end = INDEX.index('function openCaseSource', start)
    body = INDEX[start:end]
    assert 'readPdfDocumentIntoCase' in body
    assert 'openPdfPreview' in body
    assert 'startSelection:true' in body


def test_import_pdf_auto_reads_after_attaching_to_matched_case():
    start = INDEX.index('async function importAndMatchPdfFiles')
    end = INDEX.index("$('#pdfAutoImport')", start)
    body = INDEX[start:end]
    assert 'readPdfDocumentIntoCase' in body


def test_read_candidates_support_location_fields_from_pdf_or_page():
    start = INDEX.index('async function applyReadCandidates')
    end = INDEX.index('async function readCaseSource', start)
    body = INDEX[start:end]
    for field in ('district', 'locality', 'province', 'canton'):
        assert field in body
