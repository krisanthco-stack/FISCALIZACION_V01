(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ImportRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const compact = value => String(value ?? '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');
  const preserveIdentifier = value => value == null ? '' : String(value).trim();
  const normalizeHeader = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  function parseExcelDate(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'number' || /^\d{5}(?:\.\d+)?$/.test(String(value).trim())) {
      const serial = Number(value);
      if (!Number.isFinite(serial)) return '';
      const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
      return date.toISOString().slice(0, 10);
    }
    const text = String(value).trim();
    let match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
  }

  function extractLink(row) {
    for (const value of Object.values(row || {})) {
      const match = String(value ?? '').match(/https?:\/\/[^\s<>"']+/i);
      if (match) return match[0].replace(/[),.;]+$/, '');
    }
    return '';
  }

  function propertyIdentity(record) {
    const folio = compact(record?.folio || record?.finca);
    const plano = compact(record?.plano);
    const rights = Array.isArray(record?.rights) ? record.rights.map(compact).filter(Boolean).sort() : [];
    const derecho = compact(record?.derecho) || rights.join(',');
    if (folio) return `${folio}|${plano}|${derecho}`;
    if (plano) return `PLANO:${plano}|${derecho}`;
    return '';
  }

  function findIdentityMatch(records, candidate) {
    const wanted = propertyIdentity(candidate);
    if (!wanted) return null;
    return (records || []).find(item => propertyIdentity(item) === wanted) || null;
  }

  function findCompatibleProperty(records, candidate) {
    const folio = compact(candidate?.folio || candidate?.finca);
    const plano = compact(candidate?.plano);
    const derecho = compact(candidate?.derecho) || (Array.isArray(candidate?.rights) ? candidate.rights.map(compact).filter(Boolean).sort().join(',') : '');
    if (!folio) return findIdentityMatch(records, candidate);
    return (records || []).find(record => {
      if (compact(record?.folio || record?.finca) !== folio) return false;
      const existingPlano = compact(record?.plano);
      const existingDerecho = compact(record?.derecho) || (Array.isArray(record?.rights) ? record.rights.map(compact).filter(Boolean).sort().join(',') : '');
      return !(existingPlano && plano && existingPlano !== plano) && !(existingDerecho && derecho && existingDerecho !== derecho);
    }) || null;
  }

  function rowsToObjects(rows) {
    const headerIndex = (rows || []).findIndex(row => {
      const headers = (row || []).map(normalizeHeader);
      return headers.some(h => ['fecha', 'numero de tramite', 'tramite', 'folio finca', 'numero de folio', 'finca', 'plano catastrado'].includes(h)) &&
        headers.filter(Boolean).length >= 2;
    });
    if (headerIndex < 0 || headerIndex >= rows.length - 1) return [];
    const heads = rows[headerIndex].map(value => String(value ?? '').trim());
    return rows.slice(headerIndex + 1).filter(row => (row || []).some(value => String(value ?? '').trim())).map(row =>
      Object.fromEntries(heads.map((head, index) => [head || `Columna ${index + 1}`, row?.[index] ?? '']))
    );
  }

  function mapRow(row) {
    const normalized = {};
    for (const [key, value] of Object.entries(row || {})) normalized[normalizeHeader(key)] = value;
    const pick = (...aliases) => {
      for (const alias of aliases) {
        const value = normalized[alias];
        if (value != null && String(value).trim() !== '') return String(value).trim();
      }
      return '';
    };
    const folio = pick('folio finca', 'numero de folio', 'folio', 'folio de finca');
    const rights = Object.entries(row || {}).filter(([key, value]) => /^id derecho(?:\s+\d+)?$/i.test(normalizeHeader(key)) && value != null && String(value).trim() && !/^https?:\/\//i.test(String(value).trim())).map(([, value]) => String(value).trim());
    return {
      tramite: pick('tramite', 'numero de tramite', 'expediente', 'numero expediente'),
      folio,
      finca: pick('finca', 'matricula', 'numero de finca') || folio,
      plano: pick('plano psim', 'plano catastrado', 'plano'),
      derecho: pick('derecho'),
      rights,
      date: parseExcelDate(pick('fecha', 'fecha inspeccion', 'fecha de inspeccion', 'fecha declaracion', 'fecha de declaracion')),
      owner: pick('nombre', 'propietario', 'propietario registral', 'nombre propietario'),
      ownerId: preserveIdentifier(pick('identificacion', 'cedula', 'id propietario')),
      sourceLink: extractLink(row),
    };
  }

  function mergeEmpty(base, incoming) {
    const result = { ...(base || {}) };
    for (const [key, value] of Object.entries(incoming || {})) {
      if (Array.isArray(value)) {
        result[key] = [...new Set([...(Array.isArray(result[key]) ? result[key] : []), ...value].filter(Boolean))];
      } else if ((result[key] == null || String(result[key]).trim() === '') && value != null && String(value).trim() !== '') result[key] = value;
    }
    return result;
  }

  function recordIdentity(record) {
    const folio = compact(record?.folio || record?.finca);
    if (folio) return `F:${folio}`;
    const tramite = compact(record?.tramite);
    const property = propertyIdentity(record);
    if (tramite) return `T:${tramite}|${property || 'NO-PROP'}`;
    return property ? `NO-T|${property}` : '';
  }

  function dedupeRows(records) {
    const result = [], byIdentity = new Map();
    let duplicates = 0;
    for (const record of records || []) {
      const key = recordIdentity(record);
      if (!key) { result.push({ ...record }); continue; }
      if (!byIdentity.has(key)) {
        const copy = { ...record };
        byIdentity.set(key, copy);
        result.push(copy);
      } else {
        const merged = mergeEmpty(byIdentity.get(key), record);
        Object.assign(byIdentity.get(key), merged);
        duplicates++;
      }
    }
    return { records: result, duplicates };
  }

  function streetLevelLabel(level) {
    const code = String(level ?? '');
    if (code === '0') return '0 — A nivel';
    if (code === '1') return '+1 — Sobre nivel';
    if (code === '-1') return '−1 — Bajo nivel';
    return '';
  }

  function streetLevelDifferenceLabel(level, difference) {
    const code = String(level ?? '');
    if (code === '0') return '0.00 m';
    if (!['1', '-1'].includes(code)) return '';
    const magnitude = Math.abs(Number(difference) || 0);
    const sign = code === '1' ? '+' : '−';
    return `${sign}${magnitude.toFixed(2)} m`;
  }

  function detectFields(text) {
    const source = String(text || '').replace(/\s+/g, ' ');
    const find = regex => source.match(regex)?.[1]?.trim() || '';
    return {
      tramite: find(/(?:tr[aá]mite|expediente)\s*[:#-]?\s*([A-Z0-9-]+)/i),
      folio: find(/(?:folio|finca)\s*[:#-]?\s*([0-9]+(?:-[0-9]+)?)/i),
      plano: find(/plano(?:\s+catastrado)?\s*[:#-]?\s*([A-Z]-?[0-9]+-[0-9]{2,4})/i),
      derecho: find(/derecho\s*[:#-]?\s*([A-Z0-9-]+)/i),
      ownerId: find(/(?:identificaci[oó]n|c[eé]dula)\s*[:#-]?\s*([0-9][0-9-]+)/i),
      owner: find(/propietari[oa](?:\s+registral)?\s*[:#-]?\s*([^,;|]+?)(?=\s+(?:fecha|folio|finca|plano|identificaci[oó]n|c[eé]dula)\b|$)/i),
      declarationDate: parseExcelDate(find(/fecha\s+(?:de\s+)?declaraci[oó]n\s*[:#-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}-\d{2}-\d{2})/i)),
      inspectionDate: parseExcelDate(find(/fecha\s+(?:de\s+)?(?:inspecci[oó]n|visita)\s*[:#-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}-\d{2}-\d{2})/i)),
      registryArea: find(/[aá]rea(?:\s+seg[uú]n\s+registro)?\s*[:#-]?\s*([0-9.,]+)/i),
      processType: find(/tipo\s+(?:de\s+)?tr[aá]mite\s*[:#-]?\s*(.+?)(?=\s+(?:provincia|cant[oó]n|distrito|lugar|localidad|poblado|tr[aá]mite|expediente|folio|finca|plano|propietari[oa]|identificaci[oó]n|c[eé]dula|fecha|[aá]rea)\b|$)/i),
      province: find(/provincia\s*[:#-]?\s*(.+?)(?=\s+(?:cant[oó]n|distrito|lugar|localidad|poblado|tr[aá]mite|expediente|folio|finca|plano|propietari[oa]|identificaci[oó]n|c[eé]dula|fecha|[aá]rea)\b|$)/i),
      canton: find(/cant[oó]n\s*[:#-]?\s*(.+?)(?=\s+(?:distrito|lugar|localidad|poblado|tr[aá]mite|expediente|folio|finca|plano|propietari[oa]|identificaci[oó]n|c[eé]dula|fecha|[aá]rea)\b|$)/i),
      district: find(/distrito\s*[:#-]?\s*(.+?)(?=\s+(?:lugar|localidad|poblado|tr[aá]mite|expediente|folio|finca|plano|propietari[oa]|identificaci[oó]n|c[eé]dula|fecha|[aá]rea)\b|$)/i),
      locality: find(/(?:lugar|localidad|poblado)\s*[:#-]?\s*(.+?)(?=\s+(?:tr[aá]mite|expediente|folio|finca|plano|propietari[oa]|identificaci[oó]n|c[eé]dula|fecha|[aá]rea)\b|$)/i),
    };
  }

  function protectReaderFields(currentTramite, detected, normalizeDistrict) {
    const fields = { ...(detected || {}) };
    const current = String(currentTramite || '').trim();
    const detectedTramite = String(fields.tramite || '').trim();
    let tramiteConflict = null;
    if (detectedTramite && current && compact(detectedTramite) !== compact(current)) {
      tramiteConflict = { current, detected: detectedTramite };
    }
    delete fields.tramite;
    let invalidDistrict = '';
    if (String(fields.district || '').trim()) {
      const raw = String(fields.district).trim();
      const normalized = typeof normalizeDistrict === 'function' ? normalizeDistrict(raw) : raw;
      if (normalized) fields.district = normalized;
      else { invalidDistrict = raw; delete fields.district; }
    }
    return { fields, tramiteConflict, invalidDistrict, detectedTramite };
  }

  function applyFields(target, detected, selected, allowOverwrite) {
    const result = { ...(target || {}) };
    for (const [key, value] of Object.entries(detected || {})) {
      if (!selected?.[key] || value == null || String(value).trim() === '') continue;
      if (!allowOverwrite && result[key] != null && String(result[key]).trim() !== '') continue;
      result[key] = value;
    }
    return result;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function placeNotesMarkup(placeName, records) {
    const cases = Array.isArray(records) ? records : [];
    const countLabel = `${cases.length} ${cases.length === 1 ? 'expediente' : 'expedientes'}`;
    const rows = cases.map(record => `<li><b>${escapeHtml(record?.tramite || 'Sin trámite')}</b> · Folio / finca: ${escapeHtml(record?.folio || 'Sin dato')}</li>`).join('');
    return `<details class="place-notes inline-accordion"><summary><span><b>Notas del poblado</b> · ${escapeHtml(placeName || 'Sin poblado')}</span><small>${countLabel}</small></summary><div class="place-notes-body"><div class="place-notes-head"><h5>Lista breve del poblado</h5><button class="btn small" type="button" data-download-place-notes>Descargar lista</button></div><ol class="place-notes-list">${rows}</ol></div></details>`;
  }

  return { compact, normalizeHeader, preserveIdentifier, parseExcelDate, extractLink, propertyIdentity, recordIdentity, findIdentityMatch, findCompatibleProperty, rowsToObjects, mapRow, dedupeRows, streetLevelLabel, streetLevelDifferenceLabel, detectFields, protectReaderFields, applyFields, placeNotesMarkup };
});
