'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const vm=require('node:vm');
const excelCore=require('../app/assets/l26_excel_import_core.js');

function extractFunction(html,name){
  const marker=`function ${name}(`;
  const start=html.indexOf(marker);
  assert.ok(start>=0,`No se encontró ${name}`);
  let brace=html.indexOf('{',start),depth=0,end=-1;
  for(let i=brace;i<html.length;i++){
    if(html[i]==='{')depth++;
    else if(html[i]==='}'){
      depth--;
      if(depth===0){end=i+1;break;}
    }
  }
  assert.ok(end>start,`No se pudo extraer ${name}`);
  return html.slice(start,end);
}

test('P.C.F(1).xlsx puede refrescar el contador de alarmas sin error de Date',()=>{
  const fixture=process.env.L26_PCF_XLSX_1||'/mnt/data/P.C.F(1).xlsx';
  if(!fs.existsSync(fixture)) return;

  const bytes=fs.readFileSync(fixture);
  const workbook=excelCore.parseXlsx(bytes,data=>zlib.inflateRawSync(Buffer.from(data)));
  const imported=excelCore.importRecordsFromWorkbook(workbook);
  assert.ok(imported.records.length>0,'P.C.F(1).xlsx no produjo expedientes');

  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const context={
    console,
    Date,
    L26FilterCore:{
      yearEntries:()=>[],
      filterByYear:cases=>cases,
    },
    baseLocalFilterState:{query:'',year:'',district:'',place:'',agroOnly:false,alarmOnly:false},
    setBaseLocalSelectOptions:(_el,_entries,_label,current)=>current||'',
    baseLocalDistrictEntries:()=>[],
    baseLocalPlaceEntries:()=>[],
    isAgroObservationCase:()=>false,
    isCaseClosed:()=>false,
    $:()=>null,
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(html,'caseChronologyDate'),context);
  vm.runInContext(extractFunction(html,'caseNeedsAgeAlarm'),context);
  vm.runInContext(extractFunction(html,'refreshBaseLocalFilterControls'),context);

  const cases=imported.records.map(r=>({
    importedDate:r.general?.fechaDeclaracion||'',
    general:{declarationDate:r.general?.fechaDeclaracion||''},
    visit:{date:r.general?.fechaDeclaracion||''},
    status:'Asignado'
  }));
  assert.ok(cases.some(c=>c.importedDate),'El fixture no contiene fechas para probar alarmas');
  assert.doesNotThrow(()=>context.refreshBaseLocalFilterControls(cases));
});
