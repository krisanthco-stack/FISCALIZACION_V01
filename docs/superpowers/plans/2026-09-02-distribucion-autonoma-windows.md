# Distribución autónoma Windows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar un instalador Electron/NSIS autónomo de L-26 y un repositorio GitHub actualizado desde el mismo commit, sin cambiar funcionalidad de la aplicación.

**Architecture:** Mantener la aplicación web intacta y usar `desktop/` como shell Electron con Chromium embebido. Generar `Setup.exe` y portable con electron-builder cuando las dependencias estén disponibles, y empaquetar el repositorio Git completo por separado.

**Tech Stack:** Electron 44, electron-builder 26.15.7, NSIS, Node 22, Python 3, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-02-distribucion-autonoma-windows-design.md`

## Global Constraints
- No modificar lógica funcional de L-26.
- No depender de Chrome, Edge ni otro navegador para el instalador Windows autónomo.
- Conservar funcionamiento offline local; solo servicios externos requieren Internet.
- Mantener machotes oficiales sin cambios.
- Entregar repositorio Git y distribución Windows desde el mismo commit.

---

### Task 1: Contratos del instalador autónomo

**Files:**
- Create: `tests/l26_autonomous_windows_distribution.test.js`
- Modify: `desktop/package.json`
- Modify: `desktop/README_WINDOWS.md`

**Interfaces:**
- Consumes: configuración existente `desktop/package.json`.
- Produces: contrato verificable de que Electron/NSIS no depende de navegador externo para arrancar L-26.

- [ ] **Step 1: Write the failing test**
  Crear pruebas que exijan `main: main.js`, targets `nsis` y `portable`, `extraResources` con el runtime local y ausencia de comandos de lanzamiento de Chrome/Edge en el shell Electron.
- [ ] **Step 2: Run test to verify it fails if any requirement is missing**
  Ejecutar `node --test tests/l26_autonomous_windows_distribution.test.js`.
- [ ] **Step 3: Write minimal implementation/documentation**
  Ajustar solo configuración/documentación de empaquetado necesaria.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 2: Script local reproducible de build Windows

**Files:**
- Create: `scripts/build_windows_standalone.py`
- Create: `BUILD_WINDOWS_STANDALONE.cmd`
- Test: `tests/test_windows_standalone_build_contract.py`

**Interfaces:**
- Consumes: `desktop/package.json`, `scripts/vendor_pdfjs.py`, `scripts/verify_packaged_runtime.py`.
- Produces: comando local que corre CI, prepara PDF.js offline, instala dependencias si faltan, construye NSIS/portable y verifica artefactos.

- [ ] **Step 1: Write the failing test**
  Verificar que el script invoque CI, vendorización PDF, `npm ci`/`npm install`, `npm run dist:win` y verificación del runtime.
- [ ] **Step 2: Run test and confirm failure**
- [ ] **Step 3: Implement the build script and CMD wrapper**
- [ ] **Step 4: Run test and confirm pass**
- [ ] **Step 5: Commit**

### Task 3: Repositorio GitHub sincronizado

**Files:**
- Modify: `.github/workflows/windows.yml`
- Modify: `.github/workflows/release.yml`
- Create: `docs/DISTRIBUCION_WINDOWS_AUTONOMA.md`
- Test: `tests/test_github_windows_distribution.py`

**Interfaces:**
- Consumes: scripts de build/verificación de Tasks 1-2.
- Produces: workflows que construyen los mismos artefactos en Windows GitHub Actions.

- [ ] **Step 1: Write failing workflow contract tests**
- [ ] **Step 2: Verify failure if workflow diverges from local build**
- [ ] **Step 3: Update workflows/docs minimally**
- [ ] **Step 4: Verify contract tests pass**
- [ ] **Step 5: Commit**

### Task 4: Build real, auditoría y entrega

**Files:**
- Generate: `desktop/dist/Fiscalizacion-L26-Setup-27.3.9.exe`
- Generate: `desktop/dist/Fiscalizacion-L26-Portable-27.3.9.exe`
- Generate: release ZIP/bundle and SHA-256 manifests.

**Interfaces:**
- Consumes: commit final de Tasks 1-3.
- Produces: instalador autónomo y repositorio GitHub exportable.

- [ ] **Step 1: Run full CI**
  `python scripts/run_ci.py`.
- [ ] **Step 2: Run local Windows build**
  `python scripts/build_windows_standalone.py`.
- [ ] **Step 3: Verify packaged runtime**
  `python scripts/verify_packaged_runtime.py --windows desktop/dist`.
- [ ] **Step 4: Inspect installer/portable outputs and hashes**
- [ ] **Step 5: Compare official DOCX hashes against baseline**
- [ ] **Step 6: Package Git repository and Git bundle from same commit**
- [ ] **Step 7: Re-extract delivery ZIPs and rerun verification**
