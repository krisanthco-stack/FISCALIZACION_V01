'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

const management=require('../app/assets/l26_management_core.js');
const territory=require('../app/assets/l26_territory_core.js');

function c(overrides={}){
  return {management:{notified:false,notifiedAt:'',registered:false,registeredAt:''},visit:{district:'',locality:''},...overrides};
}

test('management supports independent notified and registered states',()=>{
  assert.deepEqual(management.actionState(c({management:{notified:true,notifiedAt:'2026-01-01',registered:true,registeredAt:'2026-02-01'}})),{notified:true,registered:true});
});

test('management color priority is blue for action, red for >1 year without action, yellow otherwise',()=>{
  assert.equal(management.colorClass(c({management:{notified:true}}),true),'management-action-blue');
  assert.equal(management.colorClass(c(),true),'management-action-red');
  assert.equal(management.colorClass(c(),false),'management-action-yellow');
});

test('management filters notified and registered independently',()=>{
  const rows=[c({id:'a',management:{notified:true}}),c({id:'b',management:{registered:true}}),c({id:'c'})];
  assert.deepEqual(management.filterByActions(rows,{notified:'yes',registered:''}).map(x=>x.id),['a']);
  assert.deepEqual(management.filterByActions(rows,{notified:'',registered:'yes'}).map(x=>x.id),['b']);
  assert.deepEqual(management.filterByActions(rows,{notified:'no',registered:'no'}).map(x=>x.id),['c']);
});

test('districts render sentence case and compare regardless case/articles',()=>{
  assert.equal(territory.formatDistrict('LAS HORQUETAS'),'Las horquetas');
  assert.equal(territory.sameGeoName('Horquetas','LAS HORQUETAS'),true);
});

test('places render title case and compare articles as equivalent',()=>{
  assert.equal(territory.formatPlace('las palmitas'),'Las Palmitas');
  assert.equal(territory.sameGeoName('PALMITAS','Las Palmitas'),true);
  assert.equal(territory.sameGeoName('chilamate','CHILAMATE'),true);
});

test('empty district is inferred only when same place has one district',()=>{
  const rows=[
    c({id:'a',visit:{district:'',locality:'CHILAMATE'}}),
    c({id:'b',visit:{district:'Puerto viejo',locality:'Chilamate'}}),
    c({id:'c',visit:{district:'PUERTO VIEJO',locality:'chilamate'}}),
  ];
  const result=territory.inferMissingDistricts(rows);
  assert.equal(result.cases[0].visit.district,'Puerto viejo');
  assert.equal(result.inferred.length,1);
});

test('ambiguous same place does not infer a district',()=>{
  const rows=[
    c({id:'a',visit:{district:'',locality:'San Isidro'}}),
    c({id:'b',visit:{district:'Puerto viejo',locality:'San Isidro'}}),
    c({id:'c',visit:{district:'La virgen',locality:'San Isidro'}}),
  ];
  const result=territory.inferMissingDistricts(rows);
  assert.equal(result.cases[0].visit.district,'');
  assert.equal(result.conflicts.length,1);
});

test('active count is total minus cases transferred to management',()=>{
  assert.equal(management.activeCount(120,35),85);
  assert.equal(management.activeCount(10,12),0);
});

test('invalid district evidence is not propagated into empty cases',()=>{
  const rows=[
    c({id:'a',visit:{district:'',locality:'Chilamate'}}),
    c({id:'b',visit:{district:'Chilamate',locality:'Chilamate'}}),
  ];
  const normalizeDistrict=value=>({
    'puerto viejo':'Puerto viejo',
    'la virgen':'La virgen',
    'las horquetas':'Las horquetas',
    'llanuras del gaspar':'Llanuras del gaspar',
    'cureña':'Cureña',
  }[territory.baseKey(value)]||'');
  const result=territory.inferMissingDistricts(rows,normalizeDistrict);
  assert.equal(result.cases[0].visit.district,'');
  assert.equal(result.inferred.length,0);
});

test('summary counts use total cases and subtract management cases from active',()=>{
  const cases=Array.from({length:577},(_,i)=>({id:String(i),management:{inspectionCompleted:i<6}}));
  const counts=management.summaryCounts(cases,record=>Boolean(record.management?.inspectionCompleted));
  assert.deepEqual(counts,{total:577,management:6,active:571});
});

test('management overdue age ignores workflow completed stage and depends only on chronology date',()=>{
  assert.equal(management.isOlderThanYear('2024-08-29',new Date('2026-08-30T12:00:00')),true);
  assert.equal(management.isOlderThanYear('2026-02-01',new Date('2026-08-30T12:00:00')),false);
});
