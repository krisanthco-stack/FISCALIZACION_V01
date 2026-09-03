'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26FilterCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function caseTramiteYear(caseRecord){
    const tramite=String(caseRecord?.general?.tramite||'').trim();
    const match=tramite.match(/(?:^|\D)((?:19|20)\d{2})(?=\D|$)/);
    return match?match[1]:'Sin año';
  }
  function yearEntries(cases){
    const years=new Set((Array.isArray(cases)?cases:[]).map(caseTramiteYear));
    const numeric=[...years].filter(x=>/^\d{4}$/.test(x)).sort((a,b)=>Number(b)-Number(a));
    const out=numeric.map(year=>({key:year,label:year}));
    if(years.has('Sin año'))out.push({key:'Sin año',label:'Sin año'});
    return out;
  }
  function filterByYear(cases,selectedYear=''){
    const list=Array.isArray(cases)?cases:[];
    const year=String(selectedYear||'').trim();
    return year?list.filter(item=>caseTramiteYear(item)===year):list.slice();
  }
  function filterByAlarm(cases,alarmOnly=false,needsAlarm=()=>false){
    const list=Array.isArray(cases)?cases:[];
    return alarmOnly?list.filter(item=>Boolean(needsAlarm(item))):list.slice();
  }
  return{caseTramiteYear,yearEntries,filterByYear,filterByAlarm};
});
