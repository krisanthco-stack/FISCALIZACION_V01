# Consolidación final GitHub L-26 — 2026-09-03

Esta consolidación parte de la fuente única GitHub ya auditada y reúne en un solo repositorio las correcciones posteriores que se habían distribuido como parches separados.

## Funcionalidad preservada

No se modificaron `index.html`, `Fiscalizacion_BI_V27_FINAL.html`, `app/`, `desktop/`, `templates/`, `sw.js` ni `manifest.webmanifest`. Por tanto, la apariencia, lógica fiscal, Trámites, Gestión, filtro `ALARMAS +1 AÑO`, croquis, enlaces Metro, generación de informes y machotes permanecen en la misma base funcional aprobada.

## Correcciones consolidadas

- GitHub Actions instala `pytest` y `lxml` en CI, Windows, Android, Pages y Release.
- Android usa `android.useAndroidX=true`, requerido por las dependencias ML Kit incluidas en el proyecto.
- `scripts/verify_packaged_runtime.py` define la raíz del repositorio antes de ejecutar la validación CLI, evitando `NameError: ROOT is not defined`.
- La prueba de contrato del constructor Windows acepta correctamente `npm` y `npm.cmd`, sin cambiar el constructor Electron.
- Se incluyen pruebas de regresión para AndroidX y para la ejecución CLI del verificador de runtime.

## Evidencia local de consolidación

- `P.C.F.xlsx`: conserva el enlace Metro específico de la finca 116422.
- `P.C.F(1).xlsx`: refresca el contador de alarmas sin `now.getFullYear is not a function`.
- Python: 229 pruebas aprobadas, 3 omitidas previstas.
- Node: 81 pruebas aprobadas.
- Electron: 14 pruebas aprobadas.
- `L26 CI gate: PASS`.
- Los cinco workflows `.yml` cargan correctamente como YAML.

## Validación de plataforma pendiente

La consolidación de fuente está verificada. La liberación final de artefactos requiere que GitHub Actions ejecute, sobre este mismo commit, Android y Windows y produzca/verifique el APK y los ejecutables Windows reales. No debe considerarse liberada una plataforma hasta que su workflow y artefactos estén verdes en el mismo SHA.
