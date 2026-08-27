#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'index.html').read_text(encoding='utf-8')
(ROOT/'Fiscalizacion_BI_V27_FINAL.html').write_text(source,encoding='utf-8')
redirect='''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fiscalización BI</title><meta http-equiv="refresh" content="0; url=../index.html"><script>(function(){location.replace('../index.html'+location.search+location.hash)})();</script></head><body><p>Abriendo la aplicación… <a href="../index.html">Continuar</a></p></body></html>\n'''
(ROOT/'app/index.html').write_text(redirect,encoding='utf-8')
print('canonical entrypoint and compatibility redirect synchronized')
