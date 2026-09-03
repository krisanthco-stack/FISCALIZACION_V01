# L-26 — Corrección crítica Metro / PWA → Electron

Fecha: 2026-08-31

## Causa raíz
La captura que reprodujo el problema corresponde a una PWA de Chromium. La etiqueta anterior “Instalada” no diferenciaba una PWA de la aplicación Electron. Por esa razón, modificar únicamente `app-preload.js` no podía corregir el flujo observado.

## Cambios
- Registro del esquema `l26-reader://` en `desktop/package.json` para el instalador Windows.
- Registro defensivo con `app.setAsDefaultProtocolClient('l26-reader')`.
- Manejo del deep link al inicio y en `second-instance`.
- Handoff desde PWA Windows al lector Electron instalado.
- Conservación exacta de `https://metro.sarapiqui.go.cr/login`.
- Diferenciación visual entre `Escritorio`, `Android` y `PWA instalada`.
- Invalidación de caché PWA mediante nueva clave del Service Worker.
- Pruebas de regresión dedicadas.

## Validación disponible
- Gate completo de pruebas del repositorio: PASS.
- Build Windows real: no ejecutado por indisponibilidad DNS del registro npm en este entorno.
