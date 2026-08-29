# Diseño: envoltura Windows para L-26

## Objetivo

Distribuir L-26 como aplicación instalable de Windows sin depender de GitHub, sin reescribir ni modificar la lógica funcional existente de la PWA.

## Arquitectura

La aplicación web existente permanece en la raíz del repositorio sin cambios funcionales. Una nueva carpeta `desktop/` contiene un proceso principal de Electron y un servidor HTTP local de solo lectura que publica la raíz de L-26 enlazando exclusivamente en `127.0.0.1` sobre un puerto local. Electron abre la aplicación mediante `http://localhost:<puerto>` para conservar el indicador de contexto seguro que ya usa L-26.

El uso de HTTP local preserva el registro existente de `sw.js`, IndexedDB, Cache Storage, blobs, descargas y demás APIs de navegador que ya emplea L-26. El puerto se selecciona dinámicamente para evitar colisiones. El servidor solo escucha en loopback y no expone la aplicación a la red local.

## Aislamiento y seguridad

- `nodeIntegration: false`.
- `contextIsolation: true`.
- `sandbox: true`.
- No se inyecta `preload` ni API de Node en la página de L-26.
- Navegaciones fuera del origen local se bloquean en la ventana principal y se abren con el navegador del sistema cuando corresponda.
- El servidor rechaza rutas que salgan de la raíz publicada y solo sirve archivos del paquete.

## Persistencia

IndexedDB, Cache Storage y Service Worker quedan asociados al perfil persistente de Electron. La aplicación no borra datos al cerrar ni al actualizar el ejecutable. El origen local debe permanecer estable desde la perspectiva del navegador; por ello Electron conserva un puerto local fijo preferido y usa un puerto alternativo solo si el preferido está ocupado.

## Empaquetado

`electron-builder` produce:

- instalador NSIS `Fiscalizacion-L26-Setup-<version>.exe`;
- paquete portable `Fiscalizacion-L26-Portable-<version>.exe` cuando el entorno de construcción lo permita.

Los recursos de L-26 se copian dentro de la aplicación mediante `extraResources`, excluyendo únicamente archivos de desarrollo innecesarios para el runtime de escritorio.

## Compatibilidad funcional

No se modifican `index.html`, `app/index.html`, `sw.js`, archivos de `app/assets`, plantillas DOCX, contratos ni datos de aplicación. Las pruebas existentes deben seguir pasando sin cambios. Se agregan pruebas específicas para el servidor local y el contrato de configuración de Electron.

## Actualizaciones

La función web existente de búsqueda manual de actualización mediante Service Worker puede no encontrar una versión remota dentro del ejecutable. No se implementa auto-update de Electron en esta entrega para evitar introducir dependencia de GitHub u otro servidor. Las nuevas versiones se distribuyen como un nuevo instalador.

## Criterios de aceptación

1. L-26 abre en una ventana Windows desde `http://localhost:<puerto>/`, con el servidor enlazado exclusivamente a `127.0.0.1`.
2. El HTML y la lógica funcional original no cambian.
3. El servidor no escucha fuera de loopback.
4. Las rutas fuera de la raíz son rechazadas.
5. La suite de regresión existente continúa pasando.
6. Se puede construir un artefacto Windows sin que el usuario final necesite Node, Python, GitHub o un navegador externo.
