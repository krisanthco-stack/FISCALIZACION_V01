import json
import re
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class MsFbiTemplateTests(unittest.TestCase):
    def test_parameterized_template_contains_all_declared_tokens(self):
        fmap = json.loads((ROOT/'config/MS_FBI_RD_MAPA_CAMPOS_V1.json').read_text(encoding='utf-8'))
        template = ROOT/'templates/parametrized/MS_FBI_RD_MACHOTE_APLICACION_V1.docx'
        with zipfile.ZipFile(template) as zf:
            xml = '\n'.join(
                zf.read(name).decode('utf-8', errors='ignore')
                for name in zf.namelist()
                if name.endswith('.xml')
            )
        missing = [f['token'] for f in fmap['fields'] if f['token'] not in xml]
        self.assertEqual(missing, [])

    def test_active_config_does_not_authorize_new_module_name(self):
        contract = (ROOT/'contracts/CONTRATO_CAMBIOS_V26_V27_FINAL.json').read_text(encoding='utf-8').lower()
        self.assertIn('renombrar informes a productos de salida', contract)
        # It may appear only as an explicitly forbidden regression.
        data = json.loads((ROOT/'contracts/CONTRATO_CAMBIOS_V26_V27_FINAL.json').read_text(encoding='utf-8'))
        self.assertEqual(data['freeze']['module_name'], 'INFORMES')

if __name__ == '__main__':
    unittest.main()
