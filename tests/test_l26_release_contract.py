from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SW=(ROOT/'sw.js').read_text(encoding='utf-8')

def fn(name,next_name=None):
    start=HTML.index(f'function {name}') if f'function {name}' in HTML else HTML.index(f'async function {name}')
    if next_name:
        candidates=[x for x in (HTML.find(f'function {next_name}',start+1),HTML.find(f'async function {next_name}',start+1)) if x!=-1]
        return HTML[start:min(candidates)]
    return HTML[start:start+5000]

def test_management_requires_fiscal_outcome_or_legacy_completed():
    block=fn('managementInspectionCompleted','managementInspectionDate')
    assert 'ACEPTAR' in block and 'OBJETAR' in block and 'REVISION_CAMPO' in block
    assert "stage==='resolution'||stage==='completed'" not in block

def test_save_and_package_restore_use_property_identity_not_only_tramite():
    save=fn('saveCase','newCase')
    assert 'caseCoreIdentity' in save
    imp=fn('findExistingCaseForImport','saveImportedCaseWithoutDuplicates')
    assert 'caseCoreIdentity' in imp
    restore=fn('importManagementPackage','bindPackageControls')
    assert 'caseCoreIdentity' in restore

def test_pwa_waits_for_manual_activation_and_is_cache_first():
    assert 'self.skipWaiting()' not in re.search(r"self.addEventListener\('install'.*?\);",SW,re.S).group(0)
    assert "event.data==='SKIP_WAITING'" in SW
    assert 'caches.match(event.request)' in SW
    assert "./app/assets/l26_excel_import_core.js" in SW
    assert "./app/assets/l26_croquis_core.js" in SW

def test_croquis_integration_has_name_factors_vertex_rotate_move_and_history():
    for token in ['data-polygon-name','data-polygon-factor="2"','data-polygon-factor="0.5"','data-manual-action="deletevertex"','data-manual-action="rotate"','data-manual-action="move"','recordCroquisHistory','dimensionGeometry']:
        assert token in HTML, token
    assert 'data-polygon-factor="1"' not in HTML

def test_app_index_is_compatibility_redirect_to_canonical_root():
    text=(ROOT/'app/index.html').read_text(encoding='utf-8')
    assert '../index.html' in text
    assert 'location.replace' in text

def test_empty_observations_are_omitted_from_html_and_docx_reports():
    report=fn('buildReportHtml','refreshInlineReportPreview')
    docx=fn('makeDocx')
    assert "Sin observaciones adicionales registradas." not in report
    assert "Sin observaciones adicionales registradas." not in docx
    assert "terrainTechnicalObservation" in report
    assert "terrainTechnicalObservation" in docx

def test_management_filter_is_same_visual_component_and_title_is_fiscalized_only():
    assert HTML.count('class="base-local-filter-panel"') >= 2
    assert 'management-filter-panel' not in HTML
    assert '<h3 id="managementCasesTitle">Trámites fiscalizados</h3>' in HTML
    assert 'Trámites con inspección de campo realizada' not in HTML

def test_report_has_three_numbered_modules_and_rectification_is_conditional():
    for label in ['1 · Informe de toma de datos de campo','2 · Resolución Administrativa','3 · Solicitud de Rectificación']:
        assert label in HTML
    assert 'id="reportRectificationModule" hidden' in HTML
    visibility=fn('updateReportModuleVisibility','projectReportHtml')
    assert "finalOutcome==='OBJETAR'" in visibility

def test_fiscalization_has_visit_mode_and_three_final_decisions_with_management_colors():
    for token in [
        'data-field-visit-mode="CON_VISITA"',
        'data-field-visit-mode="SIN_VISITA"',
        'data-fiscal-outcome="ACEPTAR"',
        'data-fiscal-outcome="OBJETAR"',
        'data-fiscal-outcome="REVISION_CAMPO"',
    ]:
        assert token in HTML, token
    assert '.management-status-accepted' in HTML
    assert '.management-status-objected' in HTML
    assert '.management-status-field-review' in HTML
    assert "label:'Aprobado'" in HTML
    assert "label:'Objetado'" in HTML
    assert "label:'Para revisión campo'" in HTML


def test_download_filename_contracts_are_encoded_in_report_and_rectification_helpers():
    report=fn('fiscalReportDownloadName','rectificationDownloadName')
    rect=fn('rectificationDownloadName')
    assert "'_OB-'" in report
    assert "'_AC-'" in report
    assert '`MS_RECT_${' in rect


def test_agro_water_and_street_level_controls_have_expected_choices_and_dynamic_hooks():
    assert 'id="terrainAgroDeclaredSelect"' in HTML
    assert '<option value="Sí">Sí</option>' in HTML and '<option value="No">No</option>' in HTML
    assert 'id="terrainAgroActivityField"' in HTML
    assert 'id="waterAffectedSelect"' in HTML
    for value in ['No','Afectado']:
        assert f'<option value="{value}">{value}</option>' in HTML
    select=HTML.split('id="waterAffectedSelect"',1)[1].split('</select>',1)[0]
    assert 'Colinda con' not in select
    assert 'id="waterDetails"' in HTML
    assert 'id="streetLevelSelect"' in HTML
    for value in ['1','0','-1']:
        assert f'<option value="{value}"' in HTML
    assert 'updateTerrainAgro' in HTML
    assert 'updateWaterDetails' in HTML
    assert 'updateStreetLevelCompact' in HTML


def test_audit_items_can_navigate_expand_focus_highlight_and_reaudit():
    block=fn('navigateToAuditIssue','renderAudit')
    assert 'audit-target-highlight' in HTML
    assert 'scrollIntoView' in block
    assert '.focus' in block or 'focus(' in block
    render=fn('renderAudit')
    assert "data.auditTarget" in render or 'dataset.auditTarget' in render
    assert "addEventListener('click',()=>navigateToAuditIssue(index))" in render


def test_legacy_recovery_does_not_delete_prior_databases_and_update_check_is_button_driven():
    assert 'indexedDB.databases()' in HTML
    assert 'deleteDatabase' not in HTML
    assert "$('#appUpdateBtn')?.addEventListener('click',handleAppUpdate)" in HTML
    assert 'setInterval(()=>checkForAppUpdate' not in HTML
    assert "addEventListener('focus',checkForAppUpdate" not in HTML
    assert "reg.update()" in fn('checkForAppUpdate','applyAppUpdate')
