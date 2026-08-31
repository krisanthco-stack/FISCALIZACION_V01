from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

def test_operational_location_module_no_longer_uses_expediente_heading():
    assert '<div class="nav-title">Expediente de campo</div>' not in HTML
    assert '<div class="nav-title">Ubicación</div>' in HTML
    assert '<h2>Expediente municipal de inspección</h2>' not in HTML
    assert '<h2>Información General</h2>' in HTML
    assert '<h3>Ubicación de la inspección</h3>' in HTML

def test_legal_report_expediente_wording_is_preserved():
    assert 'EXPEDIENTE / TRÁMITE' in HTML
    assert 'Expediente municipal de fiscalización y toma de datos de campo' in HTML
