# L-26 V27.3.9 — Correcciones de auditoría (2026-08-31)

## Corregido
- Consolidación física y recuperable de duplicados históricos por Folio/Finca.
- Conservación separada de expedientes de Información posesoria sin Folio/Finca.
- Relink de fotografías y documentos al registro superviviente.
- Respaldo JSON global completo de trámites, Gestión, fotografías, PDF y almacenes de recuperación.
- Respaldo ZIP global con `respaldo_completo.json`.
- Restauración global no destructiva, con deduplicación por Folio y protección contra colisiones de IDs.
- Pruebas runtime sobre las funciones reales incluidas en `index.html`.
- Verificación estructural obligatoria de los artefactos Windows y Android dentro de GitHub Actions.

## Validación automática
- Pytest: 210 passed, 3 skipped.
- Node aplicación: 73 passed.
- Electron/Desktop: 14 passed.
- CI: PASS.
- Machotes oficiales: sin cambios de SHA-256.

## Validación pendiente fuera de este entorno
- Ejecución del `.exe` Windows real y prueba manual PWA/EXE → `https://metro.sarapiqui.go.cr/login` → lector interno.
- Ejecución del APK en teléfono/tablet sin conexión.
- Browser E2E local: bloqueado aquí por política `ERR_BLOCKED_BY_ADMINISTRATOR`.
