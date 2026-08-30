# L-26 Integridad y Recuperación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Proteger la identidad de cada trámite, impedir fusiones destructivas y detectar inconsistencias previas sin borrar datos.

**Architecture:** Añadir un núcleo de integridad puro y reutilizable; hacer que Excel, guardado, recuperación y paquetes utilicen una identidad compuesta por trámite + propiedad; proteger el trámite durante lectura PDF/página; validar distritos y producir auditoría de solo lectura.

**Tech Stack:** JavaScript ES2020, IndexedDB, Node test runner, Python pytest para contratos estáticos.

**Spec:** `docs/superpowers/specs/2026-08-29-l26-integridad-recuperacion-design.md`

## Global Constraints

- No borrar ni migrar destructivamente registros existentes.
- No cambiar `DB_NAME` ni el origen de almacenamiento.
- Trámites distintos nunca se fusionan por compartir inmueble.
- El lector PDF/página nunca sobrescribe el trámite abierto.
- La recuperación prefiere duplicar/conservar antes que fusionar de forma ambigua.

---

### Task 1: Núcleo de identidad e integridad

**Files:**
- Create: `app/assets/l26_integrity_core.js`
- Create: `tests/l26_integrity_core.test.js`
- Modify: `index.html`

**Interfaces:**
- Produces: `L26IntegrityCore.caseIdentityKey(record)`, `canonicalTramite(value)`, `normalizeDistrict(value)`, `auditIntegrity(cases, documents)`.

- [x] Escribir pruebas que demuestren que `2024-07370` y `2025-17123` del mismo inmueble producen claves distintas.
- [x] Probar que el mismo trámite con propiedades distintas conserva claves distintas.
- [x] Probar normalización territorial y auditoría de documentos con trámite discordante.
- [x] Ejecutar pruebas y verificar RED.
- [x] Implementar el núcleo mínimo y cargarlo desde `index.html`.
- [x] Ejecutar pruebas y verificar GREEN.

### Task 2: Excel e importación sin fusiones entre trámites

**Files:**
- Modify: `app/assets/l26_excel_import_core.js`
- Modify: `index.html`
- Modify: `tests/l26_excel_real_files.test.js`
- Create: `tests/l26_transaction_identity.test.js`

**Interfaces:**
- Consumes: `L26IntegrityCore.caseIdentityKey` semantics.
- Produces: deduplicación solo de trámite + propiedad idénticos.

- [x] Escribir prueba `2024-07370` + `2025-17123` con misma finca/plano/derecho => 2 registros.
- [x] Verificar RED.
- [x] Cambiar `canonicalIdentityKey` y `caseCoreIdentity` a identidad transaccional.
- [x] Ejecutar GREEN y regresión de importación.

### Task 3: Proteger número de trámite y distrito en lector PDF/página

**Files:**
- Modify: `index.html`
- Modify: `app/assets/import_rules.js`
- Create: `tests/test_reader_identity_protection.py`
- Extend: `tests/import_rules.test.js`

**Interfaces:**
- Consumes: `canonicalTramite`, `normalizeDistrict`.
- Produces: conflicto registrado sin sobrescribir trámite.

- [x] Crear contratos que exijan exclusión de `tramite` de campos sobrescribibles y validación de distrito.
- [x] Verificar RED.
- [x] Implementar protección y registro en `readerMetadata.identityConflicts`.
- [x] Ejecutar GREEN.

### Task 4: Recuperación y paquetes conservadores

**Files:**
- Modify: `index.html`
- Create: `tests/test_recovery_transaction_identity.py`

**Interfaces:**
- Consumes: `caseCoreIdentity` transaccional.
- Produces: recuperación/restauración que solo fusiona coincidencias exactas.

- [x] Crear contratos para recuperación legacy, paquete individual y paquete Gestión.
- [x] Verificar RED.
- [x] Cambiar mapas de coincidencia y evitar merge por `caseId` cuando existe conflicto de identidad transaccional.
- [x] Ejecutar GREEN.

### Task 5: Auditoría de integridad de solo lectura

**Files:**
- Modify: `index.html`
- Extend: `tests/l26_integrity_core.test.js`
- Create: `tests/test_integrity_audit_contract.py`

**Interfaces:**
- Consumes: `auditIntegrity`.
- Produces: `runIntegrityAudit()` y resumen visible/exportable sin modificar datos.

- [x] Probar detección de documentos discordantes, distritos inválidos, casos sin trámite y duplicados exactos.
- [x] Verificar RED.
- [x] Implementar botón/resumen en Auditoría y exportación JSON del informe.
- [x] Ejecutar GREEN.

### Task 6: Regresión y paquete de recuperación

**Files:**
- Create: `RECUPERACION_INTEGRIDAD_2026-08-29.txt`

- [x] Ejecutar `python -m pytest -q`.
- [x] Ejecutar Node tests autocontenidos.
- [x] Verificar que DB_NAME/DB_VERSION no cambien de forma destructiva.
- [x] Generar ZIP nuevo sin modificar el ZIP fuente.
- [x] Calcular SHA-256.
