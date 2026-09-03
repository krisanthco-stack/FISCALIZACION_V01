# Distribución automática de L-26 desde GitHub

Este repositorio está preparado para que GitHub construya L-26 sin usar CMD ni Node en la computadora del usuario final.

## Qué genera GitHub

- Windows: `Fiscalizacion-L26-Setup-<version>.exe` y `Fiscalizacion-L26-Portable-<version>.exe`.
- Android: `Fiscalizacion-L26-Android.apk` para tablet o celular.
- Antes de construir, GitHub ejecuta la compuerta completa `python scripts/run_ci.py`.
- Ambos paquetes incluyen el motor PDF.js 4.10.38 legacy de forma local. Si GitHub no puede incluir ese motor, el build falla y no publica un instalador incompleto.

## Builds de prueba

Cada `push` a `main` ejecuta:

- `.github/workflows/ci.yml`: pruebas.
- `.github/workflows/windows.yml`: instalador/portable Windows como Artifact.
- `.github/workflows/android.yml`: APK de prueba como Artifact.

En GitHub: **Actions → workflow → ejecución → Artifacts**.

## Release oficial

Al crear un tag con formato `vMAJOR.MINOR.PATCH`, por ejemplo `v26.2.0`, `.github/workflows/release.yml`:

1. Ejecuta las pruebas.
2. Ajusta automáticamente la versión de Windows y Android al tag.
3. Incluye PDF.js compatible y offline.
4. Genera los ejecutables Windows.
5. Genera el APK Android firmado.
6. Crea un GitHub Release y adjunta los instaladores.

Los usuarios descargan únicamente el `.exe` o `.apk`; no necesitan Node, CMD ni GitHub Desktop.

## Firma estable de Android

Para que una nueva versión del APK pueda instalarse encima de la anterior sin desinstalarla, el Release oficial usa una misma clave de firma. La clave privada NO debe guardarse en el repositorio.

En GitHub abre **Settings → Secrets and variables → Actions → New repository secret** y crea estos cuatro Secrets:

- `L26_ANDROID_KEYSTORE_BASE64`: contenido del archivo `.jks` codificado en Base64.
- `L26_ANDROID_KEYSTORE_PASSWORD`: contraseña del keystore.
- `L26_ANDROID_KEY_ALIAS`: alias de la clave.
- `L26_ANDROID_KEY_PASSWORD`: contraseña de la clave.

Conserve una copia segura del `.jks` y las contraseñas fuera de GitHub. Si se pierde esa clave, Android no permitirá actualizar normalmente la aplicación ya instalada con otra firma.

## PDF en Windows y Android

Los dos builds ejecutan `python scripts/vendor_pdfjs.py --required` antes de empaquetar. El script fija **PDF.js 4.10.38 legacy**, obtiene el paquete desde dos registros alternativos y copia dentro de `app/assets/vendor/pdfjs-4.10.38-legacy/` el motor, el worker, CMaps y fuentes estándar. Si falta cualquiera de los recursos obligatorios, el APK no se construye.

El lector busca primero esa copia local. Por eso el `.exe` y el `.apk` publicados no dependen de Chrome ni de un CDN para abrir PDFs. La aplicación conserva además la compatibilidad `Uint8Array.toHex/fromHex` para Chromium/WebView que no implementen esas APIs.

- PDF con texto digital: lectura automática y extracción de texto.
- PDF adjunto al expediente: completa únicamente campos vacíos y no cambia el número de trámite.
- PDF escaneado en Android: usa **ML Kit Text Recognition latino bundled (`com.google.mlkit:text-recognition:16.0.1`)**, cuyo modelo queda incluido dentro del APK y está disponible sin Internet desde el primer uso. `TextDetector` queda únicamente como respaldo en otros entornos que lo ofrezcan.

## Android

La aplicación Android es una envoltura nativa con WebView propio:

- La aplicación L-26 se carga desde assets internos del APK.
- Los PDF se visualizan con el lector PDF.js interno, incluido físicamente en el APK.
- El OCR latino para PDF escaneado también queda empaquetado en el APK; no se descarga al primer uso.
- Expedientes, Gestión, croquis, filtros, formularios, fotos y PDF adjuntos funcionan con los datos locales sin conexión.
- Solo consultar una página web externa nueva requiere Internet, porque su contenido no pertenece a L-26.
- Los enlaces web externos se abren dentro de `ReaderActivity` de L-26, no en Chrome.
- `Leer página` y `Leer área` devuelven la información al expediente que abrió el enlace.

## Windows

Electron empaqueta L-26 como aplicación de escritorio. Los enlaces se abren en el lector interno de Electron y los PDF usan el mismo lector PDF.js local incluido en el instalador.

Nota: mientras no se configure un certificado de firma de código de Windows, Windows SmartScreen puede mostrar una advertencia al instalar un `.exe` nuevo. Esto no impide la construcción ni la instalación.
