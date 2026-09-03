#!/usr/bin/env python3
"""Build L-26 Windows installer/portable from the local repository.

This script is intentionally independent from GitHub Actions.  It runs the
same regression and packaging gates locally and produces an Electron/NSIS
installer that contains its own Chromium runtime.
"""
from __future__ import annotations

from pathlib import Path
from typing import NamedTuple
import argparse
import os
import shutil
import subprocess
import sys


class BuildStep(NamedTuple):
    label: str
    command: tuple[str, ...]
    cwd: Path


def _npm_command() -> str:
    return 'npm.cmd' if os.name == 'nt' else 'npm'


def build_steps(root: Path) -> list[BuildStep]:
    root = root.resolve()
    python = sys.executable
    npm = _npm_command()
    desktop = root / 'desktop'
    return [
        BuildStep('CI completo', (python, 'scripts/run_ci.py'), root),
        BuildStep('PDF.js offline', (python, 'scripts/vendor_pdfjs.py', '--required'), root),
        BuildStep(
            'Dependencias Electron',
            (npm, 'install', '--no-audit', '--no-fund', '--prefer-offline'),
            desktop,
        ),
        BuildStep('Build Windows NSIS + portable', (npm, 'run', 'dist:win'), desktop),
        BuildStep(
            'Verificar runtime Windows',
            (python, 'scripts/verify_packaged_runtime.py', '--windows', 'desktop/dist'),
            root,
        ),
    ]


def _artifact_paths(root: Path) -> tuple[list[Path], list[Path]]:
    dist = root / 'desktop' / 'dist'
    return (
        sorted(dist.glob('Fiscalizacion-L26-Setup-*.exe')),
        sorted(dist.glob('Fiscalizacion-L26-Portable-*.exe')),
    )


def verify_artifacts(root: Path) -> None:
    setup, portable = _artifact_paths(root)
    if not setup:
        raise RuntimeError('No se generó Fiscalizacion-L26-Setup-*.exe')
    if not portable:
        raise RuntimeError('No se generó Fiscalizacion-L26-Portable-*.exe')
    for artifact in [*setup, *portable]:
        if artifact.stat().st_size < 10_000_000:
            raise RuntimeError(f'Artefacto Windows anormalmente pequeño: {artifact}')
        print(f'ARTEFACTO: {artifact} ({artifact.stat().st_size} bytes)')


def run(root: Path, *, dry_run: bool = False, skip_dependencies: bool = False) -> None:
    root = root.resolve()
    if not (root / 'desktop' / 'package.json').is_file():
        raise RuntimeError(f'No parece raíz L-26: {root}')
    if shutil.which(_npm_command()) is None:
        raise RuntimeError('npm no está disponible. Instale Node.js 22 para COMPILAR el instalador.')

    for step in build_steps(root):
        if skip_dependencies and step.label == 'Dependencias Electron':
            print(f'== {step.label}: OMITIDO por --skip-dependencies ==')
            continue
        print(f'== {step.label} ==')
        print(f'CWD: {step.cwd}')
        print('CMD:', subprocess.list2cmdline(list(step.command)))
        if not dry_run:
            subprocess.run(step.command, cwd=step.cwd, check=True)

    if not dry_run:
        verify_artifacts(root)
        print('L26 WINDOWS STANDALONE BUILD: PASS')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--dry-run', action='store_true', help='Muestra los pasos sin ejecutarlos.')
    parser.add_argument('--skip-dependencies', action='store_true', help='No ejecuta npm install; útil si node_modules ya está preparado.')
    args = parser.parse_args()
    run(args.root, dry_run=args.dry_run, skip_dependencies=args.skip_dependencies)


if __name__ == '__main__':
    main()
