from pathlib import Path
INDEX=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

def test_import_identity_does_not_fall_back_to_property_only_identity():
    start=INDEX.index('function importIdentity(c){')
    end=INDEX.index('\nfunction ', start+1)
    block=INDEX[start:end]
    assert 'L26IntegrityCore.caseIdentityKey' in block
    assert 'ImportRules.propertyIdentity' not in block
