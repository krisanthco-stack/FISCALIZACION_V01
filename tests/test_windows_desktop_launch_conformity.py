from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')


def test_root_has_one_click_windows_desktop_launcher():
    launcher = ROOT / 'ABRIR_L26_WINDOWS.cmd'
    assert launcher.exists(), 'Falta lanzador de escritorio en la raiz'
    text = launcher.read_text(encoding='utf-8', errors='ignore').lower()
    assert 'desktop' in text
    assert 'npm install' in text
    assert 'npm start' in text
    assert 'start index.html' not in text
    assert 'start chrome' not in text
    assert 'start msedge' not in text


def test_windows_browser_mode_does_not_silently_open_source_in_chrome():
    start = HTML.index('async function openCaseSource(c)')
    end = HTML.index('function caseFieldValue', start)
    fn = HTML[start:end]
    assert 'window.l26Desktop?.openSource' in fn
    assert 'navigator.userAgent' in fn or 'navigator.platform' in fn
    assert 'ABRIR_L26_WINDOWS.cmd' in fn
    assert "window.open(c.sourceLink,'_blank'" in fn, 'Se conserva fallback para plataformas no Windows'


def test_windows_launcher_is_documented_as_required_for_internal_reader():
    doc = (ROOT / 'desktop' / 'README_WINDOWS.md').read_text(encoding='utf-8')
    assert 'ABRIR_L26_WINDOWS.cmd' in doc
    assert 'lector web interno' in doc.lower()


def test_service_worker_refreshes_windows_desktop_guard_change():
    sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
    assert 'windows-desktop-launch-v1' in sw
