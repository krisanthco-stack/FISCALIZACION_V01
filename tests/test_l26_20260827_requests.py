from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
CORE=(ROOT/'app/assets/l26_croquis_core.js').read_text(encoding='utf-8')


def function_block(name,next_name=None):
    needles=[f'function {name}',f'async function {name}']
    starts=[HTML.find(x) for x in needles if HTML.find(x)>=0]
    assert starts, f'No existe {name}'
    start=min(starts)
    if next_name:
        ends=[HTML.find(f'function {next_name}',start+1),HTML.find(f'async function {next_name}',start+1)]
        ends=[x for x in ends if x>=0]
        if ends:return HTML[start:min(ends)]
    return HTML[start:start+9000]


def test_default_link_and_single_link_ui_contract():
    assert "const DEFAULT_CASE_SOURCE_URL='https://metro.sarapiqui.go.cr/'" in HTML
    assert '<span>ID importado</span>' not in HTML
    assert HTML.count('Enlace importado desde Excel / ID') == 1
    blank=function_block('blankCase','blankConstruction')
    assert 'sourceLink:DEFAULT_CASE_SOURCE_URL' in blank
    normalize=function_block('normalizeCase','mergeCaseRecords')
    assert 'DEFAULT_CASE_SOURCE_URL' in normalize
    imported=function_block('mapImportedRow','propertyIdentityCandidate')
    assert 'DEFAULT_CASE_SOURCE_URL' in imported


def test_water_question_no_longer_has_duplicate_colinda_choice():
    assert '¿Afectado por cauce/cuerpo de agua?' in HTML
    assert '¿Afectado o colinda con cauce/cuerpo de agua?' not in HTML
    select=re.search(r'<select id="waterAffectedSelect".*?</select>',HTML,re.S).group(0)
    assert '<option value="No">No</option>' in select
    assert '<option value="Afectado">Afectado</option>' in select
    assert 'Colinda con' not in select
    active=function_block('waterConditionActive','updateWaterDetails')
    assert "['Afectado','Sí']" in active


def test_croquis_move_is_not_relaid_out_after_pointer_up():
    bind=function_block('bindManualSketch','bindConstructionSketch')
    render=re.search(r'const render=\(\)=>\{.*?\};\n  const nameInput',bind,re.S).group(0)
    assert 'layoutCompoundPolygons(sketch)' not in render
    assert "history(wasMove?'mover-poligono'" in bind


def test_croquis_number_and_name_labels_and_no_perimeter_output():
    draw=function_block('drawCompoundSketch','manualSketchHtml')
    assert 'croquisDrawingRect' in draw
    assert 'polygonLegendLayout' in HTML
    assert 'legend.items.forEach' in draw
    assert 'polygonLabelAnchor' not in draw
    assert 'ctx.fillText(String(pi+1)' in draw
    assert 'Perímetro de control' not in HTML
    assert ' · perímetro ' not in draw
    assert ' · Perímetro de control:' not in HTML
    assert 'function polygonLegendLayout' in CORE
    assert 'function projectMetricPolygonsCommonScale' in CORE


def test_signature_heading_word_is_removed_from_generated_report():
    assert 'resolution-signature-cell" rowspan="3"><b>FIRMA</b>' not in HTML
    signature=function_block('docxSignaturePanel','reportImageEntry')
    assert "docxP('FIRMA'" not in signature
    assert "docxP('Firma manuscrita o digital'" not in signature


def test_rejection_office_consecutive_uses_ms_fbi_rd_and_is_automatic():
    assert "const RECTIFICATION_PREFIX='MS-FBI-RD'" in HTML
    assert 'placeholder="MS-FBI-RD-01-2026"' in HTML
    outcome=function_block('setFiscalFinalOutcome','setFieldVisitMode')
    assert "outcome==='OBJETAR'" in outcome
    assert 'ensureRectificationNumberForCase' in outcome
    ensure=function_block('ensureRectificationNumberForCase','assignRectificationNumber')
    assert 'max+1' in ensure and 'padStart(2' in ensure


def test_management_colors_notification_and_actions():
    css=re.search(r'\.management-status-badge\{.*?@media\(max-width:900px\)',HTML,re.S).group(0)
    assert 'management-status-accepted' in css and '#e' in css
    # Aprobado verde, objetado rojo, revisión amarillo, notificado azul.
    assert re.search(r'\.management-status-accepted\{[^}]*color:#1',css)
    assert 'management-status-notified' in css
    status=function_block('managementStatus','managementCases')
    assert "label:'Aprobado'" in status and "label:'Objetado'" in status
    assert 'managementNotificationState' in status
    render=function_block('renderManagementList')
    assert 'data-management-notification' in render
    assert 'Notificado / Registrado' in render
    assert 'L26ManagementCore.colorClass' in render
    assert 'management-action-blue' in css
    assert 'data-management-package' not in render
    assert 'managementPackageExportBtn' in HTML


def test_management_keeps_year_alerts_and_active_counter_excludes_management():
    render=function_block('renderManagementList')
    assert 'L26ManagementCore.isOlderThanYear(caseChronologyDate(c))' in render
    assert 'Alarma: más de un año' in render
    active=function_block('renderCaseList')
    assert 'all.filter(c=>!managementInspectionCompleted(c))' in active
    assert 'L26ManagementCore.summaryCounts(all,managementInspectionCompleted)' in active
    assert "$('#processCaseCount').textContent=L26IntegrityCore.uniqueFolioCount(visibleCases)" in active


def test_final_decision_controls_are_compact_not_removed():
    assert '.fiscal-final-actions .btn{min-height:40px' in HTML
    for outcome in ['ACEPTAR','OBJETAR','REVISION_CAMPO']:
        assert f'data-fiscal-outcome="{outcome}"' in HTML


def test_json_imports_merge_without_replacing_existing_database():
    importer=function_block('importJsonCases','restoreArchiveAttachmentMetadata')
    saver=function_block('saveImportedCaseWithoutDuplicates','importJsonCases')
    assert 'saveImportedCaseWithoutDuplicates' in importer
    assert 'mergeCaseRecords(existing,incoming)' in saver
    assert 'clear(' not in importer.lower() and 'deletedatabase' not in importer.lower()

    management=function_block('importManagementPackage','bindPackageControls')
    assert 'mergeCaseRecords(existing,incoming)' in management
    assert 'byId=new Map' in management and 'byKey=new Map' in management
    assert 'clear(' not in management.lower() and 'deletedatabase' not in management.lower()
    assert 'sin borrar datos no vacíos' in management


def test_release_version_and_manual_cache_remain_manual_after_new_release():
    assert "const APP_VERSION='27.3.9'" in HTML
    sw=(ROOT/'sw.js').read_text(encoding='utf-8')
    assert "release-27.3.9" in sw
    assert "event.data==='SKIP_WAITING'" in sw
    assert '.then(()=>self.skipWaiting())' not in sw
