import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))

class RegressionGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, name, text):
        p = self.root / name
        p.write_text(text, encoding='utf-8')
        return p

    def test_detects_known_regressions(self):
        from regression_gate_v26_v27 import audit_candidate
        candidate = self.write('candidate.html', '<nav>PRODUCTOS DE SALIDA</nav><button>Generar informe</button>')
        result = audit_candidate(candidate)
        self.assertFalse(result['ok'])
        codes = {x['code'] for x in result['findings']}
        self.assertTrue({'R-NAME','R-INFORMES','R-JSON-LOAD','R-JSON-DOWNLOAD','R-RECTIFICACION'}.issubset(codes))

    def test_accepts_required_functions(self):
        from regression_gate_v26_v27 import audit_candidate
        candidate = self.write('candidate.html', '''
          <nav>INFORMES</nav>
          <button>Cargar JSON</button><button>Descargar JSON</button>
          <button>Informe Técnico + Resolución</button>
          <button>Solicitud de Rectificación</button>
        ''')
        self.assertTrue(audit_candidate(candidate)['ok'])

    def test_palette_rejects_non_green_changes(self):
        from regression_gate_v26_v27 import audit_palette
        baseline = self.write('baseline.css', ':root{--bg:#f7fafc;--primary:#38a169;}')
        candidate = self.write('candidate.css', ':root{--bg:#ffffff;--primary:#237a49;}')
        result = audit_palette(baseline, candidate)
        self.assertFalse(result['ok'])
        self.assertTrue(any(x['code']=='R-COLOR-NONGREEN' for x in result['findings']))

if __name__ == '__main__':
    unittest.main()
