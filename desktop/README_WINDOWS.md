# L-26 para Windows

Esta carpeta agrega una envoltura Electron a la aplicación L-26 existente. No reemplaza ni reescribe `index.html`, `sw.js`, IndexedDB ni los módulos funcionales.

## Funcionamiento

Al abrir la aplicación de Windows, Electron inicia un servidor privado en `127.0.0.1` y carga L-26 desde ese origen local. Esto permite conservar el Service Worker, IndexedDB y Cache Storage en un contexto HTTP local sin depender de GitHub ni de Internet para iniciar la aplicación.

El usuario final no necesita instalar Node.js, Python, GitHub, Chrome ni Edge para ejecutar el instalador o la versión portable.

## Construcción

Desde esta carpeta, en un equipo o entorno de compilación con Node.js:

```bash
npm install
npm test
npm run dist:win
```

Los artefactos se generan en `desktop/dist/`:

- `Fiscalizacion-L26-Setup-26.0.0.exe`: instalador Windows.
- `Fiscalizacion-L26-Portable-26.0.0.exe`: ejecutable portable.

## Datos locales

Los expedientes y adjuntos continúan persistiendo mediante IndexedDB en el perfil de Electron. Instalar una nueva versión no debe borrar ese perfil. Antes de migraciones importantes se recomienda usar las funciones de respaldo/exportación que ya incorpora L-26.

## Actualizaciones

Esta envoltura no usa GitHub para autoactualizarse. Una actualización se distribuye como un nuevo instalador o ejecutable portable. La aplicación conserva su lógica PWA interna, pero la distribución de nuevas versiones del `.exe` es independiente.

## Lector web interno de enlaces
En la versión Windows, el botón **Abrir enlace** abre una ventana propia de L-26. Desde esa ventana se puede navegar y usar **Leer página** o **Leer selección** para enviar texto al expediente asociado. El número de trámite del expediente permanece protegido y no se reemplaza por el contenido leído.

## Abrir L-26 realmente como aplicación de escritorio

Para que **Abrir enlace**, **Leer página** y **Leer área** funcionen dentro de una ventana propia de L-26, no abra `index.html` con Chrome o Edge.

Desde la raíz del paquete haga doble clic en:

`ABRIR_L26_WINDOWS.cmd`

En la primera apertura el lanzador ejecuta `npm install` únicamente si el motor Electron todavía no está preparado y después ejecuta `npm start`. Las aperturas siguientes reutilizan la instalación existente.

Si `index.html` se abre accidentalmente en Chrome/Edge en Windows, L-26 ya no enviará el enlace a otra pestaña de Chrome: mostrará un aviso para abrir el modo escritorio.

**Datos existentes:** Chrome/Edge y Electron usan perfiles de almacenamiento distintos. Si sus expedientes actuales viven en el navegador, exporte un respaldo antes de comenzar a trabajar de forma permanente en la versión de escritorio e impórtelo allí. No borre los datos del navegador hasta comprobar el respaldo.
