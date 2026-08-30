from pathlib import Path
INDEX=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

def test_merge_case_records_has_identity_guard():
    start=INDEX.index('function mergeCaseRecords(local,remote){')
    chunk=INDEX[start:start+900]
    assert 'L26IntegrityCore.recordsMayMerge(local,remote)' in chunk
    assert 'No se pueden fusionar expedientes con identidades de trámite distintas' in chunk
