# Distribución Windows autónoma de L-26

## Qué recibe el usuario final

El instalador `Fiscalizacion-L26-Setup-<versión>.exe` contiene Electron, Chromium y el runtime local de L-26. La aplicación instalada **no depende de GitHub**, **no depende de Chrome** y **no depende de Edge** para iniciar, consultar expedientes, trabajar con IndexedDB, usar PDF local, importar/exportar o generar los recursos locales de L-26.

Los enlaces a sistemas externos como Metro requieren Internet solamente al abrir el sitio remoto. Si no hay conexión, L-26 continúa funcionando con la información almacenada localmente.

También se genera `Fiscalizacion-L26-Portable-<versión>.exe`, que contiene el mismo runtime autónomo sin instalación tradicional.

## Construcción local independiente de GitHub

En una computadora de compilación con Windows, Node.js 22 y Python 3:

```bat
BUILD_WINDOWS_STANDALONE.cmd
```

Ese comando:

1. ejecuta la compuerta completa de regresión;
2. comprueba que PDF.js y sus recursos offline están vendorizados;
3. instala las dependencias de compilación Electron/electron-builder si faltan;
4. construye NSIS + portable;
5. inspecciona el runtime empaquetado para confirmar que el HTML, lector PDF, preload, lector interno y protocolo `l26-reader` están dentro de la distribución.

Los usuarios finales no necesitan Node.js ni Python; esas herramientas solo se usan para compilar.

## Construcción desde GitHub

`.github/workflows/windows.yml` usa el mismo `scripts/build_windows_standalone.py`. Esto impide que el instalador local y el generado por GitHub usen procesos distintos.

GitHub es un canal de código/compilación, no una dependencia de ejecución. El `Setup.exe` puede copiarse e instalarse mediante USB, carpeta de red, almacenamiento institucional u otro medio sin acceso a GitHub.

## Actualización del repositorio

Para publicar una nueva versión:

```bash
git push origin main
git tag v27.3.9
git push origin v27.3.9
```

El tag activa el workflow de release que genera nuevamente los mismos artefactos autónomos y el APK Android.
