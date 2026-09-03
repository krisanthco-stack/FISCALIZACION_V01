const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const core=require('../app/assets/l26_integrity_core.js');
function extractFunction(source,signature){const start=source.indexOf(signature);if(start<0)throw new Error(`Missing ${signature}`);const open=source.indexOf('{',start);let depth=0,quote=null,escape=false;for(let i=open;i<source.length;i++){const c=source[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1)}throw new Error('unterminated')}

test('las funciones reales exportan y restauran respaldo JSON global con blobs',async()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const signatures=['async function serializeAttachmentForJson(record)','async function serializeRecoveryPhotoForJson(record)','async function serializeRecoveryDocumentForJson(record)','async function buildGlobalJsonBackup()','async function restoreGlobalBackupAttachments(attachments,idMap)','async function restoreGlobalBackupRecovery(recovery,idMap=new Map())'];
 const code=signatures.map(sig=>extractFunction(html,sig)).join('\n');
 const stores={cases:new Map([['a',{id:'a',general:{folio:'1'}}],['b',{id:'b',general:{folio:'2'},status:'Finalizado',workflow:{stage:'completed'}}]]),photos:new Map([['p',{id:'p',caseId:'a',blob:new Blob([Uint8Array.of(1,2,3)],{type:'image/jpeg'})}]]),documents:new Map([['d',{id:'d',caseId:'b',sha256:'sha',blob:new Blob([Uint8Array.of(4,5)],{type:'application/pdf'})}]]),recoveryCases:new Map([['r',{recoveryId:'r',caseId:'a',case:{id:'a'}}]]),recoveryPhotos:new Map([['rp',{recoveryId:'rp',caseId:'a',photo:{id:'oldp',caseId:'a',blob:new Blob([Uint8Array.of(6)],{type:'image/jpeg'})}}]]),recoveryDocuments:new Map([['rd',{recoveryId:'rd',caseId:'b',document:{id:'oldd',caseId:'b',blob:new Blob([Uint8Array.of(7)],{type:'application/pdf'})}}]])};
 let uidn=0;
 const ctx={L26IntegrityCore:core,APP_VERSION:'27.3.9',DB_VERSION:6,DB_NAME:'LibretaValoracionCR',storageMode:'indexeddb',STORE_CASES:'cases',STORE_PHOTOS:'photos',STORE_DOCUMENTS:'documents',STORE_RECOVERY_CASES:'recoveryCases',STORE_RECOVERY_PHOTOS:'recoveryPhotos',STORE_RECOVERY_DOCUMENTS:'recoveryDocuments',Blob,fetch,structuredClone,console,uid:()=>`u${++uidn}`,normalizeCase:x=>structuredClone(x),
  async blobToDataUrl(blob){const bytes=Buffer.from(await blob.arrayBuffer());return `data:${blob.type||'application/octet-stream'};base64,${bytes.toString('base64')}`},
  async idbAll(store){return [...stores[store].values()].map(x=>structuredClone(x))},
  async idbGet(store,key){const v=stores[store].get(key);return v?structuredClone(v):undefined},
  async idbPut(store,val){const key=store.startsWith('recovery')?val.recoveryId:val.id;stores[store].set(key,structuredClone(val))},
  async documentsForCase(caseId){return [...stores.documents.values()].filter(x=>x.caseId===caseId).map(x=>structuredClone(x))},
 };
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const payload=await ctx.buildGlobalJsonBackup();
 assert.equal(payload.schema,'FiscalizacionBIGlobalExport');
 assert.equal(payload.counts.cases,2);assert.equal(payload.counts.photos,1);assert.equal(payload.counts.documents,1);assert.equal(payload.counts.recoveryPhotos,1);
 assert.match(payload.attachments.photos[0].blobData,/^data:image\/jpeg;base64,/);
 assert.match(payload.attachments.documents[0].blobData,/^data:application\/pdf;base64,/);
 assert.match(payload.recovery.photos[0].photo.blobData,/^data:image\/jpeg;base64,/);
 stores.photos.clear();stores.documents.clear();stores.recoveryCases.clear();stores.recoveryPhotos.clear();stores.recoveryDocuments.clear();
 const restored=await ctx.restoreGlobalBackupAttachments(payload.attachments,new Map([['a','a'],['b','b']]));
 const rec=await ctx.restoreGlobalBackupRecovery(payload.recovery);
 assert.equal(restored.photos,1);assert.equal(restored.documents,1);assert.equal(rec.cases,1);assert.equal(rec.photos,1);assert.equal(rec.documents,1);
 assert.equal(stores.photos.get('p').caseId,'a');assert.equal(stores.documents.get('d').caseId,'b');
 assert.equal(Buffer.from(await stores.photos.get('p').blob.arrayBuffer()).toString('hex'),'010203');
 assert.equal(Buffer.from(await stores.documents.get('d').blob.arrayBuffer()).toString('hex'),'0405');
});

