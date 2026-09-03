const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rules = require('../app/assets/import_rules.js');

test('normaliza la identidad por folio, plano y derecho', () => {
  assert.equal(rules.propertyIdentity({ folio: '151448-000', plano: 'H-0324656-1996', derecho: '001' }), '151448000|H03246561996|001');
  assert.notEqual(
    rules.propertyIdentity({ folio: '151448-000', plano: 'H-0324656-1996', derecho: '001' }),
    rules.propertyIdentity({ folio: '151448-000', plano: 'H-9999999-2026', derecho: '001' })
  );
  assert.notEqual(
    rules.propertyIdentity({ folio: '151448-000', plano: 'H-0324656-1996', derecho: '001' }),
    rules.propertyIdentity({ folio: '151448-000', plano: 'H-0324656-1996', derecho: '002' })
  );
});

test('extrae enlace desde cualquier columna', () => {
  assert.equal(
    rules.extractLink({ 'ID DERECHO 001': 'https://metro.sarapiqui.go.cr/documento/15', Observaciones: 'Revisar' }),
    'https://metro.sarapiqui.go.cr/documento/15'
  );
});

test('convierte fechas seriales de Excel y conserva identificaciones textuales', () => {
  assert.equal(rules.parseExcelDate(46021), '2025-12-30');
  assert.equal(rules.preserveIdentifier('01-1114-0693'), '01-1114-0693');
  assert.equal(rules.preserveIdentifier(401430225), '401430225');
});

test('clasifica repetición exacta y diferencias de plano o derecho', () => {
  const existing = [
    { id: 'a', folio: '151448-000', plano: 'H-0324656-1996', derecho: '001' },
  ];
  assert.equal(rules.findIdentityMatch(existing, { folio: '151448000', plano: 'H03246561996', derecho: '001' }).id, 'a');
  assert.equal(rules.findIdentityMatch(existing, { folio: '151448-000', plano: 'H-9999999-2026', derecho: '001' }), null);
  assert.equal(rules.findIdentityMatch(existing, { folio: '151448-000', plano: 'H-0324656-1996', derecho: '002' }), null);
});

test('detecta campos y aplica solo valores vacíos salvo confirmación', () => {
  const detected = rules.detectFields('Folio 151448-000 Plano H-0324656-1996 Identificación 01-1114-0693 Propietario: Ana Pérez Fecha: 30/12/2025');
  assert.equal(detected.folio, '151448-000');
  assert.equal(detected.plano, 'H-0324656-1996');
  assert.equal(detected.ownerId, '01-1114-0693');
  const target = { folio: 'YA-EXISTE', plano: '', ownerId: '' };
  assert.deepEqual(rules.applyFields(target, detected, { folio: true, plano: true, ownerId: true }, false), {
    folio: 'YA-EXISTE', plano: 'H-0324656-1996', ownerId: '01-1114-0693'
  });
});

test('encuentra encabezados después de títulos y mapea Libro2', () => {
  const rows = [
    ['TRÁMITES 2025 CONSOLIDADOS'],
    ['Descripción'],
    [],
    ['FECHA', 'TRÁMITE', 'FOLIO / FINCA', 'DERECHO', 'NOMBRE', 'IDENTIFICACIÓN', 'PLANO PSIM', 'ID DERECHO 001'],
    [46021, '2025-23088', '151448-000', '001', 'Ana Pérez', '01-1114-0693', 'H-0324656-1996', '15713814'],
  ];
  const objects = rules.rowsToObjects(rows);
  assert.equal(objects.length, 1);
  assert.deepEqual(rules.mapRow(objects[0]), {
    tramite: '2025-23088', folio: '151448-000', finca: '151448-000', plano: 'H-0324656-1996',
    derecho: '001', rights: ['15713814'], date: '2025-12-30', owner: 'Ana Pérez',
    ownerId: '01-1114-0693', sourceLink: ''
  });
});

test('consolida todas las filas del mismo Folio aunque cambie el plano', () => {
  const rows = [
    { folio: '151448-000', plano: 'H-0324656-1996', derecho: '001', owner: 'Ana' },
    { folio: '151448000', plano: 'H03246561996', derecho: '001', ownerId: '01-1114-0693' },
    { folio: '151448-000', plano: 'H-9999999-2026', derecho: '001', owner: 'Otra' },
  ];
  const result = rules.dedupeRows(rows);
  assert.equal(result.records.length, 1);
  assert.equal(result.duplicates, 2);
  assert.equal(result.records[0].owner, 'Ana');
  assert.equal(result.records[0].ownerId, '01-1114-0693');
});

