# Diseño: GitHub como fuente única y paridad de distribuciones L-26

## Objetivo

Establecer la rama `main` del repositorio GitHub de L-26 como fuente canónica única para PWA/web, Windows Electron y Android, impidiendo que un empaquetado publique una apariencia, lógica funcional o machotes distintos a los archivos aprobados del mismo commit.

## Arquitectura

`index.html` de la raíz es la entrada canónica de la aplicación. `Fiscalizacion_BI_V27_FINAL.html` debe permanecer byte a byte idéntico a esa entrada; `app/index.html` se conserva únicamente como redirección de compatibilidad hacia `../index.html`. Los recursos runtime se definen en un contrato central compartido por los verificadores y por los empaquetados web/Android.

Windows Electron sigue empaquetando la aplicación local en `resources/app`; Android sincroniza el mismo runtime dentro de `assets/www`; GitHub Pages publica un artefacto web ensamblado desde los mismos archivos. Las compuertas comparan hashes de los archivos empaquetados contra los archivos canónicos del checkout que generó el build.

## Invariantes

1. No modificar lógica fiscal, formularios, filtros, alarmas, croquis, Gestión, importación, enlaces Metro ni generación de informes.
2. `index.html` y `Fiscalizacion_BI_V27_FINAL.html` permanecen idénticos.
3. Los machotes DOCX existentes permanecen byte a byte sin modificación durante esta tarea.
4. Windows, Android y PWA deben empaquetar el mismo `index.html`, `sw.js`, manifiesto, iconos, `app/assets`, `templates` y `config` del commit.
5. Una divergencia de hash entre fuente y artefacto debe fallar el workflow antes de publicar.
6. GitHub Pages es un canal de publicación, no una dependencia de ejecución de los instalables nativos.
7. El funcionamiento offline se conserva; los servicios externos como Metro siguen requiriendo red solo al consultarlos.

## Comp puertas de paridad

- Una prueba contractual exige un manifiesto central de runtime y los pasos de paridad en los workflows.
- Un verificador de árbol compara un runtime ensamblado/extraído contra la fuente canónica por SHA-256.
- El verificador de Windows comprueba el runtime en `resources/app` contra la fuente del checkout.
- El verificador de Android compara los archivos dentro del APK contra la fuente del checkout.
- El artefacto PWA de GitHub Pages se construye desde el mismo manifiesto de runtime y se verifica antes de subirlo.

## Criterios de aceptación

1. `python scripts/run_ci.py` finaliza con cero fallos.
2. Los hashes de los machotes antes y después de esta tarea son iguales.
3. Un runtime alterado deliberadamente hace fallar el verificador de paridad.
4. Los workflows Windows, Android, Pages y Release ejecutan compuertas de paridad antes de publicar artefactos.
5. La auditoría confirma que no hubo cambios en `index.html`, `Fiscalizacion_BI_V27_FINAL.html`, `sw.js`, `desktop/main.js` ni machotes.
