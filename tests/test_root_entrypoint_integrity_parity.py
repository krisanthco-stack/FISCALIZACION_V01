from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
INDEX=(ROOT/'index.html').read_bytes()
ALT=(ROOT/'Fiscalizacion_BI_V27_FINAL.html').read_bytes()

def test_both_full_entrypoints_are_identical_integrity_release():
    assert INDEX == ALT

def test_alternate_entrypoint_has_integrity_protections():
    text=ALT.decode('utf-8')
    assert 'app/assets/l26_integrity_core.js' in text
    assert 'L26IntegrityCore.recordsMayMerge' in text
    assert 'Auditar integridad de todos' in text
