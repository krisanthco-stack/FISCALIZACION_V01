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
  function projectMetricPolygonsCommonScale(polygons,bounds={}){
    const items=(Array.isArray(polygons)?polygons:[]).map(item=>{
      const pts=(Array.isArray(item?.metricPoints)?item.metricPoints:[]).map((p,i)=>({...p,x:n(p.x),y:n(p.y),label:p?.label||`V${i+1}`}));
      const sourceCenter=centroid(pts),target=item?.center&&Number.isFinite(Number(item.center.x))&&Number.isFinite(Number(item.center.y))?{x:Number(item.center.x),y:Number(item.center.y)}:{x:.5,y:.5};
      if(!pts.length)return{pts,sourceCenter,target,extents:{left:0,right:0,top:0,bottom:0}};
      const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
      return{pts,sourceCenter,target,extents:{left:sourceCenter.x-Math.min(...xs),right:Math.max(...xs)-sourceCenter.x,top:sourceCenter.y-Math.min(...ys),bottom:Math.max(...ys)-sourceCenter.y}};
    });
    const minX=Number.isFinite(Number(bounds.minX))?Number(bounds.minX):.04,maxX=Number.isFinite(Number(bounds.maxX))?Number(bounds.maxX):.96,minY=Number.isFinite(Number(bounds.minY))?Number(bounds.minY):.08,maxY=Number.isFinite(Number(bounds.maxY))?Number(bounds.maxY):.94,width=Math.max(1,Number(bounds.width)||1),height=Math.max(1,Number(bounds.height)||1);
    let pixelScale=Infinity;
    items.forEach(item=>{
      const {target,extents:e}=item;
      if(e.left>0)pixelScale=Math.min(pixelScale,(target.x-minX)*width/e.left);
      if(e.right>0)pixelScale=Math.min(pixelScale,(maxX-target.x)*width/e.right);
      if(e.top>0)pixelScale=Math.min(pixelScale,(target.y-minY)*height/e.top);
      if(e.bottom>0)pixelScale=Math.min(pixelScale,(maxY-target.y)*height/e.bottom);
    });
    if(!Number.isFinite(pixelScale)||pixelScale<=0)pixelScale=1;
    return items.map(({pts,sourceCenter,target})=>pts.map(p=>({...p,x:target.x+(p.x-sourceCenter.x)*pixelScale/width,y:target.y+(p.y-sourceCenter.y)*pixelScale/height})));
  }
  function polygonLegendLayout(names,W,H){
    const labels=(Array.isArray(names)?names:[]).map((name,i)=>`${i+1} - ${String(name||'').trim()||`Polígono ${i+1}`}`),width=Math.max(1,n(W)),height=Math.max(1,n(H)),margin=12,itemHeight=24,boxWidth=Math.min(260,Math.max(170,width*.28)),boxHeight=Math.min(height-margin*2,18+labels.length*itemHeight),x=width-margin-boxWidth,y=margin;
    return{corner:'top-right',box:{x,y,width:boxWidth,height:boxHeight},items:labels.map((label,i)=>({label,x:x+12,y:y+18+i*itemHeight}))};
  }
  return{normalizeFactor,adjustedArea,centroid,rotate90,translateWithinBounds,dimensionGeometry,numberedPolygonLabel,polygonLabelAnchor,projectMetricPolygonsCommonScale,polygonLegendLayout};
});
