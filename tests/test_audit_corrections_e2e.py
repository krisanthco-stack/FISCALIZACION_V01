from pathlib import Path
import contextlib
import http.server
import socketserver
import threading
import os
import pytest

ROOT = Path(__file__).resolve().parents[1]

@contextlib.contextmanager
def serve_repo():
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    handler = lambda *a, **kw: Handler(*a, directory=str(ROOT), **kw)
    with socketserver.TCPServer(('127.0.0.1', 0), handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f'http://127.0.0.1:{server.server_address[1]}/index.html'
        finally:
            server.shutdown()
            thread.join(timeout=2)


def chromium_path():
    for candidate in ('/usr/bin/chromium', '/usr/bin/chromium-browser'):
        if Path(candidate).exists():
            return candidate
    return None

pytestmark = pytest.mark.skipif(
    os.environ.get('RUN_BROWSER_E2E') != '1' or not chromium_path(),
    reason='Browser E2E requires RUN_BROWSER_E2E=1 and local Chromium',
)


def open_app():
    from playwright.sync_api import sync_playwright
    p = sync_playwright().start()
    browser = context = server = None
    try:
        browser = p.chromium.launch(headless=True, executable_path=chromium_path(), args=['--no-sandbox'])
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        server = serve_repo()
        url = server.__enter__()
        page.goto(url, wait_until='load')
        page.wait_for_function("typeof idbAll === 'function' && typeof blankCase === 'function' && !!window.L26IntegrityCore")
        page.wait_for_timeout(250)
        return p, browser, context, page, server
    except Exception:
        if server is not None:
            server.__exit__(None, None, None)
        if context is not None:
            context.close()
        if browser is not None:
            browser.close()
        p.stop()
        raise


def close_app(p, browser, context, server):
    context.close()
    browser.close()
    p.stop()
    server.__exit__(None, None, None)


def test_startup_physically_consolidates_historical_duplicate_folios_and_relinks_attachments():
    p, browser, context, page, server = open_app()
    try:
        page.evaluate("""async () => {
          const a=blankCase(); a.id='dup-a'; a.general.tramite='T-A'; a.general.folio='275480'; a.general.finca='275480'; a.general.owner='Persona A'; a.updatedAt='2026-08-20T10:00:00.000Z';
          const b=blankCase(); b.id='dup-b'; b.general.tramite='T-B'; b.general.folio='275480'; b.general.finca='275480'; b.general.ownerId='0102030405'; b.status='Finalizado'; b.workflow.stage='completed'; b.updatedAt='2026-08-21T10:00:00.000Z';
          await idbPut(STORE_CASES,a); await idbPut(STORE_CASES,b);
          await idbPut(STORE_PHOTOS,{id:'photo-a',caseId:'dup-a',category:'Terreno',blob:new Blob([new Uint8Array([1,2,3])],{type:'image/jpeg'})});
          await idbPut(STORE_DOCUMENTS,{id:'doc-b',caseId:'dup-b',originalName:'prueba.pdf',blob:new Blob([new Uint8Array([4,5,6])],{type:'application/pdf'})});
        }""")
        assert page.evaluate("(async()=> (await idbAll(STORE_CASES)).filter(c=>L26IntegrityCore.importFolioKey(c)==='275480').length)()") == 2
        page.reload(wait_until='load')
        page.wait_for_function("typeof idbAll === 'function' && !!window.L26IntegrityCore")
        page.wait_for_timeout(500)
        state = page.evaluate("""async () => {
          const cases=(await idbAll(STORE_CASES)).filter(c=>L26IntegrityCore.importFolioKey(c)==='275480');
          const photos=await idbAll(STORE_PHOTOS), docs=await idbAll(STORE_DOCUMENTS), recovery=await idbAll(STORE_RECOVERY_CASES);
          return {cases, photos, docs, recovery};
        }""")
        assert len(state['cases']) == 1, state
        survivor = state['cases'][0]
        assert survivor['id'] == 'dup-b', survivor
        assert survivor['general']['owner'] == 'Persona A'
        assert survivor['general']['ownerId'] == '0102030405'
        assert survivor['workflow']['stage'] == 'completed'
        assert next(p for p in state['photos'] if p['id']=='photo-a')['caseId'] == 'dup-b'
        assert next(d for d in state['docs'] if d['id']=='doc-b')['caseId'] == 'dup-b'
        assert any('Consolidación automática por Folio' in (r.get('reason') or '') for r in state['recovery'])
    finally:
        close_app(p, browser, context, server)


def test_global_json_export_and_non_destructive_reimport_restores_all_current_attachments(tmp_path):
    p, browser, context, page, server = open_app()
    try:
        page.evaluate("""async () => {
          const a=blankCase(); a.id='case-active'; a.general.tramite='A-1'; a.general.folio='111111'; a.general.finca='111111'; a.general.owner='Activa'; a.updatedAt=new Date().toISOString();
          const b=blankCase(); b.id='case-management'; b.general.tramite='G-1'; b.general.folio='222222'; b.general.finca='222222'; b.general.owner='Gestión'; b.status='Finalizado'; b.workflow.stage='completed'; b.updatedAt=new Date().toISOString();
          await idbPut(STORE_CASES,a); await idbPut(STORE_CASES,b);
          await idbPut(STORE_PHOTOS,{id:'photo-global',caseId:'case-active',category:'Terreno',blob:new Blob([new Uint8Array([7,8,9])],{type:'image/jpeg'})});
          await idbPut(STORE_DOCUMENTS,{id:'doc-global',caseId:'case-management',originalName:'global.pdf',mimeType:'application/pdf',blob:new Blob([new Uint8Array([10,11,12])],{type:'application/pdf'})});
          await renderCaseList();
        }""")
        assert page.locator('#globalJsonExportBtn').count() == 1
        with page.expect_download() as info:
            page.click('#globalJsonExportBtn')
        out = tmp_path / 'respaldo_global.json'
        info.value.save_as(out)
        payload = __import__('json').loads(out.read_text(encoding='utf-8'))
        assert payload['schema'] == 'FiscalizacionBIGlobalExport'
        assert payload['counts']['cases'] == 2
        assert {c['id'] for c in payload['cases']} == {'case-active','case-management'}
        assert any(x['id']=='photo-global' and x.get('blobData','').startswith('data:image/jpeg') for x in payload['attachments']['photos'])
        assert any(x['id']=='doc-global' and x.get('blobData','').startswith('data:application/pdf') for x in payload['attachments']['documents'])

        # Delete attachments only; reimport must restore them and not duplicate cases.
        page.evaluate("""async () => { await idbDelete(STORE_PHOTOS,'photo-global'); await idbDelete(STORE_DOCUMENTS,'doc-global'); }""")
        page.set_input_files('#expedientePackageImport', str(out))
        page.wait_for_timeout(900)
        restored = page.evaluate("""async () => ({
          cases:(await idbAll(STORE_CASES)).filter(c=>['111111','222222'].includes(L26IntegrityCore.importFolioKey(c))).map(c=>c.id),
          photos:(await idbAll(STORE_PHOTOS)).filter(x=>x.id==='photo-global').map(x=>x.caseId),
          docs:(await idbAll(STORE_DOCUMENTS)).filter(x=>x.id==='doc-global').map(x=>x.caseId)
        })""")
        assert sorted(restored['cases']) == ['case-active','case-management']
        assert restored['photos'] == ['case-active']
        assert restored['docs'] == ['case-management']
    finally:
        close_app(p, browser, context, server)
