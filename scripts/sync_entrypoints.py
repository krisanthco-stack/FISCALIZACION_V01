#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'index.html').read_text(encoding='utf-8')
(ROOT/'Fiscalizacion_BI_V27_FINAL.html').write_text(source,encoding='utf-8')
print('full functional entrypoint synchronized')
