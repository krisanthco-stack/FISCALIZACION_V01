import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts' / 'build_portable_package.py'


class PortablePackageTests(unittest.TestCase):
    def _load_builder(self):
        spec = importlib.util.spec_from_file_location('portable_builder', SCRIPT)
        self.assertIsNotNone(spec)
        self.assertIsNotNone(spec.loader)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_repository_descriptor_is_explicit_about_repository_type(self):
        descriptor = json.loads((ROOT / 'REPOSITORY_DESCRIPTOR.json').read_text(encoding='utf-8'))
        self.assertEqual(descriptor['baseline'], 'V26-V27')
        self.assertEqual(descriptor['repository_type'], 'application_and_control_repository')
        self.assertFalse(descriptor['application_baseline_present'])
        self.assertTrue(descriptor['application_executable_present'])
        self.assertEqual(descriptor['application_entrypoint'], 'index.html')
        self.assertEqual(descriptor['compatibility_entrypoint'], 'app/index.html')
        self.assertEqual(descriptor['module_name'], 'INFORMES')

    def test_portable_zip_has_single_root_and_no_transient_files(self):
        builder = self._load_builder()
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / 'portable.zip'
            builder.build_portable_zip(ROOT, out, root_name='SARAPIQUI_FISCALIZACION_V26_V27_FINAL_REPO')
            with zipfile.ZipFile(out) as zf:
                names = zf.namelist()
            roots = {name.split('/')[0] for name in names if name}
            self.assertEqual(roots, {'SARAPIQUI_FISCALIZACION_V26_V27_FINAL_REPO'})
            self.assertTrue(any(name.endswith('/README.md') for name in names))
            self.assertTrue(any(name.endswith('/REPOSITORY_DESCRIPTOR.json') for name in names))
            self.assertFalse(any('/.git/' in name or name.endswith('/.git') for name in names))
            self.assertFalse(any('__pycache__' in name or name.endswith('.pyc') for name in names))


if __name__ == '__main__':
    unittest.main()
