'use strict';
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26PdfReader=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const PDFJS_VERSION='4.10.38';
  const PDFJS_CACHE='l26-pdfjs-4.10.38-legacy-v2';
  const PDFJS_LOCAL_MODULE_URL='./app/assets/vendor/pdfjs-4.10.38-legacy/pdf.min.mjs';
  const PDFJS_LOCAL_WORKER_URL='./app/assets/vendor/pdfjs-4.10.38-legacy/pdf.worker.min.mjs';
  const PDFJS_CMAP_URL='./app/assets/vendor/pdfjs-4.10.38-legacy/cmaps/';
  const PDFJS_STANDARD_FONT_URL='./app/assets/vendor/pdfjs-4.10.38-legacy/standard_fonts/';
  let active=null,pdfjsPromise=null,moduleBlobUrl='',workerBlobUrl='',sessionCounter=0;

  function normalizeRect(rect){
    const x=Number(rect?.x)||0,y=Number(rect?.y)||0,width=Number(rect?.width)||0,height=Number(rect?.height)||0;
    return {x:width<0?x+width:x,y:height<0?y+height:y,width:Math.abs(width),height:Math.abs(height)};
  }

  function rectsIntersect(a,b){
    a=normalizeRect(a);b=normalizeRect(b);
    return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  }

  function textFromItemsInRect(items,rect){
    const selected=(Array.isArray(items)?items:[]).filter(item=>String(item?.str||'').trim()&&rectsIntersect(item,rect));
    selected.sort((a,b)=>{
      const ay=Number(a.y)||0,by=Number(b.y)||0,ah=Math.max(1,Number(a.height)||1),bh=Math.max(1,Number(b.height)||1);
      const tolerance=Math.max(4,Math.min(ah,bh)*.6);
      if(Math.abs(ay-by)>tolerance)return ay-by;
      return (Number(a.x)||0)-(Number(b.x)||0);
    });
    const lines=[];
    for(const item of selected){
      const text=String(item.str||'').trim();if(!text)continue;
      const y=Number(item.y)||0,height=Math.max(1,Number(item.height)||1),last=lines[lines.length-1];
      if(!last||Math.abs(last.y-y)>Math.max(4,Math.min(last.height,height)*.6))lines.push({y,height,parts:[text]});
      else last.parts.push(text);
    }
    return lines.map(line=>line.parts.join(' ').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n');
  }

  function installRuntimeCompatibility(){
    if(typeof Promise!=='undefined'&&typeof Promise.withResolvers!=='function'){
      Object.defineProperty(Promise,'withResolvers',{configurable:true,writable:true,value:function(){
        let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject};
      }});
    }
    installTypedArrayCompatibility();
  }

  function installTypedArrayCompatibility(){
    if(typeof Uint8Array==='undefined')return;
    if(typeof Uint8Array.prototype.toHex!=='function'){
      Object.defineProperty(Uint8Array.prototype,'toHex',{configurable:true,writable:true,value:function(){
        let out='';for(let i=0;i<this.length;i++)out+=this[i].toString(16).padStart(2,'0');return out;
      }});
    }
    if(typeof Uint8Array.fromHex!=='function'){
      Object.defineProperty(Uint8Array,'fromHex',{configurable:true,writable:true,value:function(value){
        const hex=String(value||'').replace(/\s+/g,'');
        if(hex.length%2||!/^[0-9a-f]*$/i.test(hex))throw new SyntaxError('Cadena hexadecimal inválida.');
        const out=new Uint8Array(hex.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(hex.slice(i*2,i*2+2),16);return out;
      }});
    }
  }

  function browserReady(){return Boolean(root&&root.document&&root.Blob&&root.URL&&root.fetch)}
  function byId(id){return root?.document?.getElementById(id)||null}
  function setStatus(message,kind=''){
    const host=byId('pdfViewerStatus');if(!host)return;
    host.textContent=String(message||'');host.className=`notice${kind?` ${kind}`:''}`;
  }

  async function fetchLocalText(url){
    let response=null;
    if(typeof root.caches!=='undefined'){
      const cache=await caches.open(PDFJS_CACHE);
      response=await cache.match(url);
      if(!response){
        response=await fetch(url,{cache:'force-cache'});
        if(response?.ok)await cache.put(url,response.clone());
      }
    }else response=await fetch(url,{cache:'force-cache'});
    if(!response?.ok)throw new Error('El motor PDF offline no está incluido en esta instalación. Actualice/reinstale L-26.');
    return response.text();
  }

  async function loadPdfJs(){
    if(!browserReady())throw new Error('El lector PDF solo puede ejecutarse en el navegador.');
    if(pdfjsPromise)return pdfjsPromise;
    pdfjsPromise=(async()=>{
      installRuntimeCompatibility();
      const [moduleSource,workerSource]=await Promise.all([
        fetchLocalText(PDFJS_LOCAL_MODULE_URL),
        fetchLocalText(PDFJS_LOCAL_WORKER_URL)
      ]);
      moduleBlobUrl=URL.createObjectURL(new Blob([moduleSource],{type:'text/javascript'}));
      workerBlobUrl=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
      const pdfjs=await import(moduleBlobUrl);
      pdfjs.GlobalWorkerOptions.workerSrc=workerBlobUrl;
      return pdfjs;
    })().catch(error=>{pdfjsPromise=null;throw error});
    return pdfjsPromise;
  }

  function pdfDocumentOptions(data){
    return {data,isEvalSupported:false,cMapUrl:PDFJS_CMAP_URL,cMapPacked:true,standardFontDataUrl:PDFJS_STANDARD_FONT_URL};
  }

  function androidOcrAvailable(){return typeof root?.L26Android?.ocrImage==='function'}
  async function ocrCanvas(canvas){
    if(androidOcrAvailable()){
      const dataUrl=canvas.toDataURL('image/jpeg',.92);
      return String(root.L26Android.ocrImage(dataUrl)||'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    }
    if(typeof root?.TextDetector!=='function')return '';
    const detector=new root.TextDetector(),source=typeof root.createImageBitmap==='function'?await root.createImageBitmap(canvas):canvas;
    try{
      const blocks=await detector.detect(source);
      return (blocks||[]).map(block=>String(block?.rawValue||block?.text||'').trim()).filter(Boolean).join('\n');
    }finally{source?.close?.()}
  }

  async function extractTextFromPdf(pdf,options={}){
    if(!pdf||typeof pdf.getPage!=='function')throw new Error('No se recibió un documento PDF válido para lectura.');
    const total=Math.max(0,Number(pdf.numPages)||0),limit=Math.max(1,Math.min(total||1,Number(options.maxPages)||total||1)),pages=[];
    for(let pageNo=1;pageNo<=limit;pageNo++){
      options.onProgress?.({page:pageNo,total});
      const page=await pdf.getPage(pageNo),content=await page.getTextContent(),parts=[];
      for(const item of content?.items||[]){const text=String(item?.str||'').replace(/\s+/g,' ').trim();if(text)parts.push(text)}
      const pageText=parts.join(' ').replace(/\s+/g,' ').trim();if(pageText)pages.push(pageText);
    }
    const text=pages.join('\n\n').trim();
    return {text,hasText:Boolean(text),pagesRead:limit,totalPages:total};
  }

  async function extractOcrTextFromPdf(pdf,options={}){
    const total=Math.max(0,Number(pdf?.numPages)||0);
    if(!pdf||typeof pdf.getPage!=='function')throw new Error('No se recibió un documento PDF válido para OCR.');
    if(!root?.document)return{text:'',hasText:false,pagesRead:0,totalPages:total,ocr:true,ocrAvailable:false};
    const ocrAvailable=androidOcrAvailable()||typeof root?.TextDetector==='function';
    if(!ocrAvailable)return{text:'',hasText:false,pagesRead:0,totalPages:total,ocr:true,ocrAvailable:false};
    const requested=Number(options.ocrMaxPages)||Number(options.maxPages)||total||1,limit=Math.max(1,Math.min(total||1,requested)),pages=[];
    for(let pageNo=1;pageNo<=limit;pageNo++){
      options.onProgress?.({page:pageNo,total,ocr:true});
      const page=await pdf.getPage(pageNo),viewport=page.getViewport({scale:Math.max(1.25,Math.min(2,Number(options.ocrScale)||1.6))}),canvas=root.document.createElement('canvas');
      canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));
      const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      await page.render({canvasContext:ctx,viewport}).promise;
      try{const text=await ocrCanvas(canvas);if(text)pages.push(text)}finally{canvas.width=1;canvas.height=1}
    }
    const text=pages.join('\n\n').trim();
    return{text,hasText:Boolean(text),pagesRead:limit,totalPages:total,ocr:true,ocrAvailable:true};
  }

  async function extractDocumentText(blob,options={}){
    if(!blob)throw new Error('No se recibió el PDF para leer.');
    const pdfjs=await loadPdfJs(),bytes=new Uint8Array(await blob.arrayBuffer()),task=pdfjs.getDocument(pdfDocumentOptions(bytes));
    let pdf=null;
    try{
      pdf=await task.promise;
      const digital=await extractTextFromPdf(pdf,options);
      if(digital.hasText||options.ocrFallback===false)return digital;
      const ocr=await extractOcrTextFromPdf(pdf,options);
      return ocr.hasText?ocr:{...digital,ocrAttempted:true,ocrAvailable:ocr.ocrAvailable};
    }finally{try{await pdf?.destroy?.()}catch(_){ }}
  }

  function textItemsForViewport(pdfjs,content,viewport){
    const out=[];
    for(const item of content?.items||[]){
      const str=String(item?.str||'').trim();if(!str||!item.transform)continue;
      const tx=pdfjs.Util.transform(viewport.transform,item.transform);
      const fontHeight=Math.max(2,Math.hypot(tx[2],tx[3])||Math.abs(Number(item.height)||0)*viewport.scale||10);
      const width=Math.max(1,Math.abs(Number(item.width)||0)*viewport.scale);
      out.push({str,x:tx[4],y:tx[5]-fontHeight,width,height:fontHeight});
    }
    return out;
  }

  function setNavigationState(a){
    const label=byId('pdfViewerPageLabel'),prev=byId('pdfViewerPrev'),next=byId('pdfViewerNext');
    if(label)label.textContent=`Página ${a.pageNo} / ${a.pdf?.numPages||'—'}`;
    if(prev)prev.disabled=a.pageNo<=1;
    if(next)next.disabled=!a.pdf||a.pageNo>=a.pdf.numPages;
  }

  async function renderPage(){
    const a=active;if(!a?.pdf)return;
    const token=a.token,pageNo=a.pageNo;
    a.renderTask?.cancel?.();
    setStatus(`Cargando página ${pageNo}…`);
    const page=await a.pdf.getPage(pageNo);
    if(!active||active.token!==token)return;
    const viewportHost=byId('pdfViewerViewport'),canvas=byId('pdfViewerCanvas'),stage=byId('pdfViewerStage');
    if(!canvas||!stage)throw new Error('No se encontró el lienzo del lector PDF.');
    const baseViewport=page.getViewport({scale:1});
    const availableWidth=Math.max(260,(viewportHost?.clientWidth||root.innerWidth||800)-28);
    const fitScale=Math.max(.35,Math.min(3,availableWidth/baseViewport.width));
    const scale=a.fit?fitScale:Math.max(.35,Math.min(4,a.zoom||1));
    a.effectiveScale=scale;
    const viewport=page.getViewport({scale});
    const outputScale=Math.max(1,Math.min(2,Number(root.devicePixelRatio)||1));
    canvas.width=Math.max(1,Math.floor(viewport.width*outputScale));
    canvas.height=Math.max(1,Math.floor(viewport.height*outputScale));
    canvas.style.width=`${Math.floor(viewport.width)}px`;
    canvas.style.height=`${Math.floor(viewport.height)}px`;
    stage.style.width=canvas.style.width;stage.style.height=canvas.style.height;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.save();ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
    const transform=outputScale===1?null:[outputScale,0,0,outputScale,0,0];
    a.renderTask=page.render({canvasContext:ctx,viewport,transform});
    await a.renderTask.promise;
    if(!active||active.token!==token)return;
    const content=await page.getTextContent();
    a.page=page;a.viewport=viewport;a.textItems=textItemsForViewport(a.pdfjs,content,viewport);
    setNavigationState(a);
    setStatus(a.textItems.length?`Página ${pageNo} lista · texto digital disponible.`:`Página ${pageNo} lista · no se detectó texto digital en esta página.`);
  }

  function wireNavigation(a){
    const prev=byId('pdfViewerPrev'),next=byId('pdfViewerNext'),minus=byId('pdfViewerZoomOut'),plus=byId('pdfViewerZoomIn'),fit=byId('pdfViewerFit');
    if(prev)prev.onclick=async()=>{if(!active||a!==active||a.pageNo<=1)return;a.pageNo--;await renderPage()};
    if(next)next.onclick=async()=>{if(!active||a!==active||!a.pdf||a.pageNo>=a.pdf.numPages)return;a.pageNo++;await renderPage()};
    if(minus)minus.onclick=async()=>{if(!active||a!==active)return;a.fit=false;a.zoom=Math.max(.35,(a.effectiveScale||1)/1.2);await renderPage()};
    if(plus)plus.onclick=async()=>{if(!active||a!==active)return;a.fit=false;a.zoom=Math.min(4,(a.effectiveScale||1)*1.2);await renderPage()};
    if(fit)fit.onclick=async()=>{if(!active||a!==active)return;a.fit=true;await renderPage()};
  }

  function allPageText(a){
    return textFromItemsInRect(a?.textItems||[],{x:-100000,y:-100000,width:200000,height:200000});
  }

  async function deliverText(a,text,meta={}){
    text=String(text||'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    if(!text){setStatus('No se encontró texto legible en la selección.','warn');return false;}
    setStatus('Analizando la información seleccionada…');
    try{
      if(typeof a.onText==='function')await a.onText(text,{page:a.pageNo,...meta});
      setStatus(`Lectura completada en la página ${a.pageNo}.`);
      return true;
    }catch(error){
      console.error('L26 PDF text callback',error);setStatus(error.message||'No se pudieron aplicar los datos detectados.','warn');a.onError?.(error);return false;
    }
  }

  async function readCurrentPage(a=active){
    if(!a?.page)return false;
    const text=allPageText(a);
    if(!text){setStatus('Esta página no contiene texto digital. Pulse “Leer área” para intentar OCR local sobre una zona pequeña.','warn');return false;}
    return deliverText(a,text,{mode:'page',ocr:false});
  }

  function pointOnCanvas(event,canvas){
    const box=canvas.getBoundingClientRect();
    return {x:Math.max(0,Math.min(box.width,event.clientX-box.left)),y:Math.max(0,Math.min(box.height,event.clientY-box.top))};
  }

  function showSelection(rect){
    const overlay=byId('pdfViewerSelection');if(!overlay)return;
    rect=normalizeRect(rect);overlay.hidden=false;overlay.style.left=`${rect.x}px`;overlay.style.top=`${rect.y}px`;overlay.style.width=`${rect.width}px`;overlay.style.height=`${rect.height}px`;
  }

  function hideSelection(){const overlay=byId('pdfViewerSelection');if(overlay){overlay.hidden=true;overlay.style.width='0';overlay.style.height='0'}}

  async function ocrSelectedArea(a,rect){
    if(!androidOcrAvailable()&&typeof root.TextDetector!=='function')throw new Error('Esta instalación no dispone de OCR local.');
    const canvas=byId('pdfViewerCanvas');if(!canvas)throw new Error('No se encontró la página para OCR.');
    const cssWidth=parseFloat(canvas.style.width)||canvas.clientWidth||1,cssHeight=parseFloat(canvas.style.height)||canvas.clientHeight||1;
    const sx=Math.max(0,Math.floor(rect.x*canvas.width/cssWidth)),sy=Math.max(0,Math.floor(rect.y*canvas.height/cssHeight));
    const sw=Math.max(1,Math.min(canvas.width-sx,Math.ceil(rect.width*canvas.width/cssWidth))),sh=Math.max(1,Math.min(canvas.height-sy,Math.ceil(rect.height*canvas.height/cssHeight)));
    const crop=root.document.createElement('canvas');crop.width=sw;crop.height=sh;crop.getContext('2d').drawImage(canvas,sx,sy,sw,sh,0,0,sw,sh);
    try{return await ocrCanvas(crop)}finally{crop.width=1;crop.height=1}
  }

  async function finishAreaSelection(a,rect){
    rect=normalizeRect(rect);if(rect.width<8||rect.height<8){setStatus('Seleccione un área más grande.','warn');return false;}
    let text=textFromItemsInRect(a.textItems,rect),ocr=false;
    if(!text){setStatus('No hay texto digital en esa zona. Intentando OCR local…');text=await ocrSelectedArea(a,rect);ocr=true;}
    return deliverText(a,text,{mode:'area',ocr,rect});
  }

  function disableAreaSelection(a=active){
    if(!a)return;a.selecting=false;a.dragStart=null;
    const stage=byId('pdfViewerStage'),button=byId('pdfViewerSelectArea');stage?.classList.remove('is-selecting');if(button)button.setAttribute('aria-pressed','false');
  }

  function enableAreaSelection(a=active){
    if(!a?.page){setStatus('Espere a que termine de cargar la página.','warn');return false;}
    a.selecting=true;a.dragStart=null;hideSelection();
    const stage=byId('pdfViewerStage'),button=byId('pdfViewerSelectArea');stage?.classList.add('is-selecting');if(button)button.setAttribute('aria-pressed','true');
    setStatus('Arrastre con el dedo, lápiz o mouse un rectángulo sobre los datos que desea leer.');
    return true;
  }

  function wireReadControls(a){
    const pageButton=byId('pdfViewerReadPage'),areaButton=byId('pdfViewerSelectArea'),stage=byId('pdfViewerStage'),canvas=byId('pdfViewerCanvas');
    if(pageButton)pageButton.onclick=()=>readCurrentPage(a);
    if(areaButton)areaButton.onclick=()=>a.selecting?disableAreaSelection(a):enableAreaSelection(a);
    if(!stage||!canvas)return;
    stage.onpointerdown=event=>{
      if(!active||a!==active||!a.selecting)return;
      event.preventDefault();a.dragStart=pointOnCanvas(event,canvas);a.pointerId=event.pointerId;stage.setPointerCapture?.(event.pointerId);showSelection({x:a.dragStart.x,y:a.dragStart.y,width:0,height:0});
    };
    stage.onpointermove=event=>{
      if(!active||a!==active||!a.selecting||!a.dragStart||event.pointerId!==a.pointerId)return;
      event.preventDefault();const point=pointOnCanvas(event,canvas);showSelection({x:a.dragStart.x,y:a.dragStart.y,width:point.x-a.dragStart.x,height:point.y-a.dragStart.y});
    };
    stage.onpointerup=async event=>{
      if(!active||a!==active||!a.selecting||!a.dragStart||event.pointerId!==a.pointerId)return;
      event.preventDefault();const point=pointOnCanvas(event,canvas),rect=normalizeRect({x:a.dragStart.x,y:a.dragStart.y,width:point.x-a.dragStart.x,height:point.y-a.dragStart.y});a.dragStart=null;stage.releasePointerCapture?.(event.pointerId);disableAreaSelection(a);showSelection(rect);
      try{await finishAreaSelection(a,rect)}catch(error){console.error('L26 PDF OCR',error);setStatus(error.message||'No se pudo leer el área seleccionada.','warn');a.onError?.(error)}
      setTimeout(hideSelection,1600);
    };
    stage.onpointercancel=()=>{a.dragStart=null;disableAreaSelection(a);hideSelection()};
  }

  async function open(options={}){
    if(!options.blob)throw new Error('No se recibió el PDF para visualizar.');
    close();
    const token=++sessionCounter;
    const a=active={token,blob:options.blob,onText:options.onText,onError:options.onError,pageNo:1,zoom:1,fit:true,pdf:null,pdfjs:null,page:null,viewport:null,textItems:[],renderTask:null,selecting:false,dragStart:null,pointerId:null,startSelection:Boolean(options.startSelection)};
    wireNavigation(a);wireReadControls(a);setNavigationState(a);setStatus('Preparando lector PDF…');
    try{
      a.pdfjs=await loadPdfJs();if(!active||active.token!==token)return null;
      const bytes=new Uint8Array(await options.blob.arrayBuffer());if(!active||active.token!==token)return null;
      const task=a.pdfjs.getDocument(pdfDocumentOptions(bytes));
      a.pdf=await task.promise;if(!active||active.token!==token){a.pdf?.destroy?.();return null;}
      await renderPage();if(a.startSelection&&active===a)enableAreaSelection(a);return a;
    }catch(error){
      console.error('L26 PDF reader',error);setStatus(`No se pudo iniciar el lector interno: ${error.message||error}`,'warn');
      options.onError?.(error);throw error;
    }
  }

  function close(){
    const a=active;active=null;++sessionCounter;
    try{a?.renderTask?.cancel?.()}catch(_){ }
    try{a?.pdf?.destroy?.()}catch(_){ }
    for(const id of ['pdfViewerPrev','pdfViewerNext','pdfViewerZoomOut','pdfViewerZoomIn','pdfViewerFit','pdfViewerReadPage','pdfViewerSelectArea']){const el=byId(id);if(el)el.onclick=null}const stage=byId('pdfViewerStage');if(stage){stage.onpointerdown=null;stage.onpointermove=null;stage.onpointerup=null;stage.onpointercancel=null;stage.classList.remove('is-selecting')}hideSelection()
  }

  return {open,close,rectsIntersect,textFromItemsInRect,normalizeRect,textItemsForViewport,loadPdfJs,extractTextFromPdf,extractOcrTextFromPdf,extractDocumentText,readCurrentPage,enableAreaSelection,PDFJS_VERSION,PDFJS_CACHE};
});
