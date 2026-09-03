(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26IntegrityCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const compact=value=>String(value??'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/g,'');
  const canonicalTramite=value=>compact(value);
  const districtKey=value=>String(value??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const DISTRICTS=new Map([
    ['puerto viejo','Puerto Viejo'],
    ['la virgen','La Virgen'],
    ['virgen','La Virgen'],
    ['las horquetas','Las Horquetas'],
    ['horquetas','Las Horquetas'],
    ['hoquetas','Las Horquetas'],
    ['llanuras del gaspar','Llanuras del Gaspar'],
    ['llanuras gaspar','Llanuras del Gaspar'],
    ['curena','Cureña']
  ]);
  function normalizeDistrict(value){return DISTRICTS.get(districtKey(value))||''}
  function propertyParts(record){
    const g=record?.general||record||{};
    const base=compact(g.folio||g.finca);
    const plano=compact(g.plano);
    const derecho=compact(g.derecho||g.right||record?.report?.rectification?.propertyRight||'');
    return{base,plano,derecho};
  }
  function caseIdentityKey(record){
    const g=record?.general||record||{},tramite=canonicalTramite(g.tramite||g.expediente||record?.expedienteNumber||''),{base,plano,derecho}=propertyParts(record);
    if(!tramite&&!base&&!plano&&!derecho)return'';
    const prefix=tramite?`T:${tramite}`:'NO-T';
    return`${prefix}|B:${base}|P:${plano}|D:${derecho}`;
  }
  function importFolioKey(record){const g=record?.general||record||{};return compact(g.folio||g.finca)}
  function findImportMatchByFolio(records,candidate){const wanted=importFolioKey(candidate);if(!wanted)return null;return (Array.isArray(records)?records:[]).find(record=>importFolioKey(record)===wanted)||null}
  function uniqueFolioCount(records){const seen=new Set();let count=0;for(const [index,record] of (Array.isArray(records)?records:[]).entries()){const folio=importFolioKey(record);const fallback=String(record?.id||record?.general?.tramite||record?.tramite||`ROW-${index}`);const key=folio?`F:${folio}`:`R:${fallback}`;if(seen.has(key))continue;seen.add(key);count++}return count}
  function sameTramite(a,b){const x=canonicalTramite(a?.general?.tramite||a?.tramite||''),y=canonicalTramite(b?.general?.tramite||b?.tramite||'');return Boolean(x&&y&&x===y)}
  function hasTramiteConflict(a,b){const x=canonicalTramite(a?.general?.tramite||a?.tramite||''),y=canonicalTramite(b?.general?.tramite||b?.tramite||'');return Boolean(x&&y&&x!==y)}
  function recordsMayMerge(a,b){
    if(hasTramiteConflict(a,b))return false;
    const left=caseIdentityKey(a),right=caseIdentityKey(b);
    if(left||right)return Boolean(left&&right&&left===right);
    const leftId=String(a?.id||''),rightId=String(b?.id||'');
    return Boolean(leftId&&rightId&&leftId===rightId);
  }
  function findRecoveryCandidates(cases,recoveryRecords){
    const current=Array.isArray(cases)?cases:[],recovery=Array.isArray(recoveryRecords)?[...recoveryRecords]:[],currentKeys=new Set(current.map(caseIdentityKey).filter(Boolean)),currentById=new Map(current.map(c=>[String(c?.id||''),c])),seen=new Set(),out=[];
    recovery.sort((a,b)=>String(b?.recoveredAt||'').localeCompare(String(a?.recoveredAt||'')));
    for(const rec of recovery){const c=rec?.case;if(!c)continue;const key=caseIdentityKey(c);if(!key||currentKeys.has(key)||seen.has(key))continue;const currentCase=currentById.get(String(rec?.caseId||c?.id||''));let reason='MISSING_IDENTITY_SNAPSHOT';if(currentCase&&hasTramiteConflict(currentCase,c))reason='ID_COLLISION_DIFFERENT_TRANSACTION';seen.add(key);out.push({recoveryId:rec?.recoveryId||'',snapshotId:rec?.snapshotId||'',caseId:rec?.caseId||c?.id||'',tramite:String(c?.general?.tramite||'').trim(),identity:key,recoveredAt:rec?.recoveredAt||'',reason})}
    return out;
  }

  function extractTramiteFromText(value){
    const text=String(value||'');
    const match=text.match(/(?:^|[^0-9])((?:19|20)\d{2})[-_\s]+(\d{3,8})(?=[^0-9]|$)/);
    return match?`${match[1]}-${match[2]}`:'';
  }
  function documentIdentifiers(record){
    const g=record?.general||record||{};
    return [
      {type:'finca',label:'número de finca',value:String(g.finca||'').trim()},
      {type:'folio',label:'folio',value:String(g.folio||'').trim()}
    ].filter(item=>compact(item.value).length>=4);
  }
  function propertyDocumentMatches(fileName,cases){
    const compactName=compact(String(fileName||'').replace(/\.pdf$/i,'')),matches=[];
    for(const c of cases||[]){for(const identifier of documentIdentifiers(c)){const token=compact(identifier.value);if(token&&compactName.includes(token))matches.push({case:c,identifier})}}
    const unique=[...new Map(matches.map(match=>[String(match.case?.id||caseIdentityKey(match.case)),match.case])).values()];
    return{matches,unique};
  }
  function findDocumentCaseMatch(fileName,cases){
    const list=Array.isArray(cases)?cases:[],stem=String(fileName||'').replace(/\.pdf$/i,'').trim(),detectedTramite=extractTramiteFromText(stem),detectedKey=canonicalTramite(detectedTramite);
    if(detectedKey){
      const transactionCases=list.filter(c=>canonicalTramite(c?.general?.tramite||c?.tramite||c?.expedienteNumber||'')===detectedKey);
      if(!transactionCases.length)return{status:'none',strategy:'número de trámite',matchedValue:detectedTramite,candidates:[],detectedTramite,reason:'TRAMITE_NO_ENCONTRADO'};
      if(transactionCases.length===1)return{status:'matched',strategy:'número de trámite',matchedValue:detectedTramite,case:transactionCases[0],candidates:transactionCases,detectedTramite};
      const property=propertyDocumentMatches(stem,transactionCases);
      if(property.unique.length===1){const selected=property.matches.find(match=>match.case===property.unique[0]);return{status:'matched',strategy:`número de trámite + ${selected?.identifier?.label||'inmueble'}`,matchedValue:detectedTramite,case:property.unique[0],candidates:property.unique,detectedTramite}}
      return{status:'ambiguous',strategy:'número de trámite',matchedValue:detectedTramite,candidates:property.unique.length?property.unique:transactionCases,detectedTramite,reason:'TRAMITE_CON_VARIAS_PROPIEDADES'};
    }
    const exactKey=canonicalTramite(stem),exact=exactKey?list.filter(c=>canonicalTramite(c?.general?.tramite||c?.tramite||c?.expedienteNumber||'')===exactKey):[];
    if(exact.length===1)return{status:'matched',strategy:'nombre exacto',matchedValue:stem,case:exact[0],candidates:exact,detectedTramite:''};
    if(exact.length>1)return{status:'ambiguous',strategy:'nombre exacto',matchedValue:stem,candidates:exact,detectedTramite:''};
    const property=propertyDocumentMatches(stem,list);
    if(property.unique.length===1){const selected=property.matches.find(match=>match.case===property.unique[0]);return{status:'matched',strategy:selected?.identifier?.label||'finca o folio',matchedValue:selected?.identifier?.value||'',case:property.unique[0],candidates:property.unique,detectedTramite:''}}
    if(property.unique.length>1)return{status:'ambiguous',strategy:'finca o folio',matchedValue:'',candidates:property.unique,detectedTramite:''};
    return{status:'none',strategy:'',matchedValue:'',candidates:[],detectedTramite:''};
  }
  function auditIntegrity(cases,documents){
    const caseList=Array.isArray(cases)?cases:[],docList=Array.isArray(documents)?documents:[],byId=new Map(caseList.map(c=>[String(c?.id||''),c])),byIdentity=new Map();
    const duplicateIdentities=[],casesWithoutTramite=[],invalidDistricts=[],documentTramiteMismatches=[],sourceFileTramiteMismatches=[],documentNameTramiteMismatches=[];
    for(const c of caseList){
      const tramiteText=String(c?.general?.tramite||'').trim(),tramite=canonicalTramite(tramiteText);if(!tramite)casesWithoutTramite.push({caseId:c?.id||'',tramite:tramiteText});
      const district=String(c?.visit?.district||'').trim();if(district&&!normalizeDistrict(district))invalidDistricts.push({caseId:c?.id||'',tramite:tramiteText,district});
      const key=caseIdentityKey(c);if(key){if(byIdentity.has(key))duplicateIdentities.push({identity:key,caseIds:[byIdentity.get(key)?.id||'',c?.id||'']});else byIdentity.set(key,c)}
      const sourceFile=String(c?.sourceFile||c?.importMeta?.sourceFile||'').trim(),fileTramite=extractTramiteFromText(sourceFile);
      if(tramite&&fileTramite&&canonicalTramite(fileTramite)!==tramite)sourceFileTramiteMismatches.push({caseId:c?.id||'',caseTramite:tramiteText,detectedTramite:fileTramite,sourceFile});
    }
    for(const d of docList){
      const c=byId.get(String(d?.caseId||''));if(!c)continue;const currentText=String(c?.general?.tramite||'').trim(),current=canonicalTramite(currentText),linkedText=String(d?.expedienteNumber||'').trim(),linked=canonicalTramite(linkedText);
      if(current&&linked&&current!==linked)documentTramiteMismatches.push({documentId:d?.id||'',caseId:c?.id||'',caseTramite:currentText,documentTramite:linkedText,originalName:d?.originalName||''});
      const nameTramite=extractTramiteFromText(d?.originalName||'');if(current&&nameTramite&&canonicalTramite(nameTramite)!==current)documentNameTramiteMismatches.push({documentId:d?.id||'',caseId:c?.id||'',caseTramite:currentText,detectedTramite:nameTramite,originalName:d?.originalName||''});
    }
    const totalIssues=duplicateIdentities.length+casesWithoutTramite.length+invalidDistricts.length+documentTramiteMismatches.length+sourceFileTramiteMismatches.length+documentNameTramiteMismatches.length;
    return{generatedAt:new Date().toISOString(),duplicateIdentities,casesWithoutTramite,invalidDistricts,documentTramiteMismatches,sourceFileTramiteMismatches,documentNameTramiteMismatches,totalIssues};
  }

  const cloneValue=value=>value==null?value:(typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value)));
  const isBlank=value=>value==null||(typeof value==='string'&&value.trim()==='');
  function fillMissingDeep(base,fallback){
    if(Array.isArray(base))return base.length?cloneValue(base):cloneValue(Array.isArray(fallback)?fallback:[]);
    if(base&&typeof base==='object'){
      const out=cloneValue(base);
      for(const [key,value] of Object.entries(fallback||{})){
        if(isBlank(out[key]))out[key]=cloneValue(value);
        else if(out[key]&&typeof out[key]==='object'&&!Array.isArray(out[key])&&value&&typeof value==='object'&&!Array.isArray(value))out[key]=fillMissingDeep(out[key],value);
      }
      return out;
    }
    return isBlank(base)?cloneValue(fallback):base;
  }
  function mergeUniqueArray(primary,secondary){
    const out=[],index=new Map();
    for(const item of [...(Array.isArray(primary)?primary:[]),...(Array.isArray(secondary)?secondary:[])]){
      const objectKey=item&&typeof item==='object'?(item.id||item.recoveryId||item.documentKey||item.sha256||''):'';
      const key=objectKey||`V:${typeof item==='object'?JSON.stringify(item):String(item)}`;
      if(index.has(key)){
        const at=index.get(key);if(objectKey&&item&&typeof item==='object'&&out[at]&&typeof out[at]==='object')out[at]=fillMissingDeep(out[at],item);
        continue;
      }
      index.set(key,out.length);out.push(cloneValue(item));
    }
    return out;
  }
  function recordStatusRank(record){const status=String(record?.status||'');if(status==='Enviado')return 4;if(status==='Finalizado'||record?.workflow?.stage==='completed')return 3;if(status==='En proceso'||record?.workflow?.stage==='resolution')return 2;return 1}
  function recordTimestamp(record){const raw=record?.updatedAt||record?.completedAt||record?.createdAt||'';const value=Date.parse(raw);return Number.isFinite(value)?value:0}
  function planFolioConsolidation(records){
    const list=Array.isArray(records)?records:[],groupsByFolio=new Map(),untouched=[];
    for(const record of list){const folio=importFolioKey(record);if(!folio){untouched.push(record);continue}if(!groupsByFolio.has(folio))groupsByFolio.set(folio,[]);groupsByFolio.get(folio).push(record)}
    const groups=[];
    for(const [folio,items] of groupsByFolio){
      if(items.length<2){untouched.push(items[0]);continue}
      const ordered=[...items].sort((a,b)=>recordStatusRank(b)-recordStatusRank(a)||recordTimestamp(b)-recordTimestamp(a)||String(a?.id||'').localeCompare(String(b?.id||'')));
      groups.push({folio,survivorId:String(ordered[0]?.id||''),duplicateIds:ordered.slice(1).map(item=>String(item?.id||'')),records:ordered});
    }
    return{groups,untouched,totalDuplicates:groups.reduce((sum,g)=>sum+g.duplicateIds.length,0)};
  }
  function mergeFolioDuplicateData(primary,duplicate){
    const left=cloneValue(primary||{}),right=cloneValue(duplicate||{}),merged=fillMissingDeep(left,right);
    merged.id=left.id||right.id;
    merged.general=fillMissingDeep(left.general||{},right.general||{});
    merged.visit=fillMissingDeep(left.visit||{},right.visit||{});
    merged.location=fillMissingDeep(left.location||{},right.location||{});
    merged.terrain=fillMissingDeep(left.terrain||{},right.terrain||{});
    merged.road=fillMissingDeep(left.road||{},right.road||{});
    merged.management=fillMissingDeep(left.management||{},right.management||{});
    merged.localBase=fillMissingDeep(left.localBase||{},right.localBase||{});
    merged.syncMeta=fillMissingDeep(left.syncMeta||{},right.syncMeta||{});
    merged.workflow=fillMissingDeep(left.workflow||{},right.workflow||{});
    if(recordStatusRank(right)>recordStatusRank(left)){merged.status=right.status;merged.workflow.stage=right.workflow?.stage||merged.workflow.stage;merged.completedAt=right.completedAt||merged.completedAt;merged.completedBy=right.completedBy||merged.completedBy}
    merged.workflow.history=mergeUniqueArray(left.workflow?.history,right.workflow?.history);
    merged.workflow.pendingItems=mergeUniqueArray(left.workflow?.pendingItems,right.workflow?.pendingItems);
    merged.repositoryAudit=fillMissingDeep(left.repositoryAudit||{},right.repositoryAudit||{});
    merged.repositoryAudit.items=mergeUniqueArray(left.repositoryAudit?.items,right.repositoryAudit?.items);
    merged.report=fillMissingDeep(left.report||{},right.report||{});
    merged.report.rectification=fillMissingDeep(left.report?.rectification||{},right.report?.rectification||{});
    merged.report.rectification.history=mergeUniqueArray(left.report?.rectification?.history,right.report?.rectification?.history);
    merged.report.valuationAnnex=fillMissingDeep(left.report?.valuationAnnex||{},right.report?.valuationAnnex||{});
    for(const key of ['terrainPhotos','constructionPhotos','agroPhotos'])merged.report.valuationAnnex[key]=mergeUniqueArray(left.report?.valuationAnnex?.[key],right.report?.valuationAnnex?.[key]);
    merged.constructions=mergeUniqueArray(left.constructions,right.constructions);
    merged.photos=mergeUniqueArray(left.photos,right.photos);
    merged.rights=[...new Set([...(left.rights||[]),...(right.rights||[])].map(v=>String(v||'').trim()).filter(Boolean))];
    const newest=Math.max(recordTimestamp(left),recordTimestamp(right));if(newest)merged.updatedAt=new Date(newest).toISOString();
    return merged;
  }
  function buildGlobalBackupEnvelope(input={}){
    const cases=cloneValue(input.cases||[]),photos=cloneValue(input.photos||[]),documents=cloneValue(input.documents||[]),recovery=input.recovery||{},managementCaseIds=cases.filter(c=>c?.workflow?.stage==='completed'||['Finalizado','Enviado'].includes(String(c?.status||''))).map(c=>c.id);
    const recoveryCases=cloneValue(recovery.cases||[]),recoveryPhotos=cloneValue(recovery.photos||[]),recoveryDocuments=cloneValue(recovery.documents||[]);
    return{schema:'FiscalizacionBIGlobalExport',schemaVersion:1,appVersion:String(input.appVersion||''),dbVersion:Number(input.dbVersion||0),exportedAt:input.exportedAt||new Date().toISOString(),format:'JSON+base64',counts:{cases:cases.length,management:managementCaseIds.length,photos:photos.length,documents:documents.length,recoveryCases:recoveryCases.length,recoveryPhotos:recoveryPhotos.length,recoveryDocuments:recoveryDocuments.length},cases,management:{caseIds:managementCaseIds},attachments:{photos,documents},recovery:{cases:recoveryCases,photos:recoveryPhotos,documents:recoveryDocuments},metadata:cloneValue(input.metadata||{})};
  }

  return{canonicalTramite,normalizeDistrict,caseIdentityKey,importFolioKey,findImportMatchByFolio,uniqueFolioCount,sameTramite,hasTramiteConflict,recordsMayMerge,findRecoveryCandidates,extractTramiteFromText,findDocumentCaseMatch,auditIntegrity,planFolioConsolidation,mergeFolioDuplicateData,buildGlobalBackupEnvelope};
});
