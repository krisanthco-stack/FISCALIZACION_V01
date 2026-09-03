# Fiscalización de Bienes Inmuebles L-26 — V27.3.9

Repositorio consolidado de la aplicación L-26. La fuente canónica es `index.html`; `Fiscalizacion_BI_V27_FINAL.html` se mantiene sincronizado y `app/index.html` es únicamente un redireccionamiento de compatibilidad.

## Uso y distribución

Este ZIP es el **repositorio fuente listo para GitHub**, no un instalador nativo ya compilado. Los usuarios finales de Windows y Android deben usar los artefactos generados por GitHub Actions:

- Windows: `Fiscalizacion-L26-Setup-<version>.exe` o la versión portable.
- Android: `Fiscalizacion-L26-Android.apk`.

No se debe usar `index.html` como sustituto de la aplicación Windows instalada cuando se necesita el lector web interno. En Windows el lector interno requiere Electron; en Android requiere la aplicación nativa WebView.

## Funciones protegidas

- IndexedDB `LibretaValoracionCR`, versión 6; no se borra la base al actualizar.
- Identidad de trámite protegida: trámites diferentes no se fusionan por compartir finca, plano o derecho.
- Gestión conserva importación/exportación, Notificado/Registrado, filtros y estados.
- PDF adjunto completa únicamente campos vacíos; nunca reemplaza el número de trámite.
- PDF.js 4.10.38 legacy se empaqueta localmente en los builds Windows/Android.
- Android usa OCR latino bundled para PDF escaneados y mantiene funciones locales sin conexión.
- `Leer página` / `Leer área` pertenecen al lector web interno, no al visor PDF.
- Los machotes finales oficiales se conservan sin cambios estructurales.

## Validación

Ejecute `python scripts/run_ci.py` antes de liberar. Los workflows de GitHub ejecutan la misma compuerta antes de construir los instaladores.

## GitHub

La distribución automática se documenta en `GITHUB_DISTRIBUCION_WINDOWS_ANDROID.md`. Los tags `vMAJOR.MINOR.PATCH` actualizan la versión visible, la versión Windows/Android y la generación del Service Worker antes de construir el Release.

## Fuente única de distribución

La rama `main` es la fuente única para PWA, Windows y Android. El contrato `config/runtime_distribution_manifest.json` define los archivos runtime comunes y `scripts/distribution_parity.py` compara SHA-256 entre la fuente y cada artefacto. Los workflows `windows.yml`, `android.yml`, `pages.yml` y `release.yml` bloquean la publicación si detectan una divergencia.

Esto permite que la apariencia, funciones e informes provengan del mismo `index.html`, los mismos recursos y los mismos machotes en todos los canales. GitHub sirve como repositorio y constructor; los ejecutables Windows y APK instalados siguen funcionando localmente sin depender de GitHub para arrancar.
