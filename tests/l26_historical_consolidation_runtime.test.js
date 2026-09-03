const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const core=require('../app/assets/l26_integrity_core.js');

function extractFunction(source,signature){
  const start=source.indexOf(signature); if(start<0)throw new Error(`Missing ${signature}`);
  const open=source.indexOf('{',start); let depth=0,quote=null,escape=false;
  for(let i=open;i<source.length;i++){
    const c=source[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated function');
}

test('la función real de arranque elimina duplicado físico y remapea adjuntos',async()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const fn=extractFunction(html,'async function consolidateHistoricalFolioDuplicates()');
  const stores={
    cases:new Map([
      ['old',{id:'old',status:'Asignado',updatedAt:'2026-08-20T10:00:00Z',general:{tramite:'T-A',folio:'275480',finca:'275480',owner:'Persona A'},workflow:{stage:'field',history:[]}}],
      ['new',{id:'new',status:'Finalizado',updatedAt:'2026-08-21T10:00:00Z',general:{tramite:'T-B',folio:'275480',finca:'275480',ownerId:'0102'},workflow:{stage:'completed',history:[]}}]
    ]),
    photos:new Map([['p1',{id:'p1',caseId:'old'}]]),
    documents:new Map([['d1',{id:'d1',caseId:'old',sha256:'abc'}]]),
    recoveryCases:new Map(),recoveryPhotos:new Map(),recoveryDocuments:new Map()
  };
  const ctx={
    L26IntegrityCore:core,STORE_CASES:'cases',STORE_PHOTOS:'photos',STORE_DOCUMENTS:'documents',STORE_RECOVERY_CASES:'recoveryCases',STORE_RECOVERY_PHOTOS:'recoveryPhotos',STORE_RECOVERY_DOCUMENTS:'recoveryDocuments',APP_VERSION:'27.3.9',structuredClone,console,
    normalizeCase:x=>structuredClone(x),
    async idbAll(store){return [...stores[store].values()].map(x=>structuredClone(x))},
    async idbPut(store,val){const key=store.startsWith('recovery')?val.recoveryId:val.id;stores[store].set(key,structuredClone(val))},
    async idbDelete(store,key){stores[store].delete(key)},
    async documentsForCase(caseId){return [...stores.documents.values()].filter(x=>x.caseId===caseId).map(x=>structuredClone(x))},
    async relinkCaseDocuments(){},
    async backupCaseToRecovery(record,reason){stores.recoveryCases.set(`r-${record.id}`,{recoveryId:`r-${record.id}`,caseId:record.id,reason,case:structuredClone(record)})},
  };
  vm.createContext(ctx);vm.runInContext(fn,ctx);
  const result=await ctx.consolidateHistoricalFolioDuplicates();
  assert.equal(result.removed,1);
  assert.equal(stores.cases.size,1);
  assert.ok(stores.cases.has('new'));
  assert.equal(stores.cases.get('new').general.owner,'Persona A');
  assert.equal(stores.photos.get('p1').caseId,'new');
  assert.equal(stores.documents.get('d1').caseId,'new');
  assert.equal(stores.recoveryCases.size,2);
});
