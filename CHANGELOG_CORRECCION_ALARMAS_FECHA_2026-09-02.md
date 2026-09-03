# Corrección de regresión — contador ALARMAS +1 AÑO

Fecha: 2026-09-02

## Síntoma
Al importar/cargar datos con fechas, Trámites podía mostrar:

`Error: now.getFullYear is not a function`

## Causa raíz
El contador del filtro usaba `cases.filter(caseNeedsAgeAlarm)`. `Array.filter` invoca el callback con `(elemento, índice, arreglo)`, por lo que el segundo argumento `índice` sustituía el parámetro opcional `now` de `caseNeedsAgeAlarm(c, now = new Date())`.

## Corrección
El contador ahora invoca el predicado mediante una función de un solo argumento:

`cases.filter(c => caseNeedsAgeAlarm(c))`

No se modificó la regla de alarmas ni ninguna otra funcionalidad.

## Prevención de regresión
Se agregó una prueba que importa el fixture real `P.C.F(1).xlsx`, construye casos con sus fechas y ejecuta el refresco del contador de alarmas. La prueba reproduce el error antes de la corrección y pasa después.

También se incrementó la generación de caché del Service Worker para impedir que una PWA instalada conserve el HTML defectuoso anterior.
