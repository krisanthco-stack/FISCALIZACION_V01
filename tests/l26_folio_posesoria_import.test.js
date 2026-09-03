'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const excel=require('../app/assets/l26_excel_import_core.js');
const integrity=require('../app/assets/l26_integrity_core.js');
const management=require('../app/assets/l26_management_core.js');

test('Excel consolida por Folio aunque cambien trámite, plano o derecho',()=>{
  const rows=[
    {general:{tramite:'2026-100',folio:'151448-000',finca:'151448-000',plano:'H-1',derecho:'001',propietario:'Ana'}},
    {general:{tramite:'2026-101',folio:'151448000',finca:'151448000',plano:'H-2',derecho:'002',identificacion:'1-1111-1111'}},
  ];
  const out=excel.dedupeImportedRecords(rows);
  assert.equal(out.length,1);
  assert.equal(out[0].general.folio,'151448-000');
  assert.equal(out[0].general.identificacion,'1-1111-1111');
});

test('JSON encuentra existente por Folio/Finca antes de crear otro trámite',()=>{
  const cases=[
    {id:'a',general:{tramite:'2025-1',folio:'275480',finca:'275480',plano:'H-1',right:'001'}},
    {id:'b',general:{tramite:'2025-2',folio:'999999',finca:'999999',plano:'H-2',right:'001'}},
  ];
  const incoming={id:'nuevo',general:{tramite:'2026-8',folio:'275-480',finca:'',plano:'H-OTRO',right:'002'}};
  assert.equal(integrity.findImportMatchByFolio(cases,incoming)?.id,'a');
});

test('conteo de trámites usa Folio/Finca único y posesoria sin Folio cuenta individualmente',()=>{
  const cases=[
    {id:'a',general:{folio:'275480'},management:{inspectionCompleted:false}},
    {id:'b',general:{folio:'275-480'},management:{inspectionCompleted:false}},
    {id:'c',general:{finca:'999999'},management:{inspectionCompleted:true}},
    {id:'p1',general:{folio:'',finca:'',informacionPosesoria:true},management:{inspectionCompleted:false}},
    {id:'p2',general:{folio:'',finca:'',informacionPosesoria:true},management:{inspectionCompleted:false}},
  ];
  assert.equal(integrity.uniqueFolioCount(cases),4);
  assert.deepEqual(management.summaryCounts(cases,r=>Boolean(r.management?.inspectionCompleted)),{total:4,management:1,active:3});
});

test('un Folio trasladado a Gestión no se vuelve a contar como activo por un duplicado histórico',()=>{
  const cases=[
    {id:'activo-antiguo',general:{folio:'777-001'},management:{inspectionCompleted:false}},
    {id:'gestion',general:{folio:'777001'},management:{inspectionCompleted:true}},
  ];
  assert.deepEqual(management.summaryCounts(cases,r=>Boolean(r.management?.inspectionCompleted)),{total:1,management:1,active:0});
});
