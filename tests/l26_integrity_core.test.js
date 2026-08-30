const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../app/assets/l26_integrity_core.js');

test('trámites distintos del mismo inmueble conservan identidades distintas',()=>{
  const a={general:{tramite:'2024-07370',folio:'275480',finca:'275480',plano:'H-1234567-2020',derecho:'001'}};
  const b={general:{tramite:'2025-17123',folio:'275480',finca:'275480',plano:'H-1234567-2020',derecho:'001'}};
  assert.notEqual(core.caseIdentityKey(a),core.caseIdentityKey(b));
  assert.match(core.caseIdentityKey(a),/^T:202407370\|/);
  assert.match(core.caseIdentityKey(b),/^T:202517123\|/);
});

test('mismo trámite con propiedades distintas conserva identidades distintas',()=>{
  const a={general:{tramite:'2025-17123',folio:'275480',plano:'H-1-2020',derecho:'001'}};
  const b={general:{tramite:'2025-17123',folio:'275481',plano:'H-2-2020',derecho:'001'}};
  assert.notEqual(core.caseIdentityKey(a),core.caseIdentityKey(b));
});

test('sin trámite usa identidad de propiedad separada de los trámites conocidos',()=>{
  const noTramite={general:{tramite:'',folio:'275480',plano:'H-1-2020',derecho:'001'}};
  const conTramite={general:{tramite:'2025-17123',folio:'275480',plano:'H-1-2020',derecho:'001'}};
  assert.match(core.caseIdentityKey(noTramite),/^NO-T\|/);
  assert.notEqual(core.caseIdentityKey(noTramite),core.caseIdentityKey(conTramite));
});

test('normaliza solamente distritos oficiales de Sarapiquí',()=>{
  assert.equal(core.normalizeDistrict('Horquetas'),'Las Horquetas');
  assert.equal(core.normalizeDistrict('LAS HORQUETAS'),'Las Horquetas');
  assert.equal(core.normalizeDistrict('Puerto Viejo'),'Puerto Viejo');
  assert.equal(core.normalizeDistrict('La Virgen'),'La Virgen');
  assert.equal(core.normalizeDistrict('Llanuras del Gaspar'),'Llanuras del Gaspar');
  assert.equal(core.normalizeDistrict('Cureña'),'Cureña');
  assert.equal(core.normalizeDistrict('Chilamate'),'');
});

test('auditoría detecta documento ligado a trámite distinto y distrito sospechoso',()=>{
  const cases=[
    {id:'c1',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'},visit:{district:'Chilamate'}},
    {id:'c2',general:{tramite:'',folio:'275481',plano:'H-2',derecho:'001'},visit:{district:'Puerto Viejo'}}
  ];
  const documents=[{id:'d1',caseId:'c1',expedienteNumber:'2024-07370',originalName:'2024-07370.pdf'}];
  const report=core.auditIntegrity(cases,documents);
  assert.equal(report.documentTramiteMismatches.length,1);
  assert.equal(report.invalidDistricts.length,1);
  assert.equal(report.casesWithoutTramite.length,1);
  assert.equal(report.totalIssues,4);
});

test('recordsMayMerge rechaza mismo id cuando el trámite es distinto',()=>{
  const a={id:'same',general:{tramite:'2024-07370',folio:'275480',plano:'H-1',derecho:'001'}};
  const b={id:'same',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'}};
  assert.equal(core.recordsMayMerge(a,b),false);
});

test('recordsMayMerge permite identidad transaccional exacta',()=>{
  const a={id:'a',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'}};
  const b={id:'b',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'}};
  assert.equal(core.recordsMayMerge(a,b),true);
});

test('auditoría detecta número de trámite del nombre de archivo diferente al caso',()=>{
  const cases=[{id:'c1',general:{tramite:'2024-07370',folio:'275480'},visit:{district:'Puerto Viejo'},sourceFile:'2025-17123.xlsx'}];
  const docs=[{id:'d1',caseId:'c1',expedienteNumber:'2024-07370',originalName:'2025-17123.pdf'}];
  const report=core.auditIntegrity(cases,docs);
  assert.equal(report.sourceFileTramiteMismatches.length,1);
  assert.equal(report.documentNameTramiteMismatches.length,1);
  assert.equal(report.sourceFileTramiteMismatches[0].detectedTramite,'2025-17123');
});

test('encuentra copia recuperable de un trámite que falta en la base actual',()=>{
  const current=[{id:'same',general:{tramite:'2024-07370',folio:'275480',plano:'H-1',derecho:'001'}}];
  const recovery=[
    {recoveryId:'r1',caseId:'same',recoveredAt:'2026-08-28T10:00:00Z',case:{id:'same',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'}}},
    {recoveryId:'r2',caseId:'same',recoveredAt:'2026-08-29T10:00:00Z',case:{id:'same',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'}}}
  ];
  const candidates=core.findRecoveryCandidates(current,recovery);
  assert.equal(candidates.length,1);
  assert.equal(candidates[0].tramite,'2025-17123');
  assert.equal(candidates[0].recoveryId,'r2');
  assert.equal(candidates[0].reason,'ID_COLLISION_DIFFERENT_TRANSACTION');
});

test('no propone recuperar una identidad que ya existe exactamente',()=>{
  const current=[{id:'c1',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'}}];
  const recovery=[{recoveryId:'r1',caseId:'old',recoveredAt:'2026-08-29T10:00:00Z',case:{id:'old',general:{tramite:'2025-17123',folio:'275480',plano:'H-1',derecho:'001'}}}];
  assert.equal(core.findRecoveryCandidates(current,recovery).length,0);
});

test('PDF con trámite en el nombre nunca cae a otro trámite por la misma finca',()=>{
  const cases=[
    {id:'old',general:{tramite:'2024-07370',finca:'275480',folio:'275480'}},
    {id:'right',general:{tramite:'2025-17123',finca:'999999',folio:'999999'}}
  ];
  const match=core.findDocumentCaseMatch('2025-17123_275480_RESOLUCION.pdf',cases);
  assert.equal(match.status,'matched');
  assert.equal(match.case.id,'right');
  assert.equal(match.detectedTramite,'2025-17123');
});

test('PDF con trámite inexistente no se vincula a otro trámite aunque coincida la finca',()=>{
  const cases=[{id:'wrong',general:{tramite:'2024-07370',finca:'275480',folio:'275480'}}];
  const match=core.findDocumentCaseMatch('2025-17123_275480.pdf',cases);
  assert.equal(match.status,'none');
  assert.equal(match.detectedTramite,'2025-17123');
  assert.equal(match.reason,'TRAMITE_NO_ENCONTRADO');
});

test('PDF de un trámite con varias propiedades usa finca o folio solo dentro del mismo trámite',()=>{
  const cases=[
    {id:'a',general:{tramite:'2025-17123',finca:'111111',folio:'111111'}},
    {id:'b',general:{tramite:'2025-17123',finca:'275480',folio:'275480'}},
    {id:'other',general:{tramite:'2024-07370',finca:'275480',folio:'275480'}}
  ];
  const match=core.findDocumentCaseMatch('ACTO_2025-17123_FINCA_275480.pdf',cases);
  assert.equal(match.status,'matched');
  assert.equal(match.case.id,'b');
  assert.match(match.strategy,/trámite/i);
});
