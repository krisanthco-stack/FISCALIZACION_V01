from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

def test_general_offers_posesoria_only_without_folio_or_finca():
    assert 'id="posesoriaOption"' in HTML
    assert 'data-path="general.informacionPosesoria"' in HTML
    assert 'function refreshPosesoriaOption' in HTML
    assert "general?.folio" in HTML and "general?.finca" in HTML

def test_tramites_labels_missing_registry_identity_as_posesoria():
    assert "Información posesoria" in HTML
    assert 'function caseFolioOrFinca' in HTML

def test_json_import_uses_folio_merge_helper():
    assert 'findImportMatchByFolio' in HTML
