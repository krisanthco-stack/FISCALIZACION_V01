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


def test_windows_browser_mode_restores_documented_web_fallback():
    start = HTML.index('async function openCaseSource(c)')
    end = HTML.index('function caseFieldValue', start)
    fn = HTML[start:end]
    assert 'window.l26Desktop?.openSource' in fn
    assert 'return openWebSourceLink(source)' in fn
    assert 'windowsBrowser' not in fn, 'Una PWA de Windows no debe depender del protocolo Electron para abrir Metro'
    assert 'aplicación de escritorio instalada' not in fn, 'No debe bloquearse la apertura web con el aviso de modo PWA'


def test_windows_launcher_is_documented_as_required_for_internal_reader():
    doc = (ROOT / 'desktop' / 'README_WINDOWS.md').read_text(encoding='utf-8')
    assert 'ABRIR_L26_WINDOWS.cmd' in doc
    assert 'lector web interno' in doc.lower()


def test_service_worker_refreshes_windows_desktop_guard_change():
    sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
    assert 'windows-desktop-launch-v1' in sw


def test_windows_desktop_reader_survives_missing_preload_bridge():
    main = (ROOT / 'desktop' / 'main.js').read_text(encoding='utf-8')
    start = HTML.index('async function openCaseSource(c)')
    end = HTML.index('function caseFieldValue', start)
    fn = HTML[start:end]
    assert 'l26Desktop=1' in main, 'Electron debe marcar inequívocamente la ventana principal como escritorio'
    assert 'l26-reader:' in main, 'El proceso principal debe interceptar una ruta nativa de respaldo'
    assert 'l26DesktopReaderFallbackUrl(c)' in fn, 'Abrir enlace debe invocar el fallback nativo si el preload no expone l26Desktop'
    assert 'l26-reader://open' in HTML, 'El fallback debe usar el protocolo interno interceptado por Electron'
    assert 'l26DesktopReaderDataFallback' in HTML, 'La lectura debe poder regresar al expediente aun sin el bridge preload'
