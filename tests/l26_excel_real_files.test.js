'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const zlib=require('node:zlib');
const path=require('node:path');
const core=require('../app/assets/l26_excel_import_core.js');
const DATA='/mnt/data';
function parseFile(name){
  const bytes=fs.readFileSync(path.join(DATA,name));
  const workbook=core.parseXlsx(bytes,data=>zlib.inflateRawSync(Buffer.from(data)));
  const imported=core.importRecordsFromWorkbook(workbook);
  const deduped=core.dedupeImportedRecords(imported.records);
  const links=imported.records.filter(r=>/^https?:\/\//i.test(String(r.general?.sourceUrl||''))).length;
  return{...imported,deduped,links};
}
test('Plantilla V2 reconoce todos los expedientes independientemente del orden',()=>{
  const r=parseFile('Plantilla_Importacion_Expedientes_V2.xlsx');
  assert.equal(r.records.length,477);assert.equal(r.deduped.length,477);assert.equal(r.layout.headerRowIndex,0);
});
test('L-L-P reconoce expedientes e hipervínculos del ID',()=>{
  const r=parseFile('L-L-P..xlsx');
  assert.equal(r.records.length,481);assert.equal(r.deduped.length,463);assert.equal(r.links,438);
});
test('PF por fecha detecta hoja y encabezado fuera de fila 1',()=>{
  const r=parseFile('PF- POR FECHA_.xlsx');
  assert.equal(r.layout.sheetName,'DECLARACIONES A FISCALIZAR');assert.equal(r.layout.headerRowIndex,1);
  assert.equal(r.records.length,475);assert.equal(r.deduped.length,464);
});
test('407 filas con mismo trámite no se colapsan si cambia inmueble/plano/derecho',()=>{
  const records=Array.from({length:407},(_,i)=>({general:{tramite:'T-1',folio:`F-${i+1}`,finca:`F-${i+1}`,plano:`P-${i+1}`,derecho:String((i%3)+1)}}));
  assert.equal(core.dedupeImportedRecords(records).length,407);
});
