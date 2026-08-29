'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../app/assets/l26_filter_core.js');

test('caseTramiteYear obtiene el año del número de trámite',()=>{
  assert.equal(core.caseTramiteYear({general:{tramite:'2026-23088'}}),'2026');
  assert.equal(core.caseTramiteYear({general:{tramite:'TR-2025-07370'}}),'2025');
  assert.equal(core.caseTramiteYear({general:{tramite:'T-1'}}),'Sin año');
  assert.equal(core.caseTramiteYear({general:{tramite:''}}),'Sin año');
});

test('yearEntries ordena años recientes primero y conserva Sin año',()=>{
  const cases=[
    {general:{tramite:'2024-1'}},
    {general:{tramite:'2026-2'}},
    {general:{tramite:'T-3'}},
    {general:{tramite:'2025-4'}},
    {general:{tramite:'2026-5'}},
  ];
  assert.deepEqual(core.yearEntries(cases),[
    {key:'2026',label:'2026'},
    {key:'2025',label:'2025'},
    {key:'2024',label:'2024'},
    {key:'Sin año',label:'Sin año'},
  ]);
});

test('filterByYear limita los casos al año de trámite seleccionado',()=>{
  const cases=[{id:1,general:{tramite:'2026-1'}},{id:2,general:{tramite:'2025-2'}},{id:3,general:{tramite:'T-3'}}];
  assert.deepEqual(core.filterByYear(cases,'2026').map(x=>x.id),[1]);
  assert.deepEqual(core.filterByYear(cases,'Sin año').map(x=>x.id),[3]);
  assert.equal(core.filterByYear(cases,'').length,3);
});
