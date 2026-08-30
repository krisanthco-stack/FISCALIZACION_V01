from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
INDEX=(ROOT/'index.html').read_text(encoding='utf-8')

def test_pdf_matching_is_delegated_to_transaction_safe_integrity_core():
    start=INDEX.index('function findPdfCaseMatch(fileName,cases){')
    end=INDEX.index('\nfunction validatePdfFile',start)
    block=INDEX[start:end]
    assert 'L26IntegrityCore.findDocumentCaseMatch(fileName,cases)' in block
    assert 'casePdfIdentifiers' not in block
