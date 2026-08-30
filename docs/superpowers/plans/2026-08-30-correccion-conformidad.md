# L-26 Corrección de Conformidad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir exclusivamente las desviaciones detectadas en la auditoría histórica sin alterar identidad de trámite, almacenamiento, croquis, importación/exportación ni funciones no solicitadas.

**Architecture:** Mantener IndexedDB `LibretaValoracionCR` versión 6. Corregir cada desviación mediante módulos/funciones existentes y pruebas de integración que validen la pantalla real; ninguna etapa avanza sin regresión verde.

**Tech Stack:** HTML/CSS/JavaScript PWA, IndexedDB, Electron desktop wrapper, Node tests, pytest static/integration contracts.

**Spec:** Auditoría histórica acordada en conversación del 2026-08-30.

## Global Constraints

- No cambiar nombre ni versión de IndexedDB.
- No introducir `deleteDatabase` ni limpieza automática de datos.
- Número de trámite inmutable frente a lector PDF/web.
- No fusionar trámites distintos por finca/plano/derecho.
- No modificar funciones no solicitadas.
- Mantener compatibilidad PWA/Windows/tablet.

---

### Task 1: Contadores superiores
- [x] Prueba RED: Trámites = total, Gestión = trasladados, Activos = total - Gestión.
- [x] Corregir renderCaseList para conectar los tres contadores correctamente.
- [x] Ejecutar pruebas específicas y regresión de filtros/gestión.

### Task 2: Alarma y colores de Gestión
- [x] Prueba RED: expediente en Gestión >1 año sin Notificado/Registrado = rojo aunque esté `completed`.
- [x] Separar cálculo de antigüedad de la etapa workflow para Gestión.
- [x] Verificar azul y amarillo sin cambios.

### Task 3: Terminología Ubicación
- [x] Prueba RED: módulo operativo no muestra `Expediente de campo` ni `Expediente municipal de inspección` en navegación/formulario.
- [x] Cambiar solo los rótulos UI solicitados; no alterar títulos legales de informes.
- [x] Verificar navegación y reportes existentes.

### Task 4: Agrupación territorial segura
- [x] Prueba RED: alias explícitos agrupan; nombres distintos por un carácter no se agrupan automáticamente.
- [x] Restringir processGeoNamesMatch a normalización/alias explícitos, sin distancia de edición general.
- [x] Verificar inferencia de Distrito por Lugar único y conflictos.

### Task 5: PDF autónomo en tablet
- [x] Prueba RED: el motor PDF debe quedar preparado antes del primer PDF offline.
- [x] Precargar PDF.js/worker en caché durante instalación/actualización, preservando el caché entre versiones.
- [x] Verificar contrato de caché offline y análisis automático solo de campos vacíos.

### Task 6: Lector web y Leer área real
- [x] Prueba RED: no existe botón de lectura web duplicado fuera del lector interno cuando desktop está disponible; `Leer área` no depende solo de `getSelection()`.
- [x] Implementar selección rectangular/captura de área en ventana Electron con extracción de texto visible cuando sea posible y OCR local disponible como respaldo.
- [x] Mantener fallback navegador sin privilegios y protección de identidad.

### Task 7: Recuperación histórica y cierre
- [x] Auditar candidatos de recuperación sin modificar datos automáticamente.
- [x] Conservar exportación de informe de conflictos/candidatos y relinkear metadatos PDF al restaurar expediente separado.
- [x] Ejecutar suite completa, revisar alcance, sincronizar entradas, actualizar Service Worker/manifiesto.
- [x] Empaquetar ZIP y probar el ZIP extraído.
