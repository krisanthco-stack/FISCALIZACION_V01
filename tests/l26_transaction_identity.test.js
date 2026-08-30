const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../app/assets/l26_excel_import_core.js');

test('misma propiedad con trámites distintos nunca se deduplica',()=>{
  const records=[
    {general:{tramite:'2024-07370',folio:'275480',finca:'275480',plano:'H-1234567-2020',derecho:'001'}},
    {general:{tramite:'2025-17123',folio:'275480',finca:'275480',plano:'H-1234567-2020',derecho:'001'}}
  ];
  assert.notEqual(core.canonicalIdentityKey(records[0]),core.canonicalIdentityKey(records[1]));
  assert.equal(core.dedupeImportedRecords(records).length,2);
});

test('repetición exacta de trámite y propiedad sí se consolida',()=>{
  const records=[
    {general:{tramite:'2025-17123',folio:'275480',plano:'H-1234567-2020',derecho:'001',propietario:'Ana'}},
    {general:{tramite:'2025-17123',folio:'275480',plano:'H-1234567-2020',derecho:'001',identificacion:'1-1111-1111'}}
  ];
  const out=core.dedupeImportedRecords(records);
  assert.equal(out.length,1);
  assert.equal(out[0].general.propietario,'Ana');
  assert.equal(out[0].general.identificacion,'1-1111-1111');
});

test('mismo trámite con propiedades distintas conserva registros distintos',()=>{
  const records=[
    {general:{tramite:'2025-17123',folio:'275480',plano:'H-1-2020',derecho:'001'}},
    {general:{tramite:'2025-17123',folio:'275481',plano:'H-2-2020',derecho:'001'}}
  ];
  assert.equal(core.dedupeImportedRecords(records).length,2);
});
