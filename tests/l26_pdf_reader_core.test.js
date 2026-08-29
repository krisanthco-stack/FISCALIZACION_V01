'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const reader=require('../app/assets/l26_pdf_reader.js');

test('rectsIntersect detecta solapamiento y descarta rectángulos separados',()=>{
  assert.equal(reader.rectsIntersect({x:10,y:10,width:30,height:20},{x:20,y:15,width:10,height:8}),true);
  assert.equal(reader.rectsIntersect({x:10,y:10,width:30,height:20},{x:50,y:50,width:10,height:8}),false);
});

test('textFromItemsInRect ordena texto por línea y posición horizontal',()=>{
  const items=[
    {str:'123456',x:78,y:42,width:45,height:12},
    {str:'Finca:',x:12,y:42,width:52,height:12},
    {str:'Plano:',x:12,y:70,width:45,height:12},
    {str:'H-999-2026',x:70,y:70,width:80,height:12},
    {str:'Fuera',x:300,y:300,width:50,height:12},
  ];
  assert.equal(reader.textFromItemsInRect(items,{x:0,y:30,width:180,height:70}),'Finca: 123456\nPlano: H-999-2026');
});

test('extractTextFromPdf recorre todas las páginas y conserva saltos entre páginas',async()=>{
  const fakePdf={
    numPages:3,
    async getPage(pageNo){
      return {async getTextContent(){return {items: pageNo===1?[{str:'Trámite: 2026-001'},{str:'Finca: 123456'}]:pageNo===2?[{str:'Plano: H-999-2026'},{str:'Distrito: Puerto Viejo'}]:[{str:'Propietario: ANA PEREZ'}]}}};
    }
  };
  const result=await reader.extractTextFromPdf(fakePdf);
  assert.equal(result.pagesRead,3);
  assert.match(result.text,/Trámite: 2026-001 Finca: 123456/);
  assert.match(result.text,/Plano: H-999-2026 Distrito: Puerto Viejo/);
  assert.match(result.text,/Propietario: ANA PEREZ/);
});

test('extractTextFromPdf informa PDF sin texto digital',async()=>{
  const fakePdf={numPages:2,async getPage(){return {async getTextContent(){return {items:[]}}}}};
  const result=await reader.extractTextFromPdf(fakePdf);
  assert.equal(result.pagesRead,2);
  assert.equal(result.text,'');
  assert.equal(result.hasText,false);
});
