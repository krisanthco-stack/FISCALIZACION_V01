from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

def test_recovered_documents_are_relinked_to_restored_transaction_identity():
    start=HTML.index('async function restoreRecoveryCase')
    end=HTML.index('async function renderRecoveryPanel',start)
    body=HTML[start:end]
    assert "d.expedienteNumber=String(restored.general?.tramite||'').trim()" in body
    assert "d.inspectionNumber=String(restored.general?.inspectionNumber||'').trim()" in body
    assert 'd.documentKey=makeDocumentKey(d.expedienteNumber,d.inspectionNumber,d.sha256||d.id)' in body