test('la restauracion global no sobreescribe IDs locales y remapea recuperacion al caso consolidado',async()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const signatures=['async function restoreGlobalBackupAttachments(attachments,idMap)','async function restoreGlobalBackupRecovery(recovery,idMap=new Map())'];
 const code=signatures.map(sig=>extractFunction(html,sig)).join('\n');
 const stores={
  cases:new Map([['local',{id:'local',general:{folio:'LOCAL'}}],['target',{id:'target',general:{folio:'275480'}}]]),
  photos:new Map([['p-collision',{id:'p-collision',caseId:'local',note:'LOCAL-PHOTO',blob:new Blob([Uint8Array.of(9)],{type:'image/jpeg'})}]]),
  documents:new Map([['d-collision',{id:'d-collision',caseId:'local',sha256:'local-sha',originalName:'local.pdf',blob:new Blob([Uint8Array.of(8)],{type:'application/pdf'})}]]),
  recoveryCases:new Map([['r-collision',{recoveryId:'r-collision',caseId:'local',snapshotId:'local-snapshot',case:{id:'local',general:{folio:'LOCAL'}}}]]),
  recoveryPhotos:new Map(),recoveryDocuments:new Map()
 };
 let uidn=0;
 const ctx={STORE_CASES:'cases',STORE_PHOTOS:'photos',STORE_DOCUMENTS:'documents',STORE_RECOVERY_CASES:'recoveryCases',STORE_RECOVERY_PHOTOS:'recoveryPhotos',STORE_RECOVERY_DOCUMENTS:'recoveryDocuments',Blob,fetch,structuredClone,console,uid:()=>`new-${++uidn}`,
  async idbAll(store){return [...stores[store].values()].map(x=>structuredClone(x))},
  async idbGet(store,key){const v=stores[store].get(key);return v?structuredClone(v):undefined},
  async idbPut(store,val){const key=store.startsWith('recovery')?val.recoveryId:val.id;stores[store].set(key,structuredClone(val))},
  async documentsForCase(caseId){return [...stores.documents.values()].filter(x=>x.caseId===caseId).map(x=>structuredClone(x))},
 };
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const attachments={
  photos:[{id:'p-collision',caseId:'old-source',note:'IMPORTED-PHOTO',blobData:'data:image/jpeg;base64,AQID'}],
  documents:[{id:'d-collision',caseId:'old-source',sha256:'import-sha',originalName:'import.pdf',blobData:'data:application/pdf;base64,BAU='}]
 };
 const restored=await ctx.restoreGlobalBackupAttachments(attachments,new Map([['old-source','target']]));
 assert.equal(restored.photos,1);assert.equal(restored.documents,1);
 assert.equal(stores.photos.get('p-collision').caseId,'local','la foto local con ID colisionado debe conservarse');
 assert.equal(stores.photos.get('p-collision').note,'LOCAL-PHOTO');
 const importedPhoto=[...stores.photos.values()].find(x=>x.caseId==='target');
 assert.ok(importedPhoto);assert.notEqual(importedPhoto.id,'p-collision');assert.equal(importedPhoto.note,'IMPORTED-PHOTO');
 assert.equal(stores.documents.get('d-collision').caseId,'local','el documento local con ID colisionado debe conservarse');
 const importedDoc=[...stores.documents.values()].find(x=>x.caseId==='target');
 assert.ok(importedDoc);assert.notEqual(importedDoc.id,'d-collision');assert.equal(importedDoc.sha256,'import-sha');

 const recovery={cases:[{recoveryId:'r-collision',snapshotId:'remote-snapshot',caseId:'old-source',case:{id:'old-source',general:{folio:'275480'}}}],photos:[],documents:[]};
 const rec=await ctx.restoreGlobalBackupRecovery(recovery,new Map([['old-source','target']]));
 assert.equal(rec.cases,1);
 assert.equal(stores.recoveryCases.get('r-collision').caseId,'local','el respaldo local con recoveryId colisionado debe conservarse');
 const importedRec=[...stores.recoveryCases.values()].find(x=>x.snapshotId==='remote-snapshot');
 assert.ok(importedRec);assert.notEqual(importedRec.recoveryId,'r-collision');assert.equal(importedRec.caseId,'target');assert.equal(importedRec.case.id,'old-source','el contenido del snapshot se conserva original');
});
