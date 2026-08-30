# L-26 Internal Web Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir enlaces de expedientes dentro de la app Windows L-26 y permitir leer página/selección para completar el expediente sin modificar su número de trámite.

**Architecture:** La ventana principal conserva la PWA local e IndexedDB sin cambios de origen. Electron añade un lector interno con `WebContentsView` aislado para contenido remoto y una barra local de navegación. El texto leído se devuelve a la ventana principal por IPC/preload y se procesa con `ImportRules.detectFields` + `applyReadCandidates`, que mantiene protegido el número de trámite.

**Tech Stack:** Electron 44, WebContentsView, BrowserWindow, contextBridge/ipcRenderer, HTML/JS existente.

**Spec:** Diseño aprobado en conversación: ventana interna, atrás/adelante/recargar, Leer página, Leer selección, identidad del trámite bloqueada.

## Global Constraints

- No cambiar `DB_NAME = LibretaValoracionCR` ni `DB_VERSION = 6`.
- No borrar ni migrar IndexedDB.
- `nodeIntegration` debe permanecer desactivado para contenido remoto.
- `contextIsolation` y `sandbox` deben permanecer habilitados.
- El lector nunca puede modificar automáticamente el número de trámite del expediente abierto.
- En navegador/PWA sin Electron, `Abrir enlace` mantiene un fallback externo y `Leer` mantiene el método existente.

---

### Task 1: Desktop bridge and internal reader window

**Files:**
- Create: `desktop/app-preload.js`
- Create: `desktop/reader-preload.js`
- Create: `desktop/reader.html`
- Modify: `desktop/main.js`
- Modify: `desktop/package.json`
- Test: `desktop/test/internal-reader.test.js`

**Interfaces:**
- `window.l26Desktop.openSource({url, caseId, tramite}) -> Promise<{opened:boolean}>`
- Renderer receives DOM event `l26-reader-data` with `{caseId, tramite, text, url, title, mode}`.

- [ ] Write a failing static/behavior contract test for WebContentsView, isolated remote preferences, preload bridge and internal open routing.
- [ ] Run it and confirm failure because files/routing do not exist.
- [ ] Implement the minimal desktop reader and IPC bridge.
- [ ] Run desktop tests and confirm pass.

### Task 2: Connect L-26 source buttons to the desktop reader

**Files:**
- Modify: `index.html`
- Synchronize: `Fiscalizacion_BI_V27_FINAL.html`
- Test: `tests/test_internal_web_reader_contract.py`

**Interfaces:**
- `openCaseSource(c)` uses `window.l26Desktop.openSource` when available; otherwise `window.open`.
- `l26-reader-data` resolves the exact `caseId`, detects fields, and calls `applyReadCandidates`.

- [ ] Write failing contract tests proving desktop routing and reader-data integration are absent.
- [ ] Run them and confirm expected failure.
- [ ] Implement the minimal renderer integration while preserving web fallback.
- [ ] Synchronize both root entrypoints and run tests.

### Task 3: Regression and packaging

**Files:**
- Modify: `sw.js` only if new app-side runtime file must be cached (desktop-only files do not require PWA cache changes).
- Update: `MANIFEST.sha256`
- Create: `release/CHANGELOG_L26_20260829_INTERNAL_WEB_READER.md`

- [ ] Run Python regression suite.
- [ ] Run all self-contained Node tests and desktop tests.
- [ ] Verify DB name/version and absence of destructive database calls.
- [ ] Regenerate SHA-256 manifest and ZIP.
- [ ] Extract ZIP to a clean directory and verify manifest plus critical tests.
