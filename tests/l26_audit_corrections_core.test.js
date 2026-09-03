const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../app/assets/l26_integrity_core.js');

test('planifica consolidación histórica por folio y conserva casos posesorios sin folio separados',()=>{
  assert.equal(typeof core.planFolioConsolidation,'function');
  const records=[
    {id:'old',status:'Asignado',updatedAt:'2026-08-20T10:00:00Z',general:{tramite:'T-A',folio:'275480',finca:'275480',owner:'Persona A'}},
    {id:'new',status:'Finalizado',workflow:{stage:'completed'},updatedAt:'2026-08-21T10:00:00Z',general:{tramite:'T-B',folio:'275480',finca:'275480',ownerId:'0102030405'}},
    {id:'pos-1',general:{tramite:'P-1',folio:'',finca:'',informacionPosesoria:true}},
    {id:'pos-2',general:{tramite:'P-2',folio:'',finca:'',informacionPosesoria:true}},
  ];
  const plan=core.planFolioConsolidation(records);
  assert.equal(plan.groups.length,1);
  assert.equal(plan.groups[0].folio,'275480');
  assert.equal(plan.groups[0].survivorId,'new');
  assert.deepEqual(plan.groups[0].duplicateIds,['old']);
  assert.equal(plan.untouched.length,2);
});

test('combina historias y metadatos sin perder datos de dos registros del mismo folio',()=>{
  assert.equal(typeof core.mergeFolioDuplicateData,'function');
  const primary={id:'new',status:'Finalizado',workflow:{stage:'completed',history:[{at:'2026-08-21',to:'completed'}]},general:{folio:'275480',finca:'275480',owner:'',ownerId:'0102'},repositoryAudit:{items:[{id:'a2'}]},report:{rectification:{history:[{id:'r2'}]}},constructions:[{id:'c2',name:'B'}],photos:[{id:'p2'}]};
  const duplicate={id:'old',status:'Asignado',workflow:{stage:'field',history:[{at:'2026-08-20',to:'field'}]},general:{folio:'275480',finca:'275480',owner:'Persona A',ownerId:''},repositoryAudit:{items:[{id:'a1'}]},report:{rectification:{history:[{id:'r1'}]}},constructions:[{id:'c1',name:'A'}],photos:[{id:'p1'}]};
  const merged=core.mergeFolioDuplicateData(primary,duplicate);
  assert.equal(merged.id,'new');
  assert.equal(merged.general.owner,'Persona A');
  assert.equal(merged.general.ownerId,'0102');
  assert.equal(merged.workflow.stage,'completed');
  assert.equal(merged.workflow.history.length,2);
  assert.equal(merged.repositoryAudit.items.length,2);
  assert.equal(merged.report.rectification.history.length,2);
  assert.deepEqual(merged.constructions.map(x=>x.id).sort(),['c1','c2']);
  assert.deepEqual(merged.photos.map(x=>x.id).sort(),['p1','p2']);
});

test('respaldo global declara esquema y resume casos sin depender de UI',()=>{
  assert.equal(typeof core.buildGlobalBackupEnvelope,'function');
  const payload=core.buildGlobalBackupEnvelope({
    appVersion:'27.3.9',dbVersion:6,exportedAt:'2026-08-31T20:00:00Z',
    cases:[{id:'a',general:{folio:'1'}},{id:'b',general:{folio:'2'},workflow:{stage:'completed'}}],
    photos:[{id:'p',caseId:'a',blobData:'data:image/jpeg;base64,AA=='}],
    documents:[{id:'d',caseId:'b',blobData:'data:application/pdf;base64,AA=='}],
    recovery:{cases:[{recoveryId:'r1'}],photos:[],documents:[]}
  });
  assert.equal(payload.schema,'FiscalizacionBIGlobalExport');
  assert.equal(payload.counts.cases,2);
  assert.equal(payload.counts.photos,1);
  assert.equal(payload.counts.documents,1);
  assert.equal(payload.counts.recoveryCases,1);
  assert.equal(payload.attachments.photos[0].caseId,'a');
});

test('al consolidar conserva campos complementarios de una misma construcción por id',()=>{
  const primary={id:'new',general:{folio:'9'},constructions:[{id:'c1',name:'Casa',area:'',condition:'Buena'}]};
  const duplicate={id:'old',general:{folio:'9'},constructions:[{id:'c1',name:'Casa',area:'120',condition:''}]};
  const merged=core.mergeFolioDuplicateData(primary,duplicate);
  assert.equal(merged.constructions.length,1);
  assert.equal(merged.constructions[0].area,'120');
  assert.equal(merged.constructions[0].condition,'Buena');
});
