'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const vm=require('node:vm');
const core=require('../app/assets/l26_excel_import_core.js');

const enc=s=>new TextEncoder().encode(s);

function formulaWorkbookEntries(){
  const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Expedientes" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>Finca</t></is></c><c r="B1" t="inlineStr"><is><t>Enlace</t></is></c><c r="C1" t="inlineStr"><is><t>ID</t></is></c></row>
    <row r="2"><c r="A2"><v>116422</v></c><c r="B2" t="str"><f>IFERROR(HYPERLINK("https://metro.sarapiqui.go.cr/processes/15173394","Abrir expediente"),"Abrir expediente")</f><v>Abrir expediente</v></c><c r="C2" t="str"><f>IFERROR(HYPERLINK("https://metro.sarapiqui.go.cr/processes/15173394","15173394"),"15173394")</f><v>15173394</v></c></row>
  </sheetData></worksheet>`;
  return {'xl/workbook.xml':enc(workbook),'xl/_rels/workbook.xml.rels':enc(rels),'xl/worksheets/sheet1.xml':enc(sheet)};
}

test('recupera URL Metro desde formula HYPERLINK de Enlace/ID',()=>{
  const workbook=core.parseXlsxEntries(formulaWorkbookEntries());
  const imported=core.importRecordsFromWorkbook(workbook);
  assert.equal(imported.records.length,1);
  assert.equal(imported.records[0].general.sourceId,'15173394');
  assert.equal(imported.records[0].general.sourceUrl,'https://metro.sarapiqui.go.cr/processes/15173394');
});

test('P.C.F.xlsx real conserva el enlace de la Finca 116422 cuando se proporciona como fixture',()=>{
  const fixture=process.env.L26_PCF_XLSX||'/mnt/data/P.C.F.xlsx';
  if(!fs.existsSync(fixture)) return;
  const bytes=fs.readFileSync(fixture);
  const workbook=core.parseXlsx(bytes,data=>zlib.inflateRawSync(Buffer.from(data)));
  const imported=core.importRecordsFromWorkbook(workbook);
  const row=imported.records.find(r=>String(r.general?.finca)==='116422');
  assert.ok(row,'No se encontró Finca 116422 en P.C.F.xlsx');
  assert.equal(row.general.sourceId,'15173394');
  assert.equal(row.general.sourceUrl,'https://metro.sarapiqui.go.cr/processes/15173394');
});

test('PWA/web conserva fallback web directo para Abrir enlace',async()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const start=html.indexOf('function isL26DesktopShell(){');
  const end=html.indexOf('function caseFieldValue',start);
  assert.ok(start>=0&&end>start,'No se encontró el bloque de apertura de enlaces');
  const opened=[];
  const context={
    console,URLSearchParams,DEFAULT_CASE_SOURCE_URL:'https://metro.sarapiqui.go.cr/',
    navigator:{userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform:'Win32'},
    location:{href:'https://l26.local/',search:''},toast:()=>{},
    window:{open:(url)=>{opened.push(url);return{opener:{}};}}
  };
  context.window.window=context.window;
  vm.createContext(context);
  vm.runInContext(html.slice(start,end),context);
  await context.openCaseSource({id:'c1',sourceLink:'https://metro.sarapiqui.go.cr/processes/15173394',general:{tramite:'T1'}});
  assert.deepEqual(opened,['https://metro.sarapiqui.go.cr/processes/15173394']);
});
