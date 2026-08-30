# L-26 — Lector web interno Windows — 2026-08-29

## Objetivo
Abrir el enlace de un expediente dentro de una ventana propia de L-26 en la versión Windows y permitir leer la página o el texto seleccionado sin salir a un navegador externo.

## Funcionamiento
- `Abrir enlace` usa el lector interno cuando L-26 se ejecuta en Electron/Windows.
- El lector ofrece Atrás, Adelante, Recargar, Leer página, Leer selección y Cerrar.
- El sitio remoto se ejecuta dentro de un `WebContentsView` con `nodeIntegration: false`, `contextIsolation: true` y `sandbox: true`.
- La sesión remota es persistente (`persist:l26-source-reader`) para conservar sesiones/cookies del sitio entre aperturas.
- `Leer página` extrae únicamente el texto visible del documento cargado.
- `Leer selección` extrae únicamente el texto seleccionado por el usuario.
- Los datos regresan al expediente exacto por `caseId`.
- El texto se procesa mediante `ImportRules.detectFields` y `applyReadCandidates`.
- La protección de integridad existente impide que la lectura cambie el número de trámite del expediente.
- En PWA/navegador sin Electron, `Abrir enlace` conserva el fallback anterior al navegador y `Leer` conserva su ruta existente.

## Datos
No cambia el nombre ni la versión de IndexedDB. No agrega migraciones ni borrados de base.
