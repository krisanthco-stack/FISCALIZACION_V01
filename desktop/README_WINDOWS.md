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
