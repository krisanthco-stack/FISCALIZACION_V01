#!/usr/bin/env python3
"""Cross-platform regression gate used locally and by GitHub Actions."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
EXTERNAL_NODE_FIXTURES = {'l26_excel_real_files.test.js'}


def run(cmd, cwd=ROOT):
    print('+', ' '.join(map(str, cmd)), flush=True)
    subprocess.run([str(x) for x in cmd], cwd=cwd, check=True)


def main():
    run([sys.executable, '-m', 'pytest', '-q'])
    node_tests = sorted(
        p for p in (ROOT / 'tests').glob('*.test.js')
        if p.name not in EXTERNAL_NODE_FIXTURES
    )
    if node_tests:
        run(['node', '--test', *node_tests])
    desktop_tests = sorted((ROOT / 'desktop' / 'test').glob('*.test.js'))
    if desktop_tests:
        run(['node', '--test', *desktop_tests])
    print('L26 CI gate: PASS', flush=True)


if __name__ == '__main__':
    main()
