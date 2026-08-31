# Fiscalización de Bienes Inmuebles — control V26/V27

Repositorio de control para continuar **sobre la línea base V26–V27**, sin reconstruir módulos existentes.

## Contrato activo

- Módulo principal: **INFORMES**.
- Salida 1: **INFORME TÉCNICO + RESOLUCIÓN**.
- Salida 2: **SOLICITUD DE RECTIFICACIÓN MS_FBI_RD**.
- **GESTIÓN** conserva todas sus funciones de V26/V27; están protegidas explícitamente **Cargar/Importar JSON** y **Descargar/Exportar JSON**.
- Las auditorías previas se preservan por trazabilidad, pero no sustituyen el contrato activo.
- La interfaz debe conservar la paleta original V26/V27; el único cambio autorizado es oscurecer los verdes originales.

## Estado de la aplicación

Los bytes del artefacto ejecutable/código fuente V26/V27 no están presentes en el runtime activo. Por seguridad, este repositorio **no contiene una aplicación reconstruida**. `app_baseline/STATUS.json` bloquea esa sustitución conceptual.

Cuando el artefacto exacto V26/V27 esté disponible en el entorno, el flujo es:

1. Copiarlo sin modificar a una rama de integración.
2. Ejecutar `scripts/regression_gate_v26_v27.py` contra la base.
3. Aplicar únicamente la integración de MS_FBI_RD dentro de INFORMES.
4. Aplicar `darken_green_palette.py` únicamente sobre la copia candidata y revisar el diff.
5. Ejecutar todas las pruebas antes de liberar.

## Estructura

- `contracts/`: reglas activas y cambios permitidos/prohibidos.
- `templates/final/`: dos machotes finales entregados.
- `templates/parametrized/`: machote MS_FBI_RD listo para inyección de datos.
- `config/`: mapa de campos del oficio.
- `audit/active/`: auditoría de regresión vigente.
- `audit/history/`: auditorías anteriores conservadas, no borradas.
- `scripts/`: puertas automáticas de regresión y paleta.
- `tests/`: pruebas de contrato, plantillas y herramientas.

## Carga / importación del repositorio

Para evitar fallos de importación por estructura del ZIP, la entrega portable se genera con **una sola carpeta raíz** mediante `scripts/build_portable_package.py`. El archivo `REPOSITORY_DESCRIPTOR.json` identifica explícitamente este paquete como repositorio de control e integración y declara si la línea base ejecutable V26/V27 está físicamente presente.

Importante: mientras `application_baseline_present` sea `false`, este repositorio puede abrirse, clonarse, auditarse y ejecutar sus pruebas, pero **no debe presentarse como la aplicación V26/V27 ejecutable**.

## Aplicación ejecutable recuperada

La entrega incluye ahora una aplicación HTML offline:

- `index.html` — entrada portable para abrir con doble clic.
- `app/index.html` — aplicación principal.
- `Fiscalizacion_BI_V27_FINAL.html` — entrada alternativa con nombre explícito.

La aplicación conserva el contrato funcional accesible de V26–V27: GESTIÓN con importación/exportación JSON, FISCALIZACIÓN, INFORMES con exactamente dos salidas y AUDITORÍA. Los DOCX se generan en el navegador usando copias parametrizadas de los dos machotes oficiales, sin servicios externos.

## Distribución Windows y Android desde GitHub

La configuración automática de instalación está documentada en [`GITHUB_DISTRIBUCION_WINDOWS_ANDROID.md`](GITHUB_DISTRIBUCION_WINDOWS_ANDROID.md). GitHub Actions ejecuta las pruebas, incluye el motor PDF compatible y genera el instalador Windows y el APK Android.
