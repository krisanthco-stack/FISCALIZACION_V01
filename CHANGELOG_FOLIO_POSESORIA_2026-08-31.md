# L-26 V27.3.9 — Folio único e Información posesoria

Fecha: 2026-08-31

## Solicitudes incorporadas

- Al importar **Excel** o **JSON**, un Folio/Finca ya existente no crea un trámite adicional.
- La coincidencia de importación por Folio/Finca tiene prioridad para este flujo de carga, aunque cambien el número de trámite, plano o derecho.
- La importación completa/carga de respaldo conserva los datos ya existentes y completa únicamente información faltante cuando coincide el Folio/Finca.
- Los contadores de Trámites y Gestión usan Folio/Finca único. Los registros sin Folio/Finca se cuentan individualmente.
- Si un Folio histórico aparece simultáneamente en un registro activo y otro ya trasladado a Gestión, se cuenta una sola vez y prevalece Gestión para el resumen; no vuelve a sumar como activo.
- En el módulo **Trámites**, cuando no existe Folio ni Finca se muestra **“Información posesoria”**.
- En **Información General**, la opción **“Información posesoria”** aparece solamente cuando Folio y Finca están vacíos. Al existir Folio o Finca, la opción se oculta y se desmarca.
- Se incrementó la clave de caché PWA para forzar la carga de esta versión y evitar reutilizar HTML/JS anteriores.

## Compatibilidad e integridad

- No se cambió la identidad transaccional usada para recuperación y asociación segura de documentos/PDF; únicamente cambió la regla de deduplicación de las importaciones y los contadores solicitados.
- La corrección anterior Metro/PWA → Electron permanece en el proyecto y sus pruebas de escritorio siguen pasando.
- Los machotes oficiales DOCX no fueron modificados.

## Pruebas añadidas/actualizadas

Se cubren expresamente:

- mismo Folio con diferente trámite/plano/derecho en Excel;
- búsqueda de coincidencia por Folio/Finca para JSON;
- conteo por Folio/Finca único;
- casos posesorios sin Folio/Finca contados individualmente;
- Folio histórico ya trasladado a Gestión no contado otra vez como activo;
- contrato de interfaz de “Información posesoria”.

La compuerta final `scripts/run_ci.py` se ejecuta nuevamente sobre el ZIP final extraído antes de la entrega.
