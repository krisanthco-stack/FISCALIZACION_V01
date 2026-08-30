from pathlib import Path

INDEX=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

def test_import_by_id_is_guarded_by_transaction_identity():
    assert 'L26IntegrityCore.recordsMayMerge(byId,normalized)' in INDEX
    assert 'if(byId)return byId' not in INDEX

def test_legacy_recovery_does_not_merge_same_id_with_conflicting_transaction():
    assert 'L26IntegrityCore.recordsMayMerge(idCandidate,incoming)' in INDEX

def test_management_restore_guards_id_match_and_rekeys_conflict():
    assert 'L26IntegrityCore.recordsMayMerge(idCandidate,incoming)' in INDEX
    assert 'if(!existing&&byId.has(incoming.id))incoming.id=uid()' in INDEX
    assert 'existing=byId.get(incoming.id)||(key?byKey.get(key):null)' not in INDEX
