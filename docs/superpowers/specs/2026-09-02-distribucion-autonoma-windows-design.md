# Diseño: distribución autónoma Windows y actualización GitHub

## Objetivo
Entregar L-26 en dos canales sincronizados desde la misma base de código:

1. Un instalador Windows autónomo basado en Electron/NSIS, con Chromium embebido, que no dependa de Chrome, Edge, GitHub ni otro navegador para abrir o ejecutar la aplicación.
2. Un repositorio/paquete GitHub actualizado con el mismo código funcional y workflows de CI/build.

## Arquitectura
La aplicación web existente permanece sin cambios funcionales. `desktop/` actúa como shell Electron y sirve el contenido local por loopback (`127.0.0.1`) para conservar un origen estable de IndexedDB. Electron incluye su propio runtime Chromium y empaqueta el contenido web en `extraResources/app`; el instalador NSIS crea accesos directos y el portable sirve como alternativa sin instalación.

El repositorio GitHub y el instalador autónomo se generan desde el mismo commit. Los workflows de Windows deben producir y verificar `Setup.exe` y `Portable.exe`; los artefactos locales se generan con los mismos scripts y configuración.

## Requisitos
- No cambiar lógica fiscal, formularios, importación, enlaces Metro, filtros, Gestión, machotes ni croquis.
- Windows debe abrir L-26 sin depender de navegadores instalados.
- Todo recurso crítico para la interfaz y el lector PDF debe quedar local/offline dentro del paquete.
- Los enlaces externos como Metro requieren red únicamente al consultar el servicio externo; la aplicación debe continuar funcionando offline.
- El instalador debe usar NSIS, crear acceso directo, permitir directorio de instalación y tener desinstalador.
- El paquete GitHub debe conservar `.git`, workflows y el mismo commit usado para la entrega autónoma.
- Antes de entregar: CI completo, verificación del runtime empaquetado, hashes SHA-256 y comprobación de que los machotes no cambiaron.

## Validación
- `python scripts/run_ci.py` debe pasar.
- `desktop/package.json` debe declarar Electron/NSIS y runtime local.
- `scripts/verify_packaged_runtime.py --windows desktop/dist` debe aprobar el paquete si el build se puede generar.
- Si el entorno actual no puede descargar Electron/electron-builder o no puede construir un EXE Windows, se debe documentar como limitación y no afirmar que el instalador fue generado.
