from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
ALT = (ROOT / 'Fiscalizacion_BI_V27_FINAL.html').read_text(encoding='utf-8')
PDF = (ROOT / 'app/assets/l26_pdf_reader.js').read_text(encoding='utf-8')
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')
MGMT = (ROOT / 'app/assets/l26_management_core.js').read_text(encoding='utf-8')
INTEGRITY = (ROOT / 'app/assets/l26_integrity_core.js').read_text(encoding='utf-8')
TERRITORY = (ROOT / 'app/assets/l26_territory_core.js').read_text(encoding='utf-8')
ANDROID_MAIN = (ROOT / 'android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/MainActivity.java').read_text(encoding='utf-8')
ANDROID_READER = (ROOT / 'android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/ReaderActivity.java').read_text(encoding='utf-8')
DESKTOP = (ROOT / 'desktop/main.js').read_text(encoding='utf-8')


def test_entrypoints_are_identical_and_database_is_not_destructively_migrated():
    assert ALT == HTML
    assert "DB_NAME='LibretaValoracionCR'" in HTML or 'LibretaValoracionCR' in HTML
    assert 'DB_VERSION=6' in HTML.replace(' ', '')
    assert 'deleteDatabase' not in HTML


def test_management_summary_and_actions_match_requested_rules():
    assert 'summaryCounts(all,managementInspectionCompleted)' in HTML
    assert 'summaryCounts' in MGMT and 'activeCount' in MGMT
    assert 'managementRegisteredFilter' in HTML and 'managementNotifiedFilter' in HTML
    assert 'Notificado / Registrado' in HTML
    assert 'management-action-blue' in MGMT and 'management-action-red' in MGMT and 'management-action-yellow' in MGMT


def test_compact_district_layout_applies_to_tramites_and_gestion():
    assert 'id="caseList"' in HTML and 'case-hierarchy compact-district-grid' in HTML
    assert 'id="managementList"' in HTML and 'case-hierarchy compact-district-grid' in HTML
    assert 'repeat(6,minmax(0,1fr))' in HTML


def test_general_information_label_and_gps_subsection_are_preserved():
    assert '> Información General</a>' in HTML
    assert '<h2>Información General</h2>' in HTML
    assert '<h3>Ubicación de la inspección</h3>' in HTML


def test_pdf_flow_is_local_versioned_and_separate_from_web_reader_controls():
    assert 'pdfjs-4.10.38-legacy/pdf.min.mjs' in PDF
    assert 'pdfjs-4.10.38-legacy/pdf.worker.min.mjs' in PDF
    assert 'l26-pdfjs-4.10.38-legacy-v2' in PDF
    assert 'cdn.jsdelivr.net/npm/pdfjs-dist' not in PDF and 'unpkg.com/pdfjs-dist' not in PDF
    assert 'pdfViewerReadPage' not in HTML and 'pdfViewerSelectArea' not in HTML
    assert 'onlyMissing:true' in HTML
    assert 'readPdfDocumentIntoCase' in HTML
    assert 'pdfjs-4.10.38-legacy/pdf.min.mjs' in SW


def test_web_reader_has_one_active_internal_flow_per_installed_platform():
    assert 'async function readCaseSource' not in HTML
    assert 'window.L26Android?.openSource' in HTML
    assert 'window.l26Desktop?.openSource' in HTML
    assert 'waitForRemotePageReady' in DESKTOP and '60000' in DESKTOP
    assert 'readRemotePage' in DESKTOP and 'readRemoteArea' in DESKTOP
    assert '@JavascriptInterface' in ANDROID_MAIN and 'openSource' in ANDROID_MAIN
    assert 'waitUntilPageReady' in ANDROID_READER and '60000L' in ANDROID_READER
    assert 'readPage()' in ANDROID_READER and 'readArea()' in ANDROID_READER


def test_transaction_and_territory_integrity_rules_remain_protected():
    assert 'T:${tramite}' in INTEGRITY
    assert 'if(hasTramiteConflict(a,b))returnfalse' in INTEGRITY.replace(' ', '')
    assert "['hoquetas','Las Horquetas']" in INTEGRITY
    assert 'comparisonKey' in TERRITORY and 'ARTICLES' in TERRITORY
    assert 'INFERRED_FROM_PLACE' in TERRITORY


def test_pagination_croquis_services_and_management_observation_remain_present():
    assert 'HIERARCHY_PAGE_SIZE=25' in HTML.replace(' ', '')
    assert 'hierarchyOpenState' in HTML
    assert 'vertex-entry-accordion' in HTML
    assert 'manualPlacement' in HTML
    assert 'data-selection-label="Servicios 1"' in HTML and 'data-selection-label="Servicios 2"' in HTML
    assert 'managementObservation' in HTML and 'management-observation-badge' in HTML
