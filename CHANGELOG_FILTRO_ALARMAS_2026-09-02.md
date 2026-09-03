# Filtro ALARMAS +1 AÑO — 2026-09-02

Único cambio funcional de esta entrega:

- En **Trámites > Buscar expedientes > Filtro rápido** se agregó **ALARMAS +1 AÑO**.
- El contador usa la regla de alarma ya existente (`caseNeedsAgeAlarm`), sin crear una segunda lógica de vencimiento.
- Al activarlo se muestran únicamente trámites activos con alarma de más de un año.
- Se combina con búsqueda, año, distrito, lugar y USO AGRO.
- Gestión no recibe este filtro.
- Se incrementó únicamente la clave de caché PWA para publicar el nuevo control.

No se modificaron importación Excel/JSON, enlaces Metro, Gestión, croquis, machotes, cálculos ni reglas fiscales.
