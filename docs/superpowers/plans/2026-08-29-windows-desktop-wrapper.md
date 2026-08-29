# L-26 Windows Desktop Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Empaquetar L-26 como aplicación instalable/portable para Windows preservando intacta la aplicación web existente.

**Architecture:** Una carpeta `desktop/` añade Electron y un servidor HTTP loopback. El proceso principal inicia el servidor en `127.0.0.1`, abre la raíz original como `http://localhost:<puerto>` con Chromium y aplica aislamiento de Node; `electron-builder` empaqueta la capa de escritorio junto con los recursos originales.

**Tech Stack:** Electron, Node.js HTTP, electron-builder/NSIS, Python/pytest y Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-29-windows-desktop-wrapper-design.md`

## Global Constraints

- No modificar la lógica funcional ni los recursos existentes de L-26.
- Servir exclusivamente por `127.0.0.1`; nunca `0.0.0.0`.
- Mantener `nodeIntegration: false`, `contextIsolation: true` y `sandbox: true`.
- No introducir dependencia de GitHub para ejecutar o actualizar la aplicación.
- Conservar IndexedDB, Service Worker y Cache Storage mediante origen HTTP local.

---

### Task 1: Servidor HTTP local seguro

**Files:**
- Create: `desktop/server.js`
- Create: `desktop/test/server.test.js`

**Interfaces:**
- Produces: `startLocalServer({ rootDir, preferredPort }) -> Promise<{ server, origin, port }>` y `stopLocalServer(server) -> Promise<void>`.

- [ ] Escribir pruebas Node que creen una raíz temporal, verifiquen `GET /`, MIME básico, 404 y rechazo de traversal.
- [ ] Ejecutar `node --test desktop/test/server.test.js` y confirmar fallo porque `desktop/server.js` no existe.
- [ ] Implementar servidor loopback de archivos estáticos con normalización de rutas, `Cache-Control: no-cache` para HTML/SW y tipos MIME necesarios.
- [ ] Ejecutar la prueba y confirmar PASS.

### Task 2: Proceso Electron aislado

**Files:**
- Create: `desktop/main.js`
- Create: `desktop/test/config.test.js`

**Interfaces:**
- Consumes: `startLocalServer`, `stopLocalServer`.
- Produces: ventana principal que carga el `origin` local y cierra el servidor al salir.

- [ ] Escribir prueba estática que exija `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, uso de `127.0.0.1` y ausencia de preload.
- [ ] Ejecutar la prueba y confirmar fallo porque `desktop/main.js` no existe.
- [ ] Implementar el proceso principal, resolución de `process.resourcesPath/app`, bloqueo de navegaciones externas y apertura de enlaces externos con `shell.openExternal`.
- [ ] Ejecutar prueba y confirmar PASS.

### Task 3: Configuración de empaquetado Windows

**Files:**
- Create: `desktop/package.json`
- Create: `desktop/README_WINDOWS.md`
- Create: `desktop/build-icon.png`
- Create: `tests/test_windows_desktop_contract.py`

**Interfaces:**
- Produces: scripts `test`, `start`, `dist:win` y configuración `electron-builder` para NSIS y portable.

- [ ] Escribir prueba Python del contrato de `package.json`, nombres de artefactos y `extraResources`.
- [ ] Ejecutar `pytest -q tests/test_windows_desktop_contract.py` y confirmar fallo.
- [ ] Crear `package.json` con versiones fijadas y empaquetado de la raíz original bajo `resources/app`.
- [ ] Crear documentación de construcción/instalación y derivar icono de build del icono existente sin alterar los recursos originales.
- [ ] Ejecutar prueba y confirmar PASS.

### Task 4: Regresión y artefactos

**Files:**
- No modificar archivos funcionales existentes.
- Generate: `desktop/dist/*`.
- Generate: ZIP de entrega con código y artefactos construidos.

**Interfaces:**
- Consumes: wrapper terminado.
- Produces: instalador/portable Windows si `electron-builder` puede producirlos en el entorno actual.

- [ ] Calcular hashes SHA-256 de los archivos funcionales críticos antes de instalar dependencias/build.
- [ ] Ejecutar `pytest -q` y pruebas Node existentes.
- [ ] Ejecutar `npm install` en `desktop/`, luego `npm test`.
- [ ] Ejecutar `npm run dist:win` y verificar que los artefactos existen y tienen formato PE cuando sea aplicable.
- [ ] Recalcular hashes y confirmar que `index.html`, `app/index.html`, `sw.js`, `app/assets/*` y `templates/*` no cambiaron.
- [ ] Empaquetar una entrega final con el wrapper, instrucciones y artefactos Windows disponibles.
