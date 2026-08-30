from pathlib import Path
INDEX=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

def test_excel_import_normalizes_district_and_preserves_invalid_raw_value():
    assert 'L26IntegrityCore.normalizeDistrict(rawDistrict)' in INDEX
    assert 'invalidDistrict:rawDistrict' in INDEX

def test_legacy_row_mapper_uses_same_district_validation():
    assert 'const rawDistrict=String(pick(\'district\')||\'\').trim()' in INDEX
