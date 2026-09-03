# Criterios de liberación

La recuperación ejecutable solo puede liberarse si se cumplen todas estas condiciones:

1. Se conserva el contrato funcional accesible de V26–V27 y no se presentan como hechos funciones que no constan en las fuentes disponibles.
2. El módulo se llama **INFORMES**.
3. INFORMES ofrece exactamente las dos salidas acordadas: **INFORME TÉCNICO + RESOLUCIÓN** y **SOLICITUD DE RECTIFICACIÓN MS_FBI_RD**.
4. GESTIÓN conserva **Cargar/Importar JSON** y **Descargar/Exportar JSON** con round-trip sin pérdida de los campos importados.
5. Se conserva la auditoría/trazabilidad previa y la aplicación registra nuevas acciones relevantes.
6. MS_FBI_RD usa el machote final parametrizado y no reutiliza los datos de ejemplo como defaults del caso.
7. Informe Técnico + Resolución usa una copia parametrizada del machote final y admite sustitución del croquis/fotografía del expediente.
8. La interfaz usa el verde recuperado en tono más oscuro y evita un rediseño estructural innecesario.
9. No aparece **PRODUCTOS DE SALIDA** como nombre de módulo.
10. La aplicación abre sin dependencias de red: CSS, JSZip, logo y plantillas están dentro del repositorio.
11. Los DOCX generados no contienen tokens `«... »` sin sustituir y son ZIP/OOXML válidos.
12. Las pruebas automatizadas terminan con cero fallos; la prueba de navegador se ejecuta donde la política del entorno permita navegación del navegador automatizado.

La auditoría previa que exigía esperar los bytes originales se conserva en `audit/history/` como parte de la trazabilidad. La recuperación ejecutable actual no afirma ser una copia byte-a-byte del HTML V26–V27 original; implementa exclusivamente el contrato funcional accesible y los machotes aprobados.

## Fuente única y paridad de distribución

13. La rama `main` de GitHub es la **fuente única** de código para Windows, Android y PWA; ninguna distribución mantiene una copia funcional independiente.
14. `index.html` y `Fiscalizacion_BI_V27_FINAL.html` deben permanecer byte a byte idénticos antes de cualquier build.
15. Windows, Android y PWA se construyen desde `config/runtime_distribution_manifest.json` o se verifican contra ese mismo contrato del commit.
16. La publicación se bloquea si la comparación **SHA-256** detecta diferencias entre los archivos runtime canónicos y el artefacto Windows, Android o PWA.
17. Los machotes DOCX de `templates/` deben conservar el mismo contenido en todas las distribuciones y no pueden ser modificados por el proceso de empaquetado.