test('un folio existente sin plano o derecho no absorbe otra combinación', () => {
  const existing = [{ id: 'a', folio: '151448-000', plano: '', derecho: '' }];
  assert.equal(rules.findIdentityMatch(existing, {
    folio: '151448-000', plano: 'H-0324656-1996', derecho: '001'
  }), null);
});

test('407 filas con 47 folios se consolidan a 47 trámites por Folio', () => {
  const rows = Array.from({ length: 407 }, (_, index) => ({
    folio: String(100000 + (index % 47)),
    plano: `H-${String(2000000 + index)}-2026`,
    derecho: String((index % 3) + 1).padStart(3, '0'),
  }));
  const result = rules.dedupeRows(rows);
  assert.equal(result.records.length, 47);
  assert.equal(result.duplicates, 360);
});

test('nombra el nivel respecto de la vía y firma la diferencia observada', () => {
  assert.equal(rules.streetLevelLabel('0'), '0 — A nivel');
  assert.equal(rules.streetLevelDifferenceLabel('0', 8), '0.00 m');
  assert.equal(rules.streetLevelLabel('1'), '+1 — Sobre nivel');
  assert.equal(rules.streetLevelDifferenceLabel('1', 1.25), '+1.25 m');
  assert.equal(rules.streetLevelLabel('-1'), '−1 — Bajo nivel');
  assert.equal(rules.streetLevelDifferenceLabel('-1', 1.25), '−1.25 m');
});

test('las notas del poblado se presentan como acordeón cerrado', () => {
  const html = rules.placeNotesMarkup('La Guaria', [
    { tramite: '2024-07370', folio: '275480' },
    { tramite: '', folio: '' },
  ]);
  assert.match(html, /^<details class="place-notes/);
  assert.doesNotMatch(html, /^<details[^>]*\sopen(?:\s|>)/);
  assert.match(html, /<summary[^>]*>.*Notas del poblado.*2 expedientes.*<\/summary>/);
  assert.match(html, /Descargar lista/);
  assert.match(html, /2024-07370/);
});

test('el expediente abierto muestra el enlace importado y permite abrirlo', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /id="caseSourceLink"/);
  assert.match(html, /id="openCaseSourceBtn"/);
});

test('detectFields reconoce ubicación administrativa y tipo de trámite en texto PDF',()=>{
  const detected=rules.detectFields('Tipo de trámite: Fiscalización Provincia: Heredia Cantón: Sarapiquí Distrito: Puerto Viejo Lugar: La Virgen');
  assert.equal(detected.processType,'Fiscalización');
  assert.equal(detected.province,'Heredia');
  assert.equal(detected.canton,'Sarapiquí');
  assert.equal(detected.district,'Puerto Viejo');
  assert.equal(detected.locality,'La Virgen');
});

test('protege trámite y valida distrito antes de aplicar lectura automática',()=>{
  const integrity=require('../app/assets/l26_integrity_core.js');
  const result=rules.protectReaderFields('2025-17123',{
    tramite:'2024-07370',district:'Horquetas',locality:'Chilamate',owner:'Ana Pérez'
  },integrity.normalizeDistrict);
  assert.equal(result.fields.tramite,undefined);
  assert.equal(result.fields.district,'Las Horquetas');
  assert.equal(result.fields.locality,'Chilamate');
  assert.equal(result.fields.owner,'Ana Pérez');
  assert.deepEqual(result.tramiteConflict,{current:'2025-17123',detected:'2024-07370'});
});

test('distrito no oficial se excluye de la actualización automática',()=>{
  const integrity=require('../app/assets/l26_integrity_core.js');
  const result=rules.protectReaderFields('2025-17123',{district:'Chilamate'},integrity.normalizeDistrict);
  assert.equal(result.fields.district,undefined);
  assert.equal(result.invalidDistrict,'Chilamate');
});

test('dedupeRows consolida trámites distintos cuando comparten el mismo Folio',()=>{
  const result=rules.dedupeRows([
    {tramite:'2024-07370',folio:'275480',plano:'H-1-2020',derecho:'001'},
    {tramite:'2025-17123',folio:'275480',plano:'H-1-2020',derecho:'001'}
  ]);
  assert.equal(result.records.length,1);
  assert.equal(result.duplicates,1);
});

test('lector separa fecha de declaración y fecha de inspección y no aplica fecha genérica',()=>{
  const explicit=rules.detectFields('Fecha de declaración: 01/02/2025 Fecha de inspección: 03/04/2026');
  assert.equal(explicit.declarationDate,'2025-02-01');
  assert.equal(explicit.inspectionDate,'2026-04-03');
  const generic=rules.detectFields('Fecha: 30/12/2025');
  assert.equal(generic.declarationDate,'');
  assert.equal(generic.inspectionDate,'');
  assert.equal(generic.date,undefined);
});
