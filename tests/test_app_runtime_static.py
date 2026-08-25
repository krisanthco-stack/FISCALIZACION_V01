from pathlib import Path
import re, subprocess, json
from lxml import html

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'app/index.html'

def test_all_local_assets_exist_and_no_network_dependency():
    doc=html.fromstring(APP.read_text(encoding='utf-8'))
    refs=[]
    for attr in ('src','href'):
        refs += [v for v in doc.xpath(f'//*[@{attr}]/@{attr}') if v and not v.startswith('#')]
    assert not [r for r in refs if r.startswith(('http://','https://','//'))]
    for r in refs:
        if r.startswith(('data:','javascript:')): continue
        assert (APP.parent/r).resolve().exists(), r


def test_inline_application_javascript_has_valid_syntax(tmp_path):
    text=APP.read_text(encoding='utf-8')
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',text,flags=re.S|re.I)
    inline=[s for s in scripts if s.strip()]
    assert inline
    p=tmp_path/'app-inline.js';p.write_text(inline[-1],encoding='utf-8')
    cp=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
    assert cp.returncode==0, cp.stderr


def test_embedded_docx_engine_generates_clean_documents():
    cp=subprocess.run(['node',str(ROOT/'tests/node_docx_smoke.js')],cwd=ROOT,capture_output=True,text=True,timeout=60)
    assert cp.returncode==0, cp.stderr
    data=json.loads(cp.stdout.strip().splitlines()[-1])
    assert data['ok'] is True
    assert data['fiscal_bytes']>10000 and data['rect_bytes']>10000


def test_root_entrypoints_exist_and_are_full_app():
    for name in ('index.html','Fiscalizacion_BI_V27_FINAL.html'):
        p=ROOT/name
        assert p.exists()
        text=p.read_text(encoding='utf-8')
        assert 'Gestión' in text and 'Informes' in text and 'Auditoría' in text
        assert len(text)>1_000_000
        assert 'app/assets/import_rules.js' in text
