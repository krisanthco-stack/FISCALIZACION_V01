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
  function summaryCounts(cases,isManagement){
    const list=Array.isArray(cases)?cases:[];
    const predicate=typeof isManagement==='function'?isManagement:record=>Boolean(record?.management?.inspectionCompleted);
    const management=list.reduce((count,record)=>count+(predicate(record)?1:0),0);
    return{total:list.length,management,active:activeCount(list.length,management)};
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
  return{actionState,filterByActions,colorClass,activeCount,summaryCounts,isOlderThanYear,actionLabel};
});
