# L-26 Consolidated Requested Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved L-26 changes in isolated stages while preserving transaction identity, IndexedDB data, existing map/croquis movement, import/export, recovery, and unrelated workflows.

**Architecture:** Keep the existing IndexedDB schema/version and transaction identity protections intact. Add small pure helper modules for Management, territory normalization/inference, and PDF fill-missing behavior; integrate them into the existing single-page app with regression contracts after every stage.

**Tech Stack:** HTML/CSS/JavaScript PWA, IndexedDB, Service Worker, Electron wrapper, Node test runner, pytest static/regression contracts.

**Spec:** Conversation-approved requirements through 2026-08-30.

## Global Constraints

- Use only `FISCALIZACION_L26_LECTOR_WEB_INTERNO_2026-08-29.zip` as the source version.
- Keep IndexedDB `LibretaValoracionCR` at version 6; no destructive migration or `deleteDatabase`.
- A transaction number is immutable identity and must never be overwritten by PDF/web readers or merged because finca/plano/derecho match.
- Do not modify functions not requested; map/croquis movement and existing recovery/import/export behavior must remain operational.
- PDF attachment recognition fills only missing fields; web `Leer página` / `Leer área` remain separate.

---

### Task 1: Management states, filters, colors, active count, and observation
- [x] Add pure management-state helpers and failing tests.
- [x] Add Notificado / Registrado independent state and filters.
- [x] Add requested blue/red/yellow visual priority.
- [x] Make Activos explicitly total minus Gestión.
- [x] Add Fiscalización observation field and conditional Management badge.

### Task 2: PDF / web reader separation
- [x] Add fill-missing-only helper and failing tests.
- [x] Make attached PDFs auto-read and fill only missing fields.
- [x] Remove PDF `Leer página` / `Leer área` actions from PDF viewer.
- [x] Keep web page reader actions in internal Electron reader.

### Task 3: Territorial normalization and safe district inference
- [x] Add pure territory helper and failing tests.
- [x] Apply district sentence-case and place title-case on normalized records and filters.
- [x] Group names regardless case/accents/initial article.
- [x] Infer a missing district only when same normalized place has one unique valid district; never overwrite a populated district.

### Task 4: Requested UI-only adjustments
- [x] Remove CRTM05 explanatory banner without touching coordinate capture.
- [x] Lower report signature line in HTML/PDF and DOCX.
- [x] Convert vertex-entry section to an accordion while preserving move/drag handlers.
- [x] Keep Servicios 1/2 in one row and show only selected values while collapsed.

### Task 5: Regression and package audit
- [x] Synchronize root/full entrypoints and preserve `app/index.html` redirect.
- [x] Bump Service Worker cache key only as needed and cache new helper modules.
- [x] Run full pytest suite and all self-contained Node/Desktop tests.
- [x] Verify no DB version/name/destructive calls changed and no transaction-identity protections regressed.
- [x] Regenerate SHA-256 manifest, create release ZIP, re-extract, and verify manifest + critical tests.
