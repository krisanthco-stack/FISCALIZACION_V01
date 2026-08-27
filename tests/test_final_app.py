from pathlib import Path
import json, zipfile

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'index.html'
COMPAT = ROOT / 'app' / 'index.html'


def test_executable_html_exists_and_contract_markers():
    assert APP.exists(), 'index.html must exist'
    text = APP.read_text(encoding='utf-8')
    for marker in ['Gestión', 'Fiscalización', 'Informes', 'Auditoría',
                   'Cargar JSON / ZIP', 'INFORME TÉCNICO DE INSPECCIÓN.',
                   'Solicitud de rectificación']:
        assert marker in text
    assert 'PRODUCTOS DE SALIDA' not in text
    compat=COMPAT.read_text(encoding='utf-8')
    assert '../index.html' in compat and 'location.replace' in compat


def test_two_official_masters_and_parametrized_fiscal_master_exist():
    paths = [
        ROOT/'templates/final/Informe_Fiscalizacion_V01_MACHOTE_FINAL.docx',
        ROOT/'templates/final/MS-FBI-RD-01-2026_RECTIFICACION_FINAL.docx',
        ROOT/'templates/parametrized/MS_FBI_RD_MACHOTE_APLICACION_V1.docx',
        ROOT/'templates/parametrized/Informe_Fiscalizacion_APLICACION_V1.docx',
    ]
    for path in paths:
        assert path.exists(), path
        assert zipfile.is_zipfile(path), path


def test_repository_descriptor_declares_executable_app():
    data=json.loads((ROOT/'REPOSITORY_DESCRIPTOR.json').read_text(encoding='utf-8'))
    assert data.get('application_entrypoint') == 'index.html'
    assert data.get('compatibility_entrypoint') == 'app/index.html'
    assert data.get('application_executable_present') is True
