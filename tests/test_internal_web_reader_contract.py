from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
ALT = (ROOT / 'Fiscalizacion_BI_V27_FINAL.html').read_text(encoding='utf-8')


def test_open_case_source_prefers_desktop_internal_reader_with_web_fallback():
    assert 'window.l26Desktop?.openSource' in HTML
    assert 'function openWebSourceLink(url)' in HTML
    assert 'return openWebSourceLink(source)' in HTML
    assert 'caseId:c.id' in HTML
    assert 'tramite:c.general?.tramite' in HTML


def test_reader_data_is_applied_to_exact_case_and_uses_protected_reader_pipeline():
    assert 'window.l26Desktop?.onReaderData?.(' in HTML
    assert 'payload.caseId' in HTML
    assert 'ImportRules.detectFields(payload.text' in HTML
    assert 'applyReadCandidates(target,detected' in HTML
    assert "sourceType:'pagina-interna'" in HTML


def test_alternate_entrypoint_matches_root_after_reader_change():
    assert ALT == HTML


def test_service_worker_cache_version_delivers_internal_reader_renderer_change():
    sw=(ROOT/'sw.js').read_text(encoding='utf-8')
    assert 'internal-web-reader-v1' in sw
    assert './index.html' in sw
