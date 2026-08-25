from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
BASE=Path('/mnt/data/Fiscalizacion_BI_V27_3_1_RECTIFICACION_DATOS.html')
if BASE.exists():
    old=BASE.read_text(encoding='utf-8')
    old_ids=set(re.findall(r'\bid=["\']([^"\']+)["\']',old)); new_ids=set(re.findall(r'\bid=["\']([^"\']+)["\']',HTML))
    assert old_ids <= new_ids, f'IDs eliminados: {sorted(old_ids-new_ids)[:20]}'
    def nav(text): return re.findall(r'<a class="nav-btn(?: active)?"[^>]*data-target="([^"]+)"[^>]*>.*?</span>\s*([^<]+)</a>',text,re.S)[:8]
    assert nav(old)==nav(HTML),'Se alteró la navegación V27 fuera del cargador.'
for token in [
    'function looksLikeImportCase','function collectImportCaseRecords','function adaptLegacyCaseShape','function findArchiveEntry',
    'Cargar JSON / ZIP','accept=".zip,.json,application/zip,application/json"',"const APP_VERSION='"
]: assert token in HTML, token
assert "data?.schema!=='FiscalizacionBIExport'||!data.case" not in HTML
assert "const expedienteName=findArchiveEntry(files,'expediente.json'),expedientesName=findArchiveEntry(files,'expedientes.json')" in HTML
assert "Object.keys(files).filter(name=>/\\.json$/i.test(name))" in HTML
assert 'restoreArchiveAttachmentMetadata' in HTML
print('OK: compatibilidad JSON/ZIP y estructura V27 preservada')
