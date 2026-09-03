from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SW=(ROOT/'sw.js').read_text(encoding='utf-8')
READER=(ROOT/'app/assets/l26_pdf_reader.js').read_text(encoding='utf-8')

def test_service_worker_prewarms_pdfjs_engine_for_offline_first_open():
    assert 'pdf.min.mjs' in SW
    assert 'pdf.worker.min.mjs' in SW
    assert 'l26-pdfjs-4.10.38-legacy-v2' in SW
    assert 'l26-pdfjs-6.2.108' not in SW
    assert 'prewarmPdfJs' in SW

def test_reader_uses_same_pdfjs_cache_as_service_worker():
    assert "const PDFJS_CACHE='l26-pdfjs-4.10.38-legacy-v2'" in READER
