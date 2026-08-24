#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
s=(ROOT/'app/index.html').read_text(encoding='utf-8')
root=s.replace('src="assets/','src="app/assets/').replace('href="assets/','href="app/assets/').replace('href="../templates/','href="templates/')
(ROOT/'index.html').write_text(root,encoding='utf-8')
(ROOT/'Fiscalizacion_BI_V27_FINAL.html').write_text(root,encoding='utf-8')
print('entrypoints synchronized')
