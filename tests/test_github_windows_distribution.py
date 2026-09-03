from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WINDOWS = ROOT / '.github' / 'workflows' / 'windows.yml'
RELEASE = ROOT / '.github' / 'workflows' / 'release.yml'
DOC = ROOT / 'docs' / 'DISTRIBUCION_WINDOWS_AUTONOMA.md'


def test_windows_workflow_matches_local_standalone_build_contract():
    text = WINDOWS.read_text(encoding='utf-8')
    for marker in [
        'python scripts/run_ci.py',
        'python scripts/vendor_pdfjs.py --required',
        'npm install --no-audit --no-fund --prefer-offline',
        'npm run dist:win',
        'python scripts/verify_packaged_runtime.py --windows desktop/dist',
    ]:
        assert marker in text
    assert 'Fiscalizacion-L26-Setup-*.exe' in text
    assert 'Fiscalizacion-L26-Portable-*.exe' in text


def test_release_workflow_applies_tag_then_runs_same_windows_packaging_sequence():
    text = RELEASE.read_text(encoding='utf-8')
    windows_section = text.split('  android:', 1)[0]
    assert 'python scripts/set_release_version.py "$GITHUB_REF_NAME"' in windows_section
    assert windows_section.index('set_release_version.py') < windows_section.index('vendor_pdfjs.py --required')
    assert 'npm install --no-audit --no-fund --prefer-offline' in windows_section
    assert 'npm run dist:win' in windows_section
    assert 'verify_packaged_runtime.py --windows desktop/dist' in windows_section


def test_distribution_doc_separates_installer_from_github_dependency():
    assert DOC.is_file(), 'falta docs/DISTRIBUCION_WINDOWS_AUTONOMA.md'
    text = DOC.read_text(encoding='utf-8', errors='replace').lower()
    assert 'no depende de github' in text
    assert 'no depende de chrome' in text
    assert 'no depende de edge' in text
    assert 'chromium' in text
    assert 'build_windows_standalone.cmd'.lower() in text
