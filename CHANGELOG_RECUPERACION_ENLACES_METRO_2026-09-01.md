# L-26 — Recuperación de enlaces Metro — 2026-09-01

## Historial recuperado
- Se restaura el contrato documentado el 2026-08-29: Electron usa lector interno y PWA/navegador conserva apertura web normal.
- Se conserva la regla V27.3.7-FINAL del 2026-08-27: cuando no existe enlace específico se usa `https://metro.sarapiqui.go.cr/`.

## Importación Excel
- El lector XLSX ahora recupera URLs almacenadas dentro de fórmulas `HYPERLINK(...)`, además de hyperlinks OOXML convencionales.
- Validación con `P.C.F.xlsx`: 539 registros y 539 enlaces Metro recuperados.
- Caso de referencia: Finca `116422`, ID `15173394`, URL `https://metro.sarapiqui.go.cr/processes/15173394`.

## Abrir enlace
- PWA/web vuelve a abrir directamente la URL HTTP/HTTPS.
- Electron conserva el lector interno y `l26-reader://` únicamente como respaldo del shell nativo.
- Si el lector nativo falla, se intenta la apertura web en lugar de dejar el botón sin acción.

## Caché
- Se incrementa la versión de caché del Service Worker para distribuir la corrección a instalaciones PWA.

## Pruebas
- Nueva suite `tests/l26_metro_formula_links.test.js` con fixture real `P.C.F.xlsx` cuando está disponible.
- Contratos antiguos que exigían bloquear PWA o forzar `l26-reader://` fueron actualizados para coincidir con el historial funcional del proyecto.
