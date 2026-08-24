from pathlib import Path
import contextlib, http.server, socketserver, threading, zipfile, re

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app' / 'index.html'

@contextlib.contextmanager
def serve_repo():
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    handler=lambda *a, **kw: Handler(*a, directory=str(ROOT), **kw)
    with socketserver.TCPServer(('127.0.0.1',0), handler) as server:
        thread=threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            yield f'http://127.0.0.1:{server.server_address[1]}/app/index.html'
        finally:
            server.shutdown(); thread.join(timeout=2)

def assert_docx_clean(path, expected_text):
    assert zipfile.is_zipfile(path)
    with zipfile.ZipFile(path) as z:
        xml=''.join(z.read(n).decode('utf-8','ignore') for n in z.namelist() if n.endswith('.xml'))
    assert expected_text in xml
    assert not re.search(r'«[^»]+»', xml)


import os

@__import__("pytest").mark.skipif(os.environ.get("RUN_BROWSER_E2E") != "1", reason="sandbox browser navigation is blocked by administrator; enable with RUN_BROWSER_E2E=1 where permitted")
def test_offline_app_json_roundtrip_and_reports(tmp_path):
    from playwright.sync_api import sync_playwright
    with serve_repo() as url, sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
        page = browser.new_page(accept_downloads=True)
        errors=[]
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.goto(url, wait_until='load')
        page.wait_for_function('window.__appReady === true')
        assert page.locator('#selftest-status').inner_text() == 'ready'

        page.fill('#expediente', 'TEST-001')
        page.fill('#fecha_declaracion', '2026-08-23')
        page.fill('#propietario_nombre', 'Persona Prueba')
        page.fill('#propietario_identificacion', '0101010101')
        page.fill('#numero_finca', '123456')
        page.fill('#consecutivo_dbi', '2026-1')
        page.fill('#derecho', '000')
        page.fill('#distrito_inmueble', '03')
        page.fill('#direccion_finca_folio', 'Dirección de prueba')
        page.fill('#oficio_numero', 'MS-DFBI-RD-99-2026')
        page.fill('#fecha_oficio', '2026-08-23')
        page.fill('#objeto_rechazo_1', 'TERRENO')
        page.fill('#motivo_simplificado_1', 'Motivo de prueba')
        page.click('#save-state')

        page.click('[data-view="gestion"]')
        with page.expect_download() as info:
            page.click('#export-json')
        out=tmp_path/'state.json'; info.value.save_as(out)
        text=out.read_text(encoding='utf-8')
        assert 'TEST-001' in text and 'Persona Prueba' in text

        # Re-import the same backup and confirm state is restored.
        page.fill('#expediente','ALTERADO')
        page.set_input_files('#import-json', str(out))
        page.wait_for_function("document.querySelector('#expediente').value === 'TEST-001'")

        page.click('[data-view="informes"]')
        assert page.locator('#report-fiscalizacion-card').is_visible()
        assert page.locator('#report-rectificacion-card').is_visible()

        with page.expect_download() as info1:
            page.click('#download-fiscalizacion-docx')
        fiscal=tmp_path/'fiscal.docx'; info1.value.save_as(fiscal)
        assert_docx_clean(fiscal, 'TEST-001')

        with page.expect_download() as info2:
            page.click('#download-rectificacion-docx')
        rect=tmp_path/'rectificacion.docx'; info2.value.save_as(rect)
        assert_docx_clean(rect, 'MS-DFBI-RD-99-2026')

        page.click('[data-view="auditoria"]')
        audit_text=page.locator('#audit-table').inner_text()
        assert 'Guardar expediente' in audit_text
        assert 'Cargar/Importar JSON' in audit_text
        assert 'Generar Informe Técnico + Resolución' in audit_text
        assert 'Generar Solicitud de Rectificación MS_FBI_RD' in audit_text
        assert not errors, errors
        browser.close()
