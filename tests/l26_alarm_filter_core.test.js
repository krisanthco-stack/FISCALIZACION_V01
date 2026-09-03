'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../app/assets/l26_filter_core.js');

test('filterByAlarm conserva todos los casos cuando el filtro está apagado',()=>{
  const cases=[{id:1},{id:2},{id:3}];
  const result=core.filterByAlarm(cases,false,item=>item.id===2);
  assert.deepEqual(result.map(x=>x.id),[1,2,3]);
  assert.notEqual(result,cases);
});

test('filterByAlarm muestra solo trámites con alarma cuando está activo',()=>{
  const cases=[{id:1},{id:2},{id:3}];
  const result=core.filterByAlarm(cases,true,item=>item.id!==2);
  assert.deepEqual(result.map(x=>x.id),[1,3]);
});
