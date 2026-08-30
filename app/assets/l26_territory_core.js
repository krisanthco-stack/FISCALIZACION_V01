'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26TerritoryCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ARTICLES=new Set(['el','la','los','las']);
  function words(value){return String(value??'').trim().replace(/\s+/g,' ').split(' ').filter(Boolean)}
  function deaccent(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function baseKey(value){return deaccent(String(value??'')).toLocaleLowerCase('es-CR').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
  function comparisonKey(value){
    const parts=baseKey(value).split(' ').filter(Boolean);
    if(parts.length>1&&ARTICLES.has(parts[0]))parts.shift();
    return parts.join(' ');
  }
  function sameGeoName(a,b){const x=comparisonKey(a),y=comparisonKey(b);return Boolean(x&&y&&x===y)}
  function capitalize(word){word=String(word||'').toLocaleLowerCase('es-CR');return word?word.charAt(0).toLocaleUpperCase('es-CR')+word.slice(1):''}
  function formatDistrict(value){const text=words(value).join(' ').toLocaleLowerCase('es-CR');return text?text.charAt(0).toLocaleUpperCase('es-CR')+text.slice(1):''}
  function formatPlace(value){return words(value).map(capitalize).join(' ')}
  function locationScope(record){return `${comparisonKey(record?.visit?.province||'')}|${comparisonKey(record?.visit?.canton||'')}`}
  function inferMissingDistricts(cases,normalizeDistrict){
    const list=(Array.isArray(cases)?cases:[]).map(item=>({...(item||{}),visit:{...(item?.visit||{})}}));
    const groups=new Map();
    for(const record of list){
      const place=comparisonKey(record.visit.locality||record.visit.place||'');if(!place)continue;
      const key=`${locationScope(record)}|${place}`;
      if(!groups.has(key))groups.set(key,{districts:new Map(),records:[]});
      const group=groups.get(key);group.records.push(record);
      const district=String(record.visit.district||'').trim();
      if(district){const validated=typeof normalizeDistrict==='function'?String(normalizeDistrict(district)||'').trim():district;const dk=comparisonKey(validated);if(dk&&!group.districts.has(dk))group.districts.set(dk,formatDistrict(validated))}
    }
    const inferred=[],conflicts=[];
    for(const [key,group] of groups){
      const missing=group.records.filter(record=>!String(record.visit.district||'').trim());
      if(!missing.length)continue;
      if(group.districts.size===1){const district=[...group.districts.values()][0];for(const record of missing){record.visit.district=district;record.territoryMetadata={...(record.territoryMetadata||{}),districtSource:'INFERRED_FROM_PLACE',districtInferredAt:new Date().toISOString()};inferred.push({caseId:record.id||'',district,place:formatPlace(record.visit.locality||'')})}}
      else if(group.districts.size>1)conflicts.push({key,caseIds:missing.map(r=>r.id||''),districts:[...group.districts.values()]});
    }
    return{cases:list,inferred,conflicts};
  }
  return{baseKey,comparisonKey,sameGeoName,formatDistrict,formatPlace,inferMissingDistricts};
});
