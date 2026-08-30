from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=(ROOT/'index.html').read_text(encoding='utf-8')
RULES=(ROOT/'app/assets/import_rules.js').read_text(encoding='utf-8')

def test_reader_uses_protection_before_applying_detected_fields():
    assert 'ImportRules.protectReaderFields' in INDEX
    assert 'L26IntegrityCore.normalizeDistrict' in INDEX

def test_reader_records_identity_conflict_without_overwriting_tramite():
    assert 'identityConflicts' in INDEX
    assert "['plano','owner','ownerId','registryArea','processType']" in INDEX
    assert "['tramite','plano','owner','ownerId','registryArea','processType']" not in INDEX

def test_import_rules_exports_reader_protection():
    assert 'protectReaderFields' in RULES
