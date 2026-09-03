from pathlib import Path
import importlib.util
import zipfile

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'verify_packaged_runtime.py'


def load_module():
    spec = importlib.util.spec_from_file_location('verify_packaged_runtime', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def make_pdf_runtime(root: Path):
    vendor = root / 'app/assets/vendor/pdfjs-4.10.38-legacy'
    (vendor / 'cmaps').mkdir(parents=True, exist_ok=True)
    (vendor / 'standard_fonts').mkdir(parents=True, exist_ok=True)
    (vendor / 'pdf.min.mjs').write_text('x' * 100_001, encoding='utf-8')
    (vendor / 'pdf.worker.min.mjs').write_text('x' * 500_001, encoding='utf-8')
    (vendor / 'cmaps' / 'Identity-H.bcmap').write_bytes(b'cmap')
    (vendor / 'standard_fonts' / 'FoxitSans.pfb').write_bytes(b'font')


def runtime_html():
    return '<html>globalJsonExportBtn consolidateHistoricalFolioDuplicates l26-reader://</html>'


def test_windows_verifier_accepts_packaged_runtime(tmp_path):
    mod = load_module()
    unpacked = tmp_path / 'win-unpacked'
    resources = unpacked / 'resources'
    resources.mkdir(parents=True)
    (resources / 'app.asar').write_bytes(b'l26-reader reader-preload.js ' + b'x' * 4096)
    app = resources / 'app'
    (app / 'app/assets').mkdir(parents=True)
    (app / 'index.html').write_text(runtime_html(), encoding='utf-8')
    (app / 'sw.js').write_text('cache', encoding='utf-8')
    (app / 'app/assets/l26_integrity_core.js').write_text('integrity', encoding='utf-8')
    make_pdf_runtime(app)

    report = mod.verify_windows(tmp_path)
    assert report['ok'] is True
    assert report['runtime_root'] == str(app)


def test_android_verifier_accepts_packaged_runtime(tmp_path):
    mod = load_module()
    apk = tmp_path / 'app-debug.apk'
    vendor = 'assets/www/app/assets/vendor/pdfjs-4.10.38-legacy/'
    with zipfile.ZipFile(apk, 'w') as zf:
        zf.writestr('assets/www/index.html', runtime_html())
        zf.writestr('assets/www/app/assets/l26_integrity_core.js', 'integrity')
        zf.writestr(vendor + 'pdf.min.mjs', 'x' * 100_001)
        zf.writestr(vendor + 'pdf.worker.min.mjs', 'x' * 500_001)
        zf.writestr(vendor + 'cmaps/Identity-H.bcmap', b'cmap')
        zf.writestr(vendor + 'standard_fonts/FoxitSans.pfb', b'font')

    report = mod.verify_android(apk)
    assert report['ok'] is True
    assert report['apk'] == str(apk)


def test_windows_verifier_rejects_missing_offline_pdf_runtime(tmp_path):
    mod = load_module()
    resources = tmp_path / 'win-unpacked/resources'
    resources.mkdir(parents=True)
    (resources / 'app.asar').write_bytes(b'x' * 4096)
    app = resources / 'app'
    (app / 'app/assets').mkdir(parents=True)
    (app / 'index.html').write_text(runtime_html(), encoding='utf-8')
    (app / 'sw.js').write_text('cache', encoding='utf-8')
    (app / 'app/assets/l26_integrity_core.js').write_text('integrity', encoding='utf-8')

    report = mod.verify_windows(tmp_path)
    assert report['ok'] is False
    assert any('pdf.min.mjs' in item for item in report['errors'])


def test_windows_verifier_rejects_asar_without_reader_protocol(tmp_path):
    mod = load_module()
    resources = tmp_path / 'win-unpacked/resources'
    resources.mkdir(parents=True)
    (resources / 'app.asar').write_bytes(b'x' * 4096)
    app = resources / 'app'
    (app / 'app/assets').mkdir(parents=True)
    (app / 'index.html').write_text(runtime_html(), encoding='utf-8')
    (app / 'sw.js').write_text('cache', encoding='utf-8')
    (app / 'app/assets/l26_integrity_core.js').write_text('integrity', encoding='utf-8')
    make_pdf_runtime(app)

    report = mod.verify_windows(tmp_path)
    assert report['ok'] is False
    assert any('l26-reader' in item for item in report['errors'])


def make_parity_source(root: Path):
    (root / 'config').mkdir(parents=True, exist_ok=True)
    manifest = {
        'canonical_entrypoint': 'index.html',
        'mirror_entrypoints': [],
        'runtime_files': ['index.html', 'sw.js', 'app/assets/l26_integrity_core.js'],
        'runtime_dirs': ['app/assets/vendor/pdfjs-4.10.38-legacy'],
    }
    import json
    (root / 'config/runtime_distribution_manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
    (root / 'app/assets').mkdir(parents=True, exist_ok=True)
    (root / 'index.html').write_text(runtime_html(), encoding='utf-8')
    (root / 'sw.js').write_text('cache', encoding='utf-8')
    (root / 'app/assets/l26_integrity_core.js').write_text('integrity', encoding='utf-8')
    make_pdf_runtime(root)


def test_windows_verifier_rejects_runtime_that_differs_from_source(tmp_path):
    mod = load_module()
    source = tmp_path / 'source'
    make_parity_source(source)
    unpacked = tmp_path / 'dist/win-unpacked'
    resources = unpacked / 'resources'
    resources.mkdir(parents=True)
    (resources / 'app.asar').write_bytes(b'l26-reader reader-preload.js ' + b'x' * 4096)
    app = resources / 'app'
    import shutil
    shutil.copytree(source, app)
    (app / 'index.html').write_text(runtime_html() + ' ALTERADO', encoding='utf-8')

    report = mod.verify_windows(tmp_path / 'dist', source_root=source)
    assert report['ok'] is False
    assert any('Paridad' in item and 'index.html' in item for item in report['errors'])


def test_android_verifier_rejects_runtime_that_differs_from_source(tmp_path):
    mod = load_module()
    source = tmp_path / 'source'
    make_parity_source(source)
    apk = tmp_path / 'app.apk'
    with zipfile.ZipFile(apk, 'w') as zf:
        for path in source.rglob('*'):
            if path.is_file():
                rel = path.relative_to(source).as_posix()
                if rel == 'index.html':
                    zf.writestr('assets/www/' + rel, runtime_html() + ' ALTERADO')
                else:
                    zf.write(path, 'assets/www/' + rel)

    report = mod.verify_android(apk, source_root=source)
    assert report['ok'] is False
    assert any('Paridad' in item and 'index.html' in item for item in report['errors'])


def test_cli_android_uses_repository_root_without_nameerror(tmp_path):
    import json
    import subprocess
    import sys

    missing_apk = tmp_path / 'missing.apk'
    cp = subprocess.run(
        [sys.executable, str(SCRIPT), '--android', str(missing_apk)],
        cwd=SCRIPT.parents[1],
        capture_output=True,
        text=True,
    )

    assert cp.returncode == 2
    assert 'NameError' not in cp.stderr
    report = json.loads(cp.stdout)
    assert report['ok'] is False
    assert report['apk'] == str(missing_apk)
