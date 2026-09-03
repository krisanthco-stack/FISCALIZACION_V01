from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

def test_ui_exposes_complete_json_and_zip_backups():
    assert 'id="globalJsonExportBtn"' in HTML
    assert 'id="globalZipExportBtn"' in HTML
    assert 'FiscalizacionBIGlobalExport' in HTML
    assert 'respaldo_completo.json' in HTML

def test_startup_runs_physical_historical_folio_consolidation():
    assert 'async function consolidateHistoricalFolioDuplicates' in HTML
    init=HTML[HTML.index('(async function init()'):]
    assert 'await consolidateHistoricalFolioDuplicates()' in init

def test_global_json_import_has_dedicated_attachment_restore_path():
    assert "data?.schema==='FiscalizacionBIGlobalExport'" in HTML
    assert 'restoreGlobalBackupAttachments' in HTML
    assert 'restoreGlobalBackupRecovery' in HTML
