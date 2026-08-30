from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SW=(ROOT/'sw.js').read_text(encoding='utf-8')
INDEX=(ROOT/'index.html').read_text(encoding='utf-8')

def test_integrity_core_is_precached_for_offline_startup():
    assert "'./app/assets/l26_integrity_core.js'" in SW

def test_service_worker_cache_version_marks_integrity_release():
    first=SW.splitlines()[0]
    assert 'integridad-recuperacion' in first.lower()

def test_integrity_script_loads_before_excel_import_core():
    assert INDEX.index('app/assets/l26_integrity_core.js') < INDEX.index('app/assets/l26_excel_import_core.js')
