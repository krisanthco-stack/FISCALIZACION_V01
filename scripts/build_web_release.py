#!/usr/bin/env python3
"""Build the GitHub Pages/PWA artifact from the canonical L-26 runtime."""
from __future__ import annotations

from pathlib import Path
import argparse
import json
import sys

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
from distribution_parity import copy_runtime_tree, compare_runtime_tree

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='dist/web')
    args = parser.parse_args()
    output = Path(args.output)
    if not output.is_absolute():
        output = ROOT / output
    copy_runtime_tree(ROOT, output)
    report = compare_runtime_tree(ROOT, output)
    print(json.dumps({'output': str(output), **report}, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report['ok'] else 2)


if __name__ == '__main__':
    main()
