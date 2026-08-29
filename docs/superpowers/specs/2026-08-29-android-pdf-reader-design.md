# L-26 Android PDF Reader Design

## Goal
Replace the fragile embedded-browser PDF preview with an L-26-controlled viewer that works on Android tablets and Windows, lets the user select an area with touch/mouse, extracts text from that area, and automatically updates recognized case fields.

## Approved behavior
- The user explicitly chose automatic replacement (option C): recognized values replace existing case values when the user invokes a read action.
- PDF viewing stays inside the L-26 modal whenever the internal viewer is available.
- The viewer supports previous/next page, zoom, fit width, read current page, and read selected area.
- Area selection works with pointer events so it supports mouse, stylus, and touch.
- Text PDFs are read through PDF.js text content.
- For image/scanned regions, local browser TextDetector OCR is attempted when that API exists. If unavailable, L-26 reports that OCR is not available rather than sending the document to an external service.
- A system-reader fallback remains available without changing the stored PDF.

## Architecture
`app/assets/l26_pdf_reader.js` owns PDF.js loading, rendering, page state, text geometry, area selection, and optional native OCR. PDF.js 6.2.108 is loaded lazily from jsDelivr and cached in Cache Storage after first successful use, keeping normal L-26 startup light and allowing subsequent offline use from the browser cache. `index.html` owns the modal, case persistence, ImportRules field detection, and automatic writes to IndexedDB.

## Data flow
1. User opens an attached PDF or presses Leer on a PDF source link.
2. L-26 opens the internal viewer and renders the current page to canvas.
3. User presses Leer página or Leer área.
4. The reader returns normalized text to `index.html`.
5. `ImportRules.detectFields` extracts known case fields.
6. L-26 writes every recognized field to the case record, replacing prior values, records reader metadata, rerenders the active case/list, and shows what changed.

## Failure handling
- If PDF.js cannot load, keep the modal open and show a clear error plus “Abrir en lector del dispositivo”.
- If no text intersects the selected area, attempt local TextDetector OCR when available.
- If OCR is unavailable or finds no text, do not modify the case.
- Closing the viewer cancels render state and revokes Blob URLs.

## Testing
- Static contract tests verify the iframe-only viewer is replaced by canvas controls and the reader asset is loaded.
- Node unit tests verify geometric area/text selection helpers.
- Existing Python and Node regression suites must remain green, excluding tests that depend on external fixture files not present in the ZIP.
