# V26–V27 Recovery HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one offline HTML application that preserves the accessible V26–V27 functional contract, restores Gestión JSON and Auditoría, keeps INFORMES with exactly two fiscalización outputs, and produces both official DOCX outputs from the approved masters.

**Architecture:** A browser-only offline app in `app/index.html` stores the expediente in localStorage and supports JSON import/export. DOCX generation uses a vendored JSZip library plus embedded base64 master templates, replacing OOXML tokens and optional fiscalización images without external services.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, JSZip 3.x, localStorage, Python/pytest, Playwright+Chromium for end-to-end verification.

**Spec:** `contracts/CONTRATO_CAMBIOS_V26_V27_FINAL.json` and `audit/active/AUDITORIA_FUNCIONAL_Y_REGRESION_V26_V27_FINAL.docx`

## Global Constraints

- Module name remains `INFORMES`; never `PRODUCTOS DE SALIDA`.
- INFORMES exposes exactly two outputs: `INFORME TÉCNICO + RESOLUCIÓN` and `SOLICITUD DE RECTIFICACIÓN MS_FBI_RD`.
- GESTIÓN preserves `Cargar/Importar JSON` and `Descargar/Exportar JSON` with lossless round-trip.
- AUDITORÍA remains present and records relevant actions.
- The new rectification output is integrated without creating a new main module.
- Official document masters are preserved and used for generated DOCX files.
- Application is fully offline and must load from `file://` with no network dependency.
- UI uses a restrained V26–V27 recovery palette with darkened green as the accent; no broad visual redesign.

---

### Task 1: Portable app contract and failing tests

**Files:**
- Create: `tests/test_final_app.py`
- Create: `tests/test_final_app_e2e.py`

**Interfaces:**
- Consumes: repository contract and templates.
- Produces: acceptance tests for HTML existence, modules, JSON round-trip, audit, reports, DOCX generation and offline load.

- [ ] Write static and browser failing tests.
- [ ] Run tests and confirm failure because `app/index.html` does not exist.

### Task 2: Parametrized masters and browser document engine

**Files:**
- Create: `templates/parametrized/Informe_Fiscalizacion_APLICACION_V1.docx`
- Create: `app/assets/jszip.min.js`
- Create: `app/assets/templates.js`

**Interfaces:**
- Consumes: final DOCX masters.
- Produces: browser-loadable template bytes and tokenized fiscalización master.

- [ ] Tokenize dynamic fiscalización fields while preserving official layout/media.
- [ ] Embed both parametrized masters as base64.
- [ ] Verify expected tokens are present in OOXML.

### Task 3: Offline application

**Files:**
- Create: `app/index.html`
- Create: `app/Fiscalizacion_BI_V27_FINAL.html`

**Interfaces:**
- Consumes: `window.APP_TEMPLATES`, JSZip.
- Produces: state management, JSON import/export, audit trail, fiscalización form, INFORMES two outputs, DOCX downloads.

- [ ] Implement modules GESTIÓN, FISCALIZACIÓN, INFORMES, AUDITORÍA.
- [ ] Implement localStorage and lossless JSON round-trip.
- [ ] Implement DOCX token replacement and optional photo/croquis media replacement.
- [ ] Add report previews and download buttons.
- [ ] Keep both HTML entry points identical for simple loading.

### Task 4: Regression and loading verification

**Files:**
- Modify: `tests/test_final_app.py`
- Modify: `tests/test_final_app_e2e.py`
- Modify: `README.md`
- Modify: `REPOSITORY_DESCRIPTOR.json`

**Interfaces:**
- Consumes: completed application.
- Produces: verified release package.

- [ ] Run full pytest suite.
- [ ] Run Playwright offline load and interaction tests in Chromium.
- [ ] Run generated DOCX validation with `zipfile` and token scan.
- [ ] Run `git fsck` and clean-status checks.
- [ ] Build one-root ZIP containing executable HTML and templates.
