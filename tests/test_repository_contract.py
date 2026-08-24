import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class RepositoryContractTests(unittest.TestCase):
    def test_active_contract_freezes_v26_v27_rules(self):
        data = json.loads((ROOT/'contracts/CONTRATO_CAMBIOS_V26_V27_FINAL.json').read_text(encoding='utf-8'))
        self.assertEqual(data['baseline'], 'V26-V27')
        self.assertEqual(data['change_type'], 'incremental_patch_only')
        self.assertEqual(data['freeze']['module_name'], 'INFORMES')
        self.assertEqual(data['freeze']['reports'], [
            'INFORME TÉCNICO + RESOLUCIÓN',
            'SOLICITUD DE RECTIFICACIÓN MS_FBI_RD',
        ])
        self.assertIn('Cargar/Importar JSON', data['freeze']['management_required_actions'])
        self.assertIn('Descargar/Exportar JSON', data['freeze']['management_required_actions'])
        self.assertTrue(data['freeze']['preserve_all_existing_v26_v27_functions'])

    def test_audit_history_is_preserved_not_deleted(self):
        expected = {
            'AUDITORIA_ESPECIFICACION_SUBMODULO_MS_FBI_RD_V1.docx',
            'AUDITORIA_ESPECIFICACION_INFORMES_MS_FBI_RD_V2.docx',
            'AUDITORIA_FUNCIONAL_Y_REGRESION_V26_V27_FINAL.docx',
        }
        actual = {p.name for p in (ROOT/'audit/history').glob('*.docx')}
        self.assertTrue(expected.issubset(actual), (expected, actual))
        note = (ROOT/'audit/history/README.md').read_text(encoding='utf-8')
        self.assertIn('trazabilidad', note.lower())
        self.assertIn('no son contrato activo', note.lower())

    def test_final_templates_are_present(self):
        self.assertTrue((ROOT/'templates/final/Informe_Fiscalizacion_V01_MACHOTE_FINAL.docx').exists())
        self.assertTrue((ROOT/'templates/final/MS-FBI-RD-01-2026_RECTIFICACION_FINAL.docx').exists())
        self.assertTrue((ROOT/'templates/parametrized/MS_FBI_RD_MACHOTE_APLICACION_V1.docx').exists())

if __name__ == '__main__':
    unittest.main()
