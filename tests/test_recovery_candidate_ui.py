from pathlib import Path
INDEX=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

def test_integrity_audit_counts_recovery_candidates():
    assert 'L26IntegrityCore.findRecoveryCandidates(cases,recovery)' in INDEX
    assert 'Copias recuperables' in INDEX

def test_recovery_panel_marks_transaction_collision():
    assert 'TRÁMITE DISTINTO' in INDEX
    assert 'L26IntegrityCore.recordsMayMerge(currentCase,r.case)' in INDEX
