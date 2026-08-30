from pathlib import Path
HTML=Path('index.html').read_text(encoding='utf-8')
READER=Path('desktop/reader.html').read_text(encoding='utf-8')
SW=Path('sw.js').read_text(encoding='utf-8')

def test_new_core_modules_are_loaded_and_cached():
    assert 'app/assets/l26_management_core.js' in HTML
    assert 'app/assets/l26_territory_core.js' in HTML
    assert 'app/assets/l26_management_core.js' in SW
    assert 'app/assets/l26_territory_core.js' in SW

def test_management_has_notified_and_registered_filters_and_action():
    assert 'id="managementNotifiedFilter"' in HTML
    assert 'id="managementRegisteredFilter"' in HTML
    assert 'Notificado / Registrado' in HTML
    assert 'registeredAt' in HTML

def test_management_observation_field_and_conditional_card_exist():
    assert 'data-path="general.managementObservation"' in HTML
    assert 'management-observation-badge' in HTML

def test_pdf_viewer_is_display_only_and_web_reader_owns_read_area():
    assert 'id="pdfViewerReadPage"' not in HTML
    assert 'id="pdfViewerSelectArea"' not in HTML
    assert 'Leer área' in READER
    assert 'Leer selección' not in READER
    assert "onlyMissing:true" in HTML

def test_location_crs_banner_removed():
    assert 'Sistema de salida: CR-SIRGAS / CRTM05' not in HTML

def test_signature_line_is_anchored_lower():
    assert '.resolution-signature-cell{position:relative' in HTML
    assert 'align-items:flex-end' in HTML
    assert 'docxSignatureBottomSpacer' in HTML

def test_services_remain_two_columns_and_only_selected_summary_is_visible():
    assert '.services-persistent-row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))' in HTML
    assert '.persistent-selection-accordion[open] .accordion-selection-value{display:none!important}' in HTML

def test_vertex_entry_is_an_accordion_without_removing_move_action():
    assert 'class="sketch-step vertex-entry-accordion"' in HTML
    assert 'data-manual-action="move"' in HTML
    assert 'vertexEntry.open=true' in HTML

def test_territory_normalization_and_safe_place_inference_are_integrated():
    assert 'L26TerritoryCore.formatDistrict(c.visit.district)' in HTML
    assert 'L26TerritoryCore.formatPlace(c.visit.locality)' in HTML
    assert 'inferAndPersistMissingDistricts' in HTML
    assert 'L26TerritoryCore.inferMissingDistricts(cases,L26IntegrityCore.normalizeDistrict)' in HTML
    assert 'L26TerritoryCore.formatDistrict(preferredProcessGeoName' in HTML
    assert 'L26TerritoryCore.formatPlace(preferredProcessGeoName' in HTML
