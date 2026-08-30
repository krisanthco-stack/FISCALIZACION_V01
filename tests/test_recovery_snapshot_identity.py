from pathlib import Path
INDEX=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

def test_recovery_snapshot_checks_transaction_before_merge():
    assert 'L26IntegrityCore.recordsMayMerge(existing,incoming)' in INDEX
    assert 'const collision=existing&&!mayMerge' in INDEX

def test_recovery_snapshot_rekeys_case_and_attachments_on_collision():
    assert 'if(collision)restored.id=uid()' in INDEX
    assert 'p.caseId=restored.id' in INDEX
    assert 'd.caseId=restored.id' in INDEX
