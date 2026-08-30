# L-26 Integridad y Recuperación — Diseño

## Objetivo

Corregir la identidad de expedientes para que trámites distintos nunca se fusionen por compartir finca/plano/derecho, proteger el número de trámite contra sobrescrituras del lector PDF/página, validar ubicación territorial y ofrecer una auditoría no destructiva de posibles inconsistencias previas.

## Invariantes

1. El número de trámite es parte obligatoria de la identidad cuando existe.
2. Dos trámites distintos del mismo inmueble son expedientes independientes.
3. Un mismo trámite puede conservar registros distintos cuando cambia finca/plano/derecho.
4. La deduplicación solo consolida repeticiones verdaderamente idénticas de trámite + inmueble/plano/derecho.
5. Un PDF o página nunca cambia automáticamente el número de trámite del expediente abierto.
6. Si el lector detecta un trámite diferente, se registra como conflicto y se conserva el trámite actual.
7. Los procesos de Excel, restauración, Gestión y recuperación de bases usan la misma identidad transaccional.
8. La actualización no borra registros ni adjuntos; ante duda, conserva ambos registros.
9. Los distritos importados se normalizan contra la lista oficial de Sarapiquí y valores no válidos no reemplazan un distrito válido.
10. La auditoría de integridad es de solo lectura y detecta documentos vinculados a un trámite diferente, distritos sospechosos e identidades duplicadas.

## Identidad

`caseIdentityKey` usa:

- con trámite: `T:<tramite>|B:<folio/finca>|P:<plano>|D:<derecho>`;
- sin trámite: `NO-T|B:<folio/finca>|P:<plano>|D:<derecho>`;
- si no hay datos suficientes: cadena vacía.

Esto evita que `2024-07370` y `2025-17123` se fusionen aunque correspondan al mismo inmueble, y al mismo tiempo conserva expedientes separados dentro de un mismo trámite cuando su combinación de propiedad difiere.

## Lectura PDF/Página

El lector puede reemplazar automáticamente campos descriptivos, pero `tramite` es un campo protegido. Si el documento detecta otro número, se guarda en `readerMetadata.identityConflicts` con fecha, fuente, trámite actual y trámite detectado. La lectura continúa con los demás campos válidos.

## Territorio

Distritos válidos: Puerto Viejo, La Virgen, Las Horquetas, Llanuras del Gaspar y Cureña. Se admite normalización de `Horquetas` a `Las Horquetas`. Un distrito desconocido no reemplaza uno existente válido; se registra como advertencia de auditoría.

## Recuperación

Las rutinas de importación/restauración dejan de buscar coincidencia únicamente por inmueble. Solo se fusionan identidades transaccionales exactas. Si un registro entrante tiene conflicto de trámite con otro registro, se conserva como registro separado. Adjuntos se mantienen asociados al `caseId` resultante.

## Auditoría

Se incorpora un núcleo de auditoría que puede analizar casos y documentos sin modificarlos y reportar:

- documentos cuyo `expedienteNumber` no coincide con el trámite del `caseId` enlazado;
- identidades transaccionales repetidas;
- expedientes sin trámite;
- distritos no reconocidos.
