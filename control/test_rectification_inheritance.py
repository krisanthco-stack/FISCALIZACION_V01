from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text(encoding='utf-8')

for field_id,label in [
    ('rectificationReportTramite','Trámite/DBI'),
    ('rectificationReportOwner','Propietario'),
    ('rectificationReportOwnerId','Identificación'),
    ('rectificationReportFinca','Finca'),
    ('rectificationReportPlano','Plano'),
]:
    assert re.search(rf'<input[^>]+id="{field_id}"[^>]+readonly',html),f'{label} no está como dato heredado de solo lectura'

sync=re.search(r'function syncRectificationFromCase\(c=state\.current\)\{(.*?)\n\}',html,re.S)
assert sync,'No se encontró syncRectificationFromCase'
body=sync.group(1)
for forbidden in [
    "r.propertyDistrict=String(c.visit?.district",
    "r.ownerProvince=String(c.visit?.province",
    "r.ownerCanton=String(c.visit?.canton",
    "r.ownerDistrict=String(c.visit?.district",
    "r.propertyAddress){const parts=[c.location?.reference",
]:
    assert forbidden not in body,f'Campo no presente en Informe todavía se autocompleta: {forbidden}'

assert "r.dbi=String(c.general?.tramite||'').trim()" in body
assert "'«DBI»':c.general?.tramite||''" in html
assert "['consecutivo DBI',c.general?.tramite]" in html
assert '<tr><td>${val(c.general?.tramite)}</td><td>${val(c.general?.finca)}</td>' in html

# Campos no presentes en Informe: deben seguir enlazados a rectification y sin readonly.
for path in [
    'report.rectification.propertyRight','report.rectification.propertyDistrict','report.rectification.propertyAddress',
    'report.rectification.fiscalAddress','report.rectification.ownerProvince','report.rectification.ownerCanton',
    'report.rectification.ownerDistrict','report.rectification.cell','report.rectification.phone','report.rectification.email',
    'report.rectification.representative','report.rectification.representativeId','report.rectification.representativeCell',
    'report.rectification.fax','report.rectification.otherPhone','report.rectification.zone'
]:
    matches=re.findall(rf'<(?:input|textarea|select)[^>]*data-path="{re.escape(path)}"[^>]*>',html)
    assert matches,f'No se encontró campo editable {path}'
    assert all('readonly' not in m for m in matches),f'{path} quedó bloqueado y debe ser editable'

print('OK: herencia del Informe y editabilidad separadas correctamente')
