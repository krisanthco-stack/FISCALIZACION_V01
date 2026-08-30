'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26ReaderApplyCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function isBlank(value){return !String(value??'').trim()}
  function shouldApply(existingValue,onlyMissing=false){return onlyMissing?isBlank(existingValue):true}
  return{isBlank,shouldApply};
});
