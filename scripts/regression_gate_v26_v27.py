#!/usr/bin/env python3
"""Regression gate for the V26/V27 baseline.

It does not modify the application. It checks the candidate for the known
regressions documented in the project history and, when a baseline is
provided, verifies that non-green CSS variables remain unchanged.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path
from typing import Iterable

TEXT_EXTS = {'.html', '.htm', '.js', '.css', '.json', '.txt', '.md', '.py', '.ts', '.tsx', '.jsx'}


def _normalize(text: str) -> str:
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r'\s+', ' ', text).strip().lower()


def _iter_text_files(path: Path) -> Iterable[Path]:
    if path.is_file():
        yield path
        return
    for p in path.rglob('*'):
        if p.is_file() and p.suffix.lower() in TEXT_EXTS:
            yield p


def _read_tree(path: Path) -> str:
    chunks = []
    for p in _iter_text_files(path):
        try:
            chunks.append(p.read_text(encoding='utf-8', errors='ignore'))
        except OSError:
            continue
    return '\n'.join(chunks)


def audit_candidate(candidate: Path | str) -> dict:
    candidate = Path(candidate)
    text = _normalize(_read_tree(candidate))
    findings = []

    if 'productos de salida' in text:
        findings.append({'code': 'R-NAME', 'severity': 'critical', 'message': 'Aparece el nombre regresivo "PRODUCTOS DE SALIDA".'})
    if 'informes' not in text:
        findings.append({'code': 'R-INFORMES', 'severity': 'critical', 'message': 'No se localiza el módulo INFORMES.'})

    if not any(x in text for x in ('cargar json', 'importar json')):
        findings.append({'code': 'R-JSON-LOAD', 'severity': 'critical', 'message': 'No se localiza la función Cargar/Importar JSON de Gestión.'})
    if not any(x in text for x in ('descargar json', 'exportar json')):
        findings.append({'code': 'R-JSON-DOWNLOAD', 'severity': 'critical', 'message': 'No se localiza la función Descargar/Exportar JSON de Gestión.'})

    if 'informe tecnico' not in text or 'resolucion' not in text:
        findings.append({'code': 'R-INFORME-RES', 'severity': 'critical', 'message': 'No se localiza la salida Informe Técnico + Resolución.'})
    if 'rectificacion' not in text:
        findings.append({'code': 'R-RECTIFICACION', 'severity': 'critical', 'message': 'No se localiza la salida Solicitud de Rectificación.'})

    return {'ok': not findings, 'candidate': str(candidate), 'findings': findings}


CSS_VAR_RE = re.compile(r'(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})')


def _css_vars(path: Path) -> dict[str, str]:
    text = _read_tree(path)
    return {name.lower(): value.lower() for name, value in CSS_VAR_RE.findall(text)}


def _rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _is_greenish(hex_color: str) -> bool:
    r, g, b = _rgb(hex_color)
    return g >= r + 12 and g >= b + 12


def _luma(hex_color: str) -> float:
    r, g, b = _rgb(hex_color)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def audit_palette(baseline: Path | str, candidate: Path | str) -> dict:
    baseline = Path(baseline)
    candidate = Path(candidate)
    old = _css_vars(baseline)
    new = _css_vars(candidate)
    findings = []

    for name, old_value in old.items():
        if name not in new:
            findings.append({'code': 'R-COLOR-MISSING', 'severity': 'major', 'message': f'Variable de color ausente: {name}.'})
            continue
        new_value = new[name]
        if new_value == old_value:
            continue
        allowed_green_change = (
            _is_greenish(old_value)
            and _is_greenish(new_value)
            and _luma(new_value) < _luma(old_value)
        )
        if not allowed_green_change:
            findings.append({
                'code': 'R-COLOR-NONGREEN',
                'severity': 'critical',
                'message': f'Color no autorizado modificado: {name} {old_value} -> {new_value}.'
            })

    return {'ok': not findings, 'baseline': str(baseline), 'candidate': str(candidate), 'findings': findings}


def main() -> int:
    ap = argparse.ArgumentParser(description='Auditor de regresión V26/V27')
    ap.add_argument('candidate', type=Path, help='Archivo o carpeta candidata')
    ap.add_argument('--baseline', type=Path, help='Archivo o carpeta V26/V27 para comparar paleta')
    ap.add_argument('--json-out', type=Path, help='Guardar resultado JSON')
    args = ap.parse_args()

    result = {'functional': audit_candidate(args.candidate)}
    if args.baseline:
        result['palette'] = audit_palette(args.baseline, args.candidate)
    result['ok'] = all(section.get('ok', True) for section in result.values() if isinstance(section, dict))

    payload = json.dumps(result, ensure_ascii=False, indent=2)
    print(payload)
    if args.json_out:
        args.json_out.write_text(payload, encoding='utf-8')
    return 0 if result['ok'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
