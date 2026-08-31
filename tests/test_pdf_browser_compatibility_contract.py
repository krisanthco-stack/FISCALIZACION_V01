from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
READER = (ROOT / 'app/assets/l26_pdf_reader.js').read_text(encoding='utf-8')
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')


def test_pdfjs_uses_legacy_compatible_release_instead_of_v6():
    assert "PDFJS_VERSION='4.10.38'" in READER
    assert 'pdfjs-dist@4.10.38/legacy/build/pdf.min.mjs' in READER
    assert 'pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs' in READER
    assert 'pdfjs-dist@6.2.108' not in READER


def test_reader_installs_uint8_hex_compatibility_before_importing_pdfjs():
    assert 'function installTypedArrayCompatibility' in READER
    assert 'Uint8Array.prototype.toHex' in READER
    assert 'Uint8Array.fromHex' in READER
    compat_pos = READER.index('installTypedArrayCompatibility();')
    import_pos = READER.index('await import(moduleBlobUrl)')
    assert compat_pos < import_pos


def test_service_worker_prewarms_same_compatible_pdfjs_release_and_new_cache():
    assert "PDFJS_CACHE='l26-pdfjs-4.10.38-legacy'" in SW
    assert 'pdfjs-dist@4.10.38/legacy/build/pdf.min.mjs' in SW
    assert 'pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs' in SW
    assert 'l26-pdfjs-6.2.108' not in SW
    assert 'pdfjs-dist@6.2.108' not in SW


def test_shell_cache_version_changes_for_pdf_compatibility_update():
    first_line = SW.splitlines()[0]
    assert 'pdf-compat-v1' in first_line


def test_vendor_script_has_two_sources_and_fails_build_if_both_are_unavailable():
    vendor = (ROOT / 'scripts/vendor_pdfjs.py').read_text(encoding='utf-8')
    assert 'unpkg.com/pdfjs-dist@4.10.38' in vendor
    assert 'cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38' in vendor
    assert 'for url in urls' in vendor
    assert "if args.required" in vendor
