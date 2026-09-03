'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26ManagementCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function actionState(record){
    const m=record?.management||{};
    return {
      notified:Boolean(m.notifiedAt||m.notified),
      registered:Boolean(m.registeredAt||m.registered)
    };
  }
  function matches(value,filter){
    if(!filter)return true;
    return filter==='yes'?value:filter==='no'?!value:true;
  }
  function filterByActions(cases,filters={}){
    return (Array.isArray(cases)?cases:[]).filter(record=>{
      const state=actionState(record);
      return matches(state.notified,String(filters.notified||''))&&matches(state.registered,String(filters.registered||''));
    });
  }
  function colorClass(record,olderThanYear=false){
    const state=actionState(record);
    if(state.notified||state.registered)return'management-action-blue';
    return olderThanYear?'management-action-red':'management-action-yellow';
  }
  function activeCount(total,managementCount){return Math.max(0,(Number(total)||0)-(Number(managementCount)||0))}
  const compactFolio=value=>String(value??'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/g,'');
  function folioCountKey(record,index=0){const g=record?.general||record||{},folio=compactFolio(g.folio||g.finca),fallback=String(record?.id||g.tramite||`ROW-${index}`);return folio?`F:${folio}`:`R:${fallback}`}
  function uniqueCountByFolio(records){const seen=new Set();for(const [index,record] of (Array.isArray(records)?records:[]).entries())seen.add(folioCountKey(record,index));return seen.size}
  function summaryCounts(cases,isManagement){
    const list=Array.isArray(cases)?cases:[];
    const predicate=typeof isManagement==='function'?isManagement:record=>Boolean(record?.management?.inspectionCompleted);
    const groups=new Map();
    list.forEach((record,index)=>{const key=folioCountKey(record,index),state=groups.get(key)||{management:false};if(predicate(record))state.management=true;groups.set(key,state)});
    const management=[...groups.values()].filter(state=>state.management).length;
    return{total:groups.size,management,active:groups.size-management};
  }
  function isOlderThanYear(dateValue,now=new Date()){
    const value=String(dateValue||'').trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const inspected=new Date(`${value}T12:00:00`);
    if(Number.isNaN(inspected.getTime()))return false;
    const cutoff=new Date(now.getFullYear()-1,now.getMonth(),now.getDate(),12,0,0,0);
    return inspected<cutoff;
  }
  function actionLabel(record){
    const state=actionState(record);
    if(state.notified&&state.registered)return'Notificado · Registrado';
    if(state.notified)return'Notificado';
    if(state.registered)return'Registrado';
    return'Sin acción';
  }
  return{actionState,filterByActions,colorClass,activeCount,uniqueCountByFolio,summaryCounts,isOlderThanYear,actionLabel};
});
