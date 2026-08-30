from pathlib import Path

INDEX=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

def test_global_integrity_audit_controls_exist():
    assert 'id="integrityAuditBtn"' in INDEX
    assert 'id="integrityAuditExportBtn"' in INDEX
    assert 'id="integrityAuditSummary"' in INDEX

def test_global_integrity_audit_is_read_only_and_exportable():
    assert 'async function runIntegrityAudit()' in INDEX
    assert 'L26IntegrityCore.auditIntegrity(cases,documents)' in INDEX
    assert 'Auditoria_Integridad_L26_' in INDEX
