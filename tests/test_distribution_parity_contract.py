import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'config/runtime_distribution_manifest.json'
SCRIPT = ROOT / 'scripts/distribution_parity.py'
WEB_BUILD = ROOT / 'scripts/build_web_release.py'


def load_module():
    spec = importlib.util.spec_from_file_location('distribution_parity', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def test_runtime_manifest_defines_single_canonical_source():
    assert MANIFEST.is_file(), 'falta contrato central de runtime'
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    assert data['canonical_entrypoint'] == 'index.html'
    assert 'Fiscalizacion_BI_V27_FINAL.html' in data['mirror_entrypoints']
    assert 'templates' in data['runtime_dirs']
    assert 'app/assets' in data['runtime_dirs']
    assert 'config' in data['runtime_dirs']
    assert 'sw.js' in data['runtime_files']


def test_parity_module_detects_exact_tree_difference():
    mod = load_module()
    with tempfile.TemporaryDirectory() as td:
        target = Path(td) / 'runtime'
        mod.copy_runtime_tree(ROOT, target)
        report = mod.compare_runtime_tree(ROOT, target)
        assert report['ok'], report
        (target / 'index.html').write_text('alterado', encoding='utf-8')
        report = mod.compare_runtime_tree(ROOT, target)
        assert not report['ok']
        assert any(item['path'] == 'index.html' for item in report['mismatches'])


def test_parity_module_detects_exact_zip_difference():
    mod = load_module()
    with tempfile.TemporaryDirectory() as td:
        target = Path(td) / 'runtime'
        mod.copy_runtime_tree(ROOT, target)
        archive = Path(td) / 'runtime.zip'
        with zipfile.ZipFile(archive, 'w') as zf:
            for path in target.rglob('*'):
                if path.is_file():
                    zf.write(path, 'assets/www/' + path.relative_to(target).as_posix())
        report = mod.compare_runtime_zip(ROOT, archive, 'assets/www/')
        assert report['ok'], report
        broken = Path(td) / 'runtime-broken.zip'
        with zipfile.ZipFile(broken, 'w') as zf:
            for path in target.rglob('*'):
                if path.is_file():
                    rel = path.relative_to(target).as_posix()
                    if rel == 'index.html':
                        zf.writestr('assets/www/' + rel, 'alterado')
                    else:
                        zf.write(path, 'assets/www/' + rel)
        report = mod.compare_runtime_zip(ROOT, broken, 'assets/www/')
        assert not report['ok']
        assert any(item['path'] == 'index.html' for item in report['mismatches'])


def test_web_release_builder_and_pages_workflow_use_canonical_runtime():
    assert WEB_BUILD.is_file(), 'falta ensamblador PWA canónico'
    pages = (ROOT / '.github/workflows/pages.yml')
    assert pages.is_file(), 'falta workflow GitHub Pages'
    text = pages.read_text(encoding='utf-8')
    assert 'python scripts/run_ci.py' in text
    assert 'python scripts/build_web_release.py' in text
    assert 'actions/upload-pages-artifact@' in text
    assert 'actions/deploy-pages@' in text


def test_all_distribution_workflows_enforce_parity_gate():
    workflows = ['ci.yml', 'windows.yml', 'android.yml', 'release.yml']
    for name in workflows:
        text = (ROOT / '.github/workflows' / name).read_text(encoding='utf-8')
        assert 'distribution_parity.py' in text, f'{name} no ejecuta compuerta de paridad'
    windows = (ROOT / '.github/workflows/windows.yml').read_text(encoding='utf-8')
    android = (ROOT / '.github/workflows/android.yml').read_text(encoding='utf-8')
    release = (ROOT / '.github/workflows/release.yml').read_text(encoding='utf-8')
    assert windows.index('distribution_parity.py') < windows.index('npm run dist:win')
    assert android.index('distribution_parity.py') < android.index('assembleDebug')
    assert release.count('distribution_parity.py') >= 2


def test_android_sync_uses_same_canonical_runtime_contract():
    text = (ROOT / 'scripts/sync_android_assets.py').read_text(encoding='utf-8')
    assert 'from distribution_parity import copy_runtime_tree' in text
    assert 'copy_runtime_tree(ROOT, DEST)' in text


def test_repository_descriptor_and_release_criteria_declare_github_source_of_truth():
    descriptor = json.loads((ROOT / 'REPOSITORY_DESCRIPTOR.json').read_text(encoding='utf-8'))
    assert descriptor['source_of_truth'] == 'github_main'
    assert descriptor['runtime_distribution_manifest'] == 'config/runtime_distribution_manifest.json'
    criteria = (ROOT / 'release/RELEASE_CRITERIA.md').read_text(encoding='utf-8')
    assert 'fuente única' in criteria.lower()
    assert 'SHA-256' in criteria
    assert 'Windows' in criteria and 'Android' in criteria and 'PWA' in criteria
