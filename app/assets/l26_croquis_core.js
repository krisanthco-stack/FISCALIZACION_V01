'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26CroquisCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const n=v=>Number(v)||0;
  function normalizeFactor(value){const v=Number(value);return v===2?2:v===0.5?0.5:1}
  function adjustedArea(area,factor){return n(area)*normalizeFactor(factor)}
  function centroid(points){
    const pts=Array.isArray(points)?points:[];
    if(!pts.length)return{x:0,y:0};
    return{x:pts.reduce((s,p)=>s+n(p.x),0)/pts.length,y:pts.reduce((s,p)=>s+n(p.y),0)/pts.length};
  }
  function rotate90(points){
    const pts=(Array.isArray(points)?points:[]).map(p=>({...p,x:n(p.x),y:n(p.y)})),c=centroid(pts);
    return pts.map(p=>({...p,x:c.x-(p.y-c.y),y:c.y+(p.x-c.x)}));
  }
  function translateWithinBounds(points,dx,dy,bounds={}){
    const pts=(Array.isArray(points)?points:[]).map(p=>({...p,x:n(p.x),y:n(p.y)}));if(!pts.length)return pts;
    const minX=bounds.minX??0,maxX=bounds.maxX??1,minY=bounds.minY??0,maxY=bounds.maxY??1;
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
    const tx=Math.max(minX-loX,Math.min(Number(dx)||0,maxX-hiX)),ty=Math.max(minY-loY,Math.min(Number(dy)||0,maxY-hiY));
    return pts.map(p=>({...p,x:p.x+tx,y:p.y+ty}));
  }
  function dimensionGeometry(a,b,center,W,H,offset=22){
    const ax=n(a?.x),ay=n(a?.y),bx=n(b?.x),by=n(b?.y),dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1,mx=(ax+bx)/2,my=(ay+by)/2;
    let nx=-dy/len,ny=dx/len;const cx=n(center?.x),cy=n(center?.y);if((mx-cx)*nx+(my-cy)*ny<0){nx*=-1;ny*=-1}
    const off=Math.max(8,n(offset)||22),da={x:ax+nx*off,y:ay+ny*off},db={x:bx+nx*off,y:by+ny*off};
    return{a:da,b:db,normal:{x:nx,y:ny},label:{x:Math.max(8,Math.min(n(W)-8,(da.x+db.x)/2)),y:Math.max(14,Math.min(n(H)-14,(da.y+db.y)/2))}};
  }
  function numberedPolygonLabel(index,name){
    const number=Math.max(1,Math.floor(Number(index)||0)+1),label=String(name||'').trim()||`Polígono ${number}`;
    return `${number}-${label}`;
  }
  function polygonLabelAnchor(points,index,W,H,pad=18){
    const pts=Array.isArray(points)?points:[],width=Math.max(1,n(W)),height=Math.max(1,n(H)),margin=Math.max(8,n(pad)||18);
    if(!pts.length)return{x:margin,y:margin,align:'left'};
    const xs=pts.map(p=>n(p.x)),ys=pts.map(p=>n(p.y)),left=Number(index)%2===0;
    return{x:Math.max(margin,Math.min(width-margin,left?Math.min(...xs):Math.max(...xs))),y:Math.max(margin,Math.min(height-margin,Math.min(...ys)-margin)),align:left?'left':'right'};
  }
  return{normalizeFactor,adjustedArea,centroid,rotate90,translateWithinBounds,dimensionGeometry,numberedPolygonLabel,polygonLabelAnchor};
});
