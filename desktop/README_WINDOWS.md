# L-26 para Windows

Esta carpeta contiene la envoltura Electron de la aplicación L-26. No reemplaza ni reescribe `index.html`, `sw.js`, IndexedDB ni los módulos funcionales.

## Instalador autónomo

El instalador `Fiscalizacion-L26-Setup-27.3.9.exe` y la versión `Fiscalizacion-L26-Portable-27.3.9.exe` incluyen Electron y su propio Chromium. El usuario final no necesita instalar Node.js, Python, GitHub, Chrome ni Edge para ejecutar L-26.

Al abrir la aplicación, Electron inicia un servidor privado ligado exclusivamente a `127.0.0.1` y carga el runtime L-26 empaquetado dentro del instalador. Service Worker, IndexedDB y Cache Storage se mantienen en un origen HTTP local estable y la aplicación puede iniciar sin Internet.

Los servicios externos, por ejemplo `https://metro.sarapiqui.go.cr/`, requieren conexión únicamente cuando se consultan. La falta de Internet no impide abrir L-26 ni trabajar con los datos y recursos locales.

## Construcción para desarrolladores

Desde la raíz del repositorio puede ejecutarse:

```bat
BUILD_WINDOWS_STANDALONE.cmd
```

El script ejecuta la regresión completa, prepara los recursos PDF offline, instala las dependencias de compilación si faltan, construye NSIS + portable y verifica el runtime empaquetado.

Los artefactos se generan en `desktop/dist/`:

- `Fiscalizacion-L26-Setup-27.3.9.exe`: instalador Windows con acceso directo y desinstalador.
- `Fiscalizacion-L26-Portable-27.3.9.exe`: ejecutable portable autónomo.

Node.js/npm son herramientas de **compilación**, no requisitos del usuario final.

## Datos locales

Los expedientes y adjuntos persisten mediante IndexedDB en el perfil de Electron. Actualizar mediante un nuevo instalador no debe borrar ese perfil. Antes de migraciones importantes utilice **Descargar JSON completo** o **Descargar ZIP completo** y compruebe el respaldo.

## Actualizaciones

La aplicación instalada no necesita GitHub para ejecutarse ni para acceder a sus datos locales. Una actualización puede distribuirse copiando un nuevo `Setup.exe` o portable por USB, red local, almacenamiento institucional u otro medio.

El repositorio GitHub es un canal separado para conservar el código fuente y generar futuras versiones; no es una dependencia del instalador.

## Lector interno de enlaces

En Electron, **Abrir enlace** utiliza una ventana propia de L-26. El lector interno permite navegar, leer página o selección y enviar los datos detectados al expediente sin sustituir el número de trámite protegido.

El instalador registra el protocolo `l26-reader://` como mecanismo de integración de Windows. El funcionamiento principal de la aplicación de escritorio no depende de Chrome, Edge ni de una PWA instalada.

## Desarrollo y diagnóstico sin instalador

Para desarrollo del **lector web interno** todavía se conserva `ABRIR_L26_WINDOWS.cmd`. Ese lanzador es una herramienta de desarrollo/fallback del repositorio y no es el método de ejecución para el usuario que recibe `Setup.exe`.

El comando subyacente de empaquetado sigue siendo:

```bash
npm run dist:win
```

`BUILD_WINDOWS_STANDALONE.cmd` automatiza esa misma secuencia con las comprobaciones previas y posteriores.
