# Estado de ejecución de la recuperación V26–V27

La auditoría previa no se eliminó. Se conserva íntegra en `audit/history/` y el DOCX vigente permanece disponible como evidencia del diagnóstico de regresión.

Por instrucción expresa posterior, se ejecutó una recuperación funcional offline con estos límites:

- módulo **INFORMES**, sin renombrarlo;
- exactamente dos salidas: **Informe Técnico + Resolución** y **Solicitud de Rectificación MS_FBI_RD**;
- módulo **GESTIÓN** con carga/importación y descarga/exportación JSON;
- módulo **AUDITORÍA** visible con trazabilidad de guardar, importar/exportar y generar documentos;
- generación DOCX desde los dos machotes aprobados mediante copias parametrizadas;
- sin valores de ejemplo como defaults del caso;
- entrada portable `index.html` y aplicación principal `app/index.html`;
- operación sin servicios externos.

Los bytes del HTML original V26–V27 no estaban disponibles en el entorno, por lo que la recuperación no se presenta como copia byte-a-byte de aquella versión. Este hecho queda documentado, no oculto.
