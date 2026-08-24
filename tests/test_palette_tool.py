import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))

class PaletteToolTests(unittest.TestCase):
    def test_only_green_hex_values_are_darker(self):
        from darken_green_palette import transform_css_text, is_greenish, luma
        source = ':root{--bg:#f7fafc;--text:#1a202c;--primary:#38a169;--accent:#2f855a;--blue:#1f4e78;}'
        out, changes = transform_css_text(source, factor=0.82)
        self.assertIn('--bg:#f7fafc', out)
        self.assertIn('--text:#1a202c', out)
        self.assertIn('--blue:#1f4e78', out)
        self.assertNotIn('--primary:#38a169', out)
        self.assertNotIn('--accent:#2f855a', out)
        self.assertEqual({c['old'] for c in changes}, {'#38a169', '#2f855a'})
        for c in changes:
            self.assertTrue(is_greenish(c['old']))
            self.assertTrue(is_greenish(c['new']))
            self.assertLess(luma(c['new']), luma(c['old']))

    def test_dry_run_does_not_modify_file(self):
        from darken_green_palette import process_file
        with tempfile.TemporaryDirectory() as td:
            p = Path(td)/'app.css'
            original = ':root{--primary:#38a169;--bg:#ffffff;}'
            p.write_text(original, encoding='utf-8')
            result = process_file(p, factor=0.80, write=False)
            self.assertTrue(result['changes'])
            self.assertEqual(p.read_text(encoding='utf-8'), original)

if __name__ == '__main__':
    unittest.main()
