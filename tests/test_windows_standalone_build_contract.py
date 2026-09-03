from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts' / 'build_windows_standalone.py'
CMD = ROOT / 'BUILD_WINDOWS_STANDALONE.cmd'


def load_module():
    spec = importlib.util.spec_from_file_location('l26_windows_build', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_build_script_declares_reproducible_steps():
    assert SCRIPT.is_file(), 'falta scripts/build_windows_standalone.py'
    mod = load_module()
    steps = mod.build_steps(ROOT)
    labels = [step.label for step in steps]
    assert labels == [
        'CI completo',
        'PDF.js offline',
        'Dependencias Electron',
        'Build Windows NSIS + portable',
        'Verificar runtime Windows',
    ]
    flattened = [' '.join(step.command) for step in steps]
    assert any('scripts/run_ci.py' in cmd for cmd in flattened)
    assert any('scripts/vendor_pdfjs.py' in cmd and '--required' in cmd for cmd in flattened)
    dependency_step = next(step for step in steps if step.label == 'Dependencias Electron')
    assert dependency_step.command[0] in {'npm', 'npm.cmd'}
    assert dependency_step.command[1] in {'ci', 'install'}
    build_step = next(step for step in steps if step.label == 'Build Windows NSIS + portable')
    assert build_step.command[0] in {'npm', 'npm.cmd'}
    assert build_step.command[1:] == ('run', 'dist:win')
    assert any('scripts/verify_packaged_runtime.py' in cmd and '--windows' in cmd for cmd in flattened)


def test_cmd_wrapper_is_local_and_does_not_require_github_or_browser():
    assert CMD.is_file(), 'falta BUILD_WINDOWS_STANDALONE.cmd'
    text = CMD.read_text(encoding='utf-8', errors='replace')
    assert 'build_windows_standalone.py' in text
    lowered = text.lower()
    assert 'github' not in lowered
    assert 'chrome' not in lowered
    assert 'msedge' not in lowered
