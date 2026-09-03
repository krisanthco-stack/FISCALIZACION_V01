from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def test_repository_has_ci_windows_android_and_release_workflows():
    for path in [
        '.github/workflows/ci.yml',
        '.github/workflows/windows.yml',
        '.github/workflows/android.yml',
        '.github/workflows/release.yml',
    ]:
        assert (ROOT / path).is_file(), f'missing {path}'


def test_ci_workflow_runs_cross_platform_regression_gate():
    workflow = read('.github/workflows/ci.yml')
    assert 'scripts/run_ci.py' in workflow
    assert 'python' in workflow.lower()
    assert 'node' in workflow.lower()
    assert 'actions/checkout@v6' in workflow


def test_windows_workflow_builds_installer_and_portable_after_tests():
    workflow = read('.github/workflows/windows.yml')
    assert 'windows-latest' in workflow
    assert 'scripts/run_ci.py' in workflow
    assert 'npm install' in workflow
    assert 'npm run dist:win' in workflow
    assert 'Fiscalizacion-L26-Setup-' in workflow
    assert 'Fiscalizacion-L26-Portable-' in workflow
    assert 'actions/upload-artifact@v4' in workflow


def test_android_workflow_builds_installable_apk_after_tests():
    workflow = read('.github/workflows/android.yml')
    assert 'ubuntu-latest' in workflow
    assert 'scripts/run_ci.py' in workflow
    assert 'actions/setup-java@v5' in workflow
    assert 'actions/setup-java@v6' not in workflow
    assert 'gradle/actions/setup-gradle@v4' in workflow
    assert 'gradle-version: 9.5.0' in workflow
    assert 'assembleDebug' in workflow
    assert 'Fiscalizacion-L26-Android.apk' in workflow
    assert 'actions/upload-artifact@v4' in workflow


def test_release_workflow_publishes_windows_and_android_on_version_tag():
    workflow = read('.github/workflows/release.yml')
    assert "tags: ['v*']" in workflow or 'tags:\n      - "v*"' in workflow or "- 'v*'" in workflow
    assert 'Fiscalizacion-L26-Setup-' in workflow
    assert 'Fiscalizacion-L26-Android.apk' in workflow
    assert 'gh release create' in workflow or 'gh release upload' in workflow
    assert 'contents: write' in workflow


def test_android_project_is_native_installable_shell():
    for path in [
        'android/settings.gradle.kts',
        'android/build.gradle.kts',
        'android/app/build.gradle.kts',
        'android/app/src/main/AndroidManifest.xml',
        'android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/MainActivity.java',
        'android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/ReaderActivity.java',
    ]:
        assert (ROOT / path).is_file(), f'missing {path}'

    gradle = read('android/app/build.gradle.kts')
    manifest = read('android/app/src/main/AndroidManifest.xml')
    main = read('android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/MainActivity.java')
    reader = read('android/app/src/main/java/cr/go/sarapiqui/fiscalizacion/l26/ReaderActivity.java')

    assert 'applicationId = "cr.go.sarapiqui.fiscalizacion.l26"' in gradle
    assert 'minSdk = 29' in gradle
    assert 'android.permission.INTERNET' in manifest
    assert 'android.permission.ACCESS_FINE_LOCATION' in manifest
    assert 'appassets.androidplatform.net' in main
    assert 'addJavascriptInterface' in main
    assert 'L26Android' in main
    assert 'onShowFileChooser' in main
    assert 'onGeolocationPermissionsShowPrompt' in main
    assert 'MediaStore.Downloads' in main
    assert 'addJavascriptInterface' not in reader, 'remote reader must not expose native JS bridge'
    assert 'evaluateJavascript' in reader
    assert 'Leer página' in reader
    assert 'Leer área' in reader
    assert 'elementsFromPoint' in reader or 'getBoundingClientRect' in reader


