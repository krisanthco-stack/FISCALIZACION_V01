# Importación, enlaces y adjuntos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Importar expedientes desde Excel mediante identidad folio–plano–derecho, conservar fecha/identificación/enlace, adjuntar documentos y completar campos faltantes con lectura asistida.

**Architecture:** Mantener la aplicación monolítica offline y extraer reglas puras, expuestas bajo `window.__importTestApi`, para probar la normalización sin navegador. Reutilizar IndexedDB y `STORE_DOCUMENTS`; añadir metadatos al expediente y controles compactos en las listas existentes.

**Tech Stack:** HTML/CSS/JavaScript sin compilación, IndexedDB, parser XLSX ZIP/XML existente, Python/pytest para regresión estática y Node para pruebas unitarias de reglas JavaScript.

**Spec:** `docs/superpowers/specs/2026-08-25-importacion-enlaces-adjuntos-design.md`

## Global Constraints

- No modificar ningún byte de los dos machotes finales oficiales.
- Preservar Gestión, Fiscalización, Informes, PWA, JSON/ZIP y compatibilidad offline.
- No sobrescribir campos existentes durante importación o lectura sin confirmación.
- Mismo folio con plano o derecho diferente crea expediente separado; coincidencia exacta conserva uno.

---

### Task 1: Reglas puras de importación e identidad

**Files:**
- Modify: `app/index.html`
- Create: `tests/test_excel_import_rules.py`

**Interfaces:**
- Produces: `canonicalPropertyIdentity(row)`, `extractImportLink(row)`, `mapImportedRow(row)`, `mergeImportedCase(existing,incoming,row,sourceFile)`.

- [ ] Escribir una prueba que extraiga las funciones JavaScript y compruebe: fechas seriales Excel, identificación textual, URL en cualquier columna, mismo folio/plano/derecho como una clave y plano/derecho diferente como claves distintas.
- [ ] Ejecutar `pytest -q tests/test_excel_import_rules.py` y confirmar que falla por las reglas ausentes.
- [ ] Implementar alias para fecha, derecho, ID DERECHO y enlace; normalización de clave compuesta y extracción de URL.
- [ ] Ejecutar la prueba y confirmar que pasa.

### Task 2: Importación con deduplicación compuesta y orden cronológico

**Files:**
- Modify: `app/index.html`
- Modify: `tests/test_excel_import_rules.py`

**Interfaces:**
- Consumes: `canonicalPropertyIdentity`, `mapImportedRow`, `mergeImportedCase`.
- Produces: `importExcelObjects(objects,fileName,existingCases)` y conteos `created`, `updated`, `duplicates`, `skipped`.

- [ ] Añadir pruebas para folio igual/plano distinto, folio igual/derecho distinto, repetición exacta y fila sin trámite con folio o plano.
- [ ] Ejecutar la prueba y confirmar el fallo esperado.
- [ ] Cambiar `importExcelFile` para usar la clave compuesta, crear expedientes sin trámite oficial y conservar uno en repetición exacta.
- [ ] Asegurar que `caseChronologyDate` priorice la fecha importada y que los comparadores de listas usen orden antiguo→nuevo.
- [ ] Ejecutar las pruebas y confirmar que pasan.

### Task 3: Persistencia y controles compactos de enlace/adjuntos

**Files:**
- Modify: `app/index.html`
- Modify: `tests/test_excel_import_rules.py`

**Interfaces:**
- Produces: `sourceLink`, `importedDate`, `rights`, `readerMetadata`; `openCaseLink(case)`, `attachCaseFiles(caseId,files)`.

- [ ] Añadir pruebas estáticas de los nuevos campos, tipos admitidos y controles `Abrir`, `Leer`, `Adjuntar`.
- [ ] Ejecutar y confirmar el fallo esperado.
- [ ] Extender `blankCase`/`normalizeCase` y compatibilidad JSON/ZIP.
- [ ] Añadir botones pequeños a las filas y un selector oculto PDF/imagen enlazado al expediente correcto.
- [ ] Reutilizar `STORE_DOCUMENTS` para guardar Blob, MIME, nombre, hash y fecha.
- [ ] Ejecutar pruebas y confirmar que pasan.

### Task 4: Lectura asistida y aplicación selectiva

**Files:**
- Modify: `app/index.html`
- Modify: `tests/test_excel_import_rules.py`

**Interfaces:**
- Produces: `detectCaseFields(text)`, `readLinkedSource(case)`, `showDetectedFieldsPreview(case,candidates)`, `applyDetectedFields(case,selections)`.

- [ ] Añadir pruebas para detectar folio, plano, identificación, propietario y fecha desde texto; verificar que la aplicación por defecto solo completa vacíos.
- [ ] Ejecutar y confirmar el fallo esperado.
- [ ] Implementar lectura de URL mediante `fetch` con error CORS/autenticación comprensible; extraer HTML visible y PDF textual disponible.
- [ ] Implementar vista previa con casillas y confirmación antes de reemplazar valores existentes.
- [ ] Guardar documento descargado cuando la respuesta sea PDF o imagen.
- [ ] Ejecutar pruebas y confirmar que pasan.

### Task 5: Sincronización, regresión y liberación

**Files:**
- Modify: `index.html`
- Modify: `Fiscalizacion_BI_V27_FINAL.html`
- Modify: `MANIFEST.sha256`
- Create: `control/AUDITORIA_IMPORTACION_ENLACES_V01.json`

**Interfaces:**
- Consumes: aplicación verificada en `app/index.html`.
- Produces: tres entradas HTML equivalentes y paquete ZIP portable.

- [ ] Ejecutar `python scripts/sync_entrypoints.py`.
- [ ] Ejecutar pruebas específicas y toda la suite con `pytest -q`.
- [ ] Ejecutar pruebas Node disponibles.
- [ ] Comparar SHA-256 de ambos machotes contra los archivos originales adjuntos al paquete antes y después.
- [ ] Actualizar manifiesto y auditoría de liberación sin tocar los DOCX.
- [ ] Construir `FISCALIZACION_V01_IMPORTACION_ENLACES_FINAL.zip` con una sola carpeta raíz.
- [ ] Validar el ZIP, sus rutas, el HTML y los hashes; guardar el entregable persistente.
