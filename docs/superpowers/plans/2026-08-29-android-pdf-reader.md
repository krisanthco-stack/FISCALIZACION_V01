# Android PDF Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make attached PDFs readable inside L-26 on Android tablets and allow touch/mouse area reading that automatically updates recognized expediente fields.

**Architecture:** Add a focused browser module for PDF rendering/selection and replace the iframe-only modal with a canvas-based viewer. Keep IndexedDB/document storage unchanged and route extracted text through existing ImportRules detection before automatic persistence.

**Tech Stack:** Existing HTML/JavaScript PWA, IndexedDB, PDF.js 6.2.108 lazy-loaded/cached, Pointer Events, optional browser TextDetector.

**Spec:** `docs/superpowers/specs/2026-08-29-android-pdf-reader-design.md`

## Global Constraints
- Do not change stored PDF blobs or IndexedDB store names.
- Do not send PDF content to an external OCR service.
- Existing L-26 workflows outside PDF reading must remain behaviorally unchanged.
- Automatic read actions replace existing recognized values, per user choice C.

---

### Task 1: Reader geometry and contract

**Files:**
- Create: `app/assets/l26_pdf_reader.js`
- Create: `tests/l26_pdf_reader_core.test.js`
- Create: `tests/test_android_pdf_reader_contract.py`

**Interfaces:**
- Produces: `globalThis.L26PdfReader` with `open(options)`, `close()`, and testable helpers `rectsIntersect`, `textFromItemsInRect`.

- [ ] Write failing Node tests for rectangle intersection and selected-text ordering.
- [ ] Write failing Python contract tests for the new modal controls and reader asset reference.
- [ ] Run them and confirm they fail because the reader does not exist yet.
- [ ] Implement the minimal helper/module shell and modal markup required for green tests.
- [ ] Run the focused tests to green.

### Task 2: PDF canvas rendering and touch navigation

**Files:**
- Modify: `app/assets/l26_pdf_reader.js`
- Modify: `index.html`

**Interfaces:**
- Consumes PDF Blob and DOM hosts/buttons supplied by `openPdfPreview`.
- Produces current page canvas, text geometry, navigation and zoom behavior.

- [ ] Extend focused contract tests for canvas, status, navigation, zoom, fit and system-reader fallback.
- [ ] Run and confirm red.
- [ ] Implement lazy cached PDF.js loading and current-page rendering.
- [ ] Implement previous/next, zoom and fit-width controls.
- [ ] Run focused tests to green.

### Task 3: Read page/area and automatic case update

**Files:**
- Modify: `app/assets/l26_pdf_reader.js`
- Modify: `index.html`
- Modify: `tests/test_android_pdf_reader_contract.py`

**Interfaces:**
- Reader callback: `onText(text, meta)`.
- Case updater: `applyReadCandidates(c, detected, options)` automatically persists recognized values.

- [ ] Add failing contracts for `Leer página`, `Leer área`, pointer selection and automatic replacement with no prompt/confirm.
- [ ] Run and confirm red.
- [ ] Implement page text extraction and rectangle text selection.
- [ ] Add optional local TextDetector OCR for image-only selected regions.
- [ ] Change read candidate application to automatic replacement and persist reader metadata.
- [ ] Make PDF source “Leer” attach/open the PDF and immediately enable area selection.
- [ ] Run focused tests to green.

### Task 4: Regression and delivery

**Files:**
- Modify: `sw.js` only if same-origin reader assets need precaching.
- Create: `release/CHANGELOG_L26_20260829_ANDROID_PDF.md`

- [ ] Run all self-contained Python tests.
- [ ] Run all self-contained Node tests.
- [ ] Verify JavaScript syntax for the new reader and inline application script extraction where feasible.
- [ ] Record SHA-256 of the original ZIP and modified delivery ZIP.
- [ ] Package the modified project as a new ZIP without overwriting the user-provided archive.