def test_web_runtime_detects_android_shell_and_routes_reader_data_back_to_case():
    html = read('index.html')
    assert 'window.L26Android?.openSource' in html
    assert 'window.l26AndroidReaderData=handleInternalReaderData' in html.replace(' ', '')
    assert 'window.L26Android?.saveBlob' in html


def test_android_asset_sync_excludes_development_and_copies_runtime():
    import json
    script = read('scripts/sync_android_assets.py')
    manifest = json.loads(read('config/runtime_distribution_manifest.json'))
    assert 'android/app/src/main/assets/www' in script
    assert 'from distribution_parity import copy_runtime_tree' in script
    assert 'copy_runtime_tree(ROOT, DEST)' in script
    runtime_paths = set(manifest['runtime_files']) | set(manifest['runtime_dirs'])
    assert 'index.html' in runtime_paths
    assert 'app/assets' in runtime_paths
    assert 'desktop' not in runtime_paths
    assert 'tests' not in runtime_paths


def test_official_android_release_uses_stable_signing_secrets_and_release_apk():
    workflow = read('.github/workflows/release.yml')
    gradle = read('android/app/build.gradle.kts')
    assert 'L26_ANDROID_KEYSTORE_BASE64' in workflow
    assert 'L26_ANDROID_KEYSTORE_PASSWORD' in workflow
    assert 'L26_ANDROID_KEY_ALIAS' in workflow
    assert 'L26_ANDROID_KEY_PASSWORD' in workflow
    assert 'assembleRelease' in workflow
    assert 'app-release.apk' in workflow
    assert 'assembleDebug' not in workflow[workflow.index('  android:'):workflow.index('  release:', workflow.index('  android:'))]
    assert 'signingConfigs' in gradle
    assert 'L26_ANDROID_KEYSTORE_PATH' in gradle
    assert 'L26_ANDROID_KEYSTORE_PASSWORD' in gradle
    assert 'L26_ANDROID_KEY_ALIAS' in gradle
    assert 'L26_ANDROID_KEY_PASSWORD' in gradle


def test_windows_and_android_builds_vendor_compatible_pdf_engine_before_packaging():
    windows = read('.github/workflows/windows.yml')
    android = read('.github/workflows/android.yml')
    release = read('.github/workflows/release.yml')
    for workflow, build_marker in [
        (windows, 'npm run dist:win'),
        (android, 'scripts/sync_android_assets.py'),
    ]:
        vendor_pos = workflow.index('scripts/vendor_pdfjs.py --required')
        build_pos = workflow.index(build_marker)
        assert vendor_pos < build_pos
    assert release.count('scripts/vendor_pdfjs.py --required') >= 2
    assert 'app/assets/vendor/pdfjs-4.10.38-legacy/pdf.min.mjs' in read('app/assets/l26_pdf_reader.js')
    assert 'app/assets/vendor/pdfjs-4.10.38-legacy/pdf.worker.min.mjs' in read('app/assets/l26_pdf_reader.js')


def test_android_asset_sync_copies_vendored_pdf_engine_into_apk_assets():
    import json
    script = read('scripts/sync_android_assets.py')
    manifest = json.loads(read('config/runtime_distribution_manifest.json'))
    assert manifest['runtime_dirs'] == ['app/assets', 'templates', 'config']
    assert 'copy_runtime_tree(ROOT, DEST)' in script
    assert 'pdf.min.mjs' in script
    assert 'pdf.worker.min.mjs' in script
    assert 'cmaps' in script
    assert 'standard_fonts' in script


def test_release_upload_explicitly_targets_current_repository():
    workflow = read('.github/workflows/release.yml')
    assert 'GH_REPO: ${{ github.repository }}' in workflow

def test_all_production_workflows_use_published_stable_setup_java_action():
    workflows='\n'.join(p.read_text(encoding='utf-8') for p in (ROOT/'.github/workflows').glob('*.yml'))
    assert 'actions/setup-java@v6' not in workflows
    assert 'actions/setup-java@v5' in workflows
