# GitHub fuente única y paridad de distribuciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir GitHub `main` en la fuente única verificable para PWA, Windows y Android, bloqueando publicaciones que diverjan visual, funcionalmente o en machotes.

**Architecture:** Un contrato central enumera el runtime canónico. Los scripts de ensamblaje y verificación reutilizan ese contrato; cada workflow ejecuta CI, ensambla su artefacto desde el mismo checkout y compara hashes antes de publicar.

**Tech Stack:** Python 3, GitHub Actions, Electron/electron-builder, Android Gradle/WebView, PWA estática.

**Spec:** `docs/superpowers/specs/2026-09-02-github-fuente-unica-paridad-design.md`

## Global Constraints

- No modificar lógica funcional ni apariencia de L-26.
- No modificar ningún machote DOCX.
- `index.html` y `Fiscalizacion_BI_V27_FINAL.html` deben permanecer idénticos.
- Windows, Android y PWA deben derivarse del mismo commit y runtime canónico.
- Toda divergencia debe fallar antes de publicar.

---

### Task 1: Contrato y pruebas de paridad

**Files:**
- Create: `tests/test_distribution_parity_contract.py`
- Create: `config/runtime_distribution_manifest.json`
- Create: `scripts/distribution_parity.py`

**Interfaces:**
- Produces: `iter_runtime_files(root)`, `compare_runtime_tree(source_root, target_root)`, `compare_runtime_zip(source_root, archive, prefix)`.

- [ ] Escribir pruebas que exijan el manifiesto, comparación SHA-256 y detección de una copia alterada.
- [ ] Ejecutar las pruebas y confirmar fallo por ausencia del contrato/implementación.
- [ ] Implementar el manifiesto y comparadores mínimos.
- [ ] Ejecutar las pruebas y confirmar PASS.

### Task 2: Verificación de artefactos nativos

**Files:**
- Modify: `scripts/verify_packaged_runtime.py`
- Modify: `tests/test_packaged_runtime_verifier.py`

**Interfaces:**
- Consumes: `distribution_parity`.
- Produces: comprobación hash exacta de Windows `resources/app` y Android `assets/www` contra la fuente.

- [ ] Añadir pruebas que fallen si un archivo empaquetado difiere del canónico.
- [ ] Ejecutar las pruebas y confirmar fallo esperado.
- [ ] Integrar comparación exacta en ambos verificadores.
- [ ] Ejecutar las pruebas y confirmar PASS.

### Task 3: Artefacto PWA GitHub Pages

**Files:**
- Create: `scripts/build_web_release.py`
- Create: `.github/workflows/pages.yml`
- Modify: `tests/test_distribution_parity_contract.py`

**Interfaces:**
- Produces: `dist/web/` derivado del manifiesto central y verificado contra la fuente.

- [ ] Añadir prueba contractual del workflow Pages y ensamblador.
- [ ] Confirmar fallo antes de implementar.
- [ ] Implementar ensamblador y workflow con CI + paridad + deploy Pages.
- [ ] Confirmar PASS.

### Task 4: Integrar compuertas en workflows existentes

**Files:**
- Modify: `.github/workflows/windows.yml`
- Modify: `.github/workflows/android.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `release/RELEASE_CRITERIA.md`
- Modify: `REPOSITORY_DESCRIPTOR.json`

**Interfaces:**
- Consumes: scripts de paridad.
- Produces: bloqueos previos a publicación y documentación de fuente única.

- [ ] Extender pruebas contractuales para exigir los pasos de paridad.
- [ ] Confirmar fallo esperado.
- [ ] Añadir pasos a workflows y documentación sin tocar runtime.
- [ ] Confirmar PASS.

### Task 5: Verificación final y entrega

**Files:**
- Create: `AUDITORIA_GITHUB_FUENTE_UNICA_PARIDAD_2026-09-02.txt`

**Interfaces:**
- Produces: evidencia de CI, hashes protegidos y paquete Git actualizado.

- [ ] Ejecutar `python scripts/run_ci.py` desde árbol limpio.
- [ ] Ejecutar `python scripts/build_web_release.py --output dist/web` y verificar paridad.
- [ ] Comparar SHA-256 de HTML, SW, Electron main y machotes contra la línea base de inicio.
- [ ] Ejecutar `git diff --check` y `git status`.
- [ ] Empaquetar repositorio Git con `.git`, bundle y SHA-256.
