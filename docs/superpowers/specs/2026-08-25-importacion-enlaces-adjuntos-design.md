# Diseño: importación de expedientes, enlaces y adjuntos

## Objetivo

Ampliar el módulo de carga de Fiscalización B.I. para importar expedientes desde Excel, conservar fechas e identificaciones, asociar enlaces y documentos, y completar campos faltantes mediante lectura asistida, sin modificar los machotes finales oficiales.

## Base y restricciones

- La implementación parte de `FISCALIZACION_V01-main/index.html` y se sincroniza con sus entradas equivalentes mediante las herramientas existentes del proyecto.
- No se modifica ningún byte de `Informe_Fiscalizacion_V01_MACHOTE_FINAL.docx` ni de `MS-FBI-RD-01-2026_RECTIFICACION_FINAL.docx`.
- Se preservan Gestión, Fiscalización, Informes, PWA, IndexedDB, importación/exportación JSON/ZIP y las demás funciones existentes.
- La solución debe continuar funcionando como aplicación HTML offline. La lectura de páginas remotas será de mejor esfuerzo y estará sujeta a permisos de red, CORS, autenticación y CAPTCHA.

## Importación del Excel

El importador reconocerá encabezados normalizados y variantes de:

- fecha;
- número de trámite;
- folio o finca;
- plano catastrado;
- derecho e identificadores de derecho;
- propietario e identificación;
- área, ubicación, observaciones y funcionario;
- enlace o URL, incluso si la URL aparece en una columna cuyo encabezado no indica que contiene enlaces.

Las fechas de Excel se convertirán a fecha ISO local y se mostrarán dentro de cada expediente. Las identificaciones se tratarán como texto para conservar ceros iniciales, guiones y formato original.

Si una fila no contiene número de trámite, podrá crear un expediente cuando tenga folio/finca o plano. El sistema generará un identificador interno estable sin inventar un número de trámite oficial.

## Identidad y duplicados

La clave funcional de importación será la combinación normalizada:

`folio o finca + plano + derecho`

Reglas:

1. Un mismo folio con plano distinto crea expedientes separados.
2. Un mismo folio con derecho distinto crea expedientes separados.
3. Si folio, plano y derecho coinciden, se conserva un único expediente.
4. Una repetición exacta completa únicamente campos vacíos del expediente conservado; no reemplaza valores existentes sin confirmación.
5. Cuando no exista folio, la identidad provisional usará plano + derecho; si tampoco existe derecho, usará el plano.
6. Las comparaciones ignoran espacios, mayúsculas y separadores visuales que no cambian el identificador.

Cuando una fila contenga varios campos `ID DERECHO`, cada derecho no vacío se conserva en el expediente. Para distinguir duplicados se usa el derecho principal de la fila y el conjunto normalizado de identificadores de derecho disponibles.

## Orden de expedientes

La lista resultante se ordenará por la fecha importada, del expediente más antiguo al más nuevo. Los expedientes sin fecha aparecerán después de los fechados y conservarán un orden estable.

## Enlaces y controles por expediente

Cada expediente podrá guardar un enlace de origen. La fila compacta y la vista del expediente incluirán controles pequeños:

- `Abrir`: abre la URL en una pestaña segura;
- `Leer`: intenta obtener y analizar el contenido accesible;
- `Adjuntar`: permite seleccionar imágenes JPG, JPEG, PNG o WEBP y documentos PDF.

Los archivos se almacenan en IndexedDB vinculados por el identificador interno del expediente. Se podrán abrir, reemplazar o eliminar mediante confirmación. El enlace original se conserva aunque se adjunte el documento descargado.

## Lectura y autocompletado

La lectura admite:

- texto visible de páginas accesibles;
- PDF con capa de texto;
- texto que el navegador pueda extraer de documentos cargados;
- imágenes y PDF escaneados cuando exista una capacidad OCR disponible en el navegador.

Los campos candidatos incluyen trámite, fecha, folio, finca, plano, derecho, propietario, identificación, área, provincia, cantón, distrito, localidad, dirección y observaciones.

Antes de aplicar resultados, la aplicación mostrará una vista previa seleccionable con valor detectado, campo de destino y valor actual. Por defecto solo seleccionará campos vacíos. Reemplazar un valor existente requerirá confirmación explícita.

Si la página exige autenticación, CAPTCHA o bloquea la lectura, la aplicación mostrará una explicación y mantendrá disponibles `Abrir` y `Adjuntar` para que el usuario descargue y cargue el documento manualmente.

## Persistencia y compatibilidad

Los nuevos campos de enlace, fecha importada, derechos y metadatos de lectura se incorporarán a la normalización de expedientes. La exportación e importación JSON/ZIP conservarán estos datos y los adjuntos sin invalidar respaldos de versiones anteriores.

## Manejo de errores

- Una fila inválida no detiene la importación completa; se registra como omitida con su motivo.
- Los enlaces inválidos se conservan como texto si pueden corregirse posteriormente.
- Un fallo de lectura no modifica el expediente.
- Un archivo no permitido o demasiado grande se rechaza con un mensaje claro.
- Los datos existentes no se borran durante importación, lectura o adjunto.

## Verificación

Las pruebas automatizadas y manuales cubrirán:

- lectura de `Libro2.xlsx` y de la plantilla oficial de importación;
- fechas Excel y orden ascendente;
- identificaciones con ceros y guiones;
- detección de URLs en cualquier columna;
- mismo folio con diferente plano;
- mismo folio con diferente derecho;
- repetición exacta conservada una sola vez;
- expediente sin trámite pero con folio o plano;
- adjuntos PDF e imagen vinculados al expediente correcto;
- vista previa y protección contra sobrescritura;
- compatibilidad JSON/ZIP, PWA e informes existentes;
- identidad binaria intacta de los dos machotes finales oficiales.
