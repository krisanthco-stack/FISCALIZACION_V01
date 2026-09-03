'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.L26ExcelImportCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TD=typeof TextDecoder!=='undefined'?TextDecoder:null;
  const decoder=TD?new TD('utf-8'):null;
  const utf8=bytes=>decoder?decoder.decode(bytes):Buffer.from(bytes).toString('utf8');
  const xmlEntityDecode=s=>String(s??'').replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  const stripTags=s=>xmlEntityDecode(String(s??'').replace(/<[^>]*>/g,''));
  const attr=(tag,name)=>{const m=String(tag).match(new RegExp('(?:^|\\s)'+name.replace(':','\\:')+'="([^"]*)"','i'));return m?xmlEntityDecode(m[1]):''};
  const colIndex=ref=>{const m=String(ref||'').match(/^([A-Z]+)\d+$/i);if(!m)return-1;let n=0;for(const ch of m[1].toUpperCase())n=n*26+(ch.charCodeAt(0)-64);return n-1};
  const normalizePath=p=>{const parts=[];String(p||'').replace(/\\/g,'/').split('/').forEach(x=>{if(!x||x==='.')return;if(x==='..')parts.pop();else parts.push(x)});return parts.join('/')};

  function unzipEntries(buffer,inflateRaw){
    const b=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer.buffer||buffer,buffer.byteOffset||0,buffer.byteLength||buffer.length);
    const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);let eocd=-1;
    for(let i=b.length-22;i>=Math.max(0,b.length-66000);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}}
    if(eocd<0)throw new Error('XLSX/ZIP no válido: directorio central no encontrado.');
    const count=dv.getUint16(eocd+10,true),offset=dv.getUint32(eocd+16,true),out={};let p=offset;
    for(let n=0;n<count;n++){
      if(dv.getUint32(p,true)!==0x02014b50)throw new Error('XLSX/ZIP corrupto en directorio central.');
      const method=dv.getUint16(p+10,true),comp=dv.getUint32(p+20,true),uncomp=dv.getUint32(p+24,true),nameLen=dv.getUint16(p+28,true),extra=dv.getUint16(p+30,true),comment=dv.getUint16(p+32,true),local=dv.getUint32(p+42,true),name=utf8(b.subarray(p+46,p+46+nameLen));
      const ln=dv.getUint16(local+26,true),le=dv.getUint16(local+28,true),data=b.subarray(local+30+ln+le,local+30+ln+le+comp);let bytes;
      if(method===0)bytes=new Uint8Array(data);else if(method===8){if(typeof inflateRaw!=='function')throw new Error('Se requiere un descompresor DEFLATE para leer este XLSX.');const r=inflateRaw(data);bytes=r instanceof Uint8Array?new Uint8Array(r):new Uint8Array(r.buffer||r)}else throw new Error(`Compresión ZIP no soportada (${method}) en ${name}.`);
      if(uncomp&&bytes.length!==uncomp)throw new Error(`Entrada XLSX incompleta: ${name}.`);out[normalizePath(name)]=bytes;p+=46+nameLen+extra+comment;
    }
    return out;
  }

  function parseRelationships(xml,baseDir){
    const out={};for(const m of String(xml||'').matchAll(/<Relationship\b[^>]*\/>/gi)){const tag=m[0],id=attr(tag,'Id'),target=attr(tag,'Target');if(!id||!target)continue;const external=/TargetMode="External"/i.test(tag);out[id]={target:external?target:normalizePath(baseDir+'/'+target),external};}return out;
  }
  function parseSharedStrings(xml){
    const out=[];for(const m of String(xml||'').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)){let text='';for(const t of m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi))text+=xmlEntityDecode(t[1]);out.push(text)}return out;
  }
  function cellValue(cellXml,cellTag,shared){
    const type=attr(cellTag,'t');if(type==='inlineStr'){const m=cellXml.match(/<is\b[^>]*>([\s\S]*?)<\/is>/i);if(!m)return'';let s='';for(const t of m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi))s+=xmlEntityDecode(t[1]);return s}
    const vm=cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i);if(!vm)return'';const raw=xmlEntityDecode(vm[1]);if(type==='s')return shared[Number(raw)]??'';if(type==='str'||type==='e')return raw;if(type==='b')return raw==='1';const n=Number(raw);return Number.isFinite(n)?n:raw;
  }
  function formulaHyperlinkUrl(cellXml){
    const fm=String(cellXml||'').match(/<f\b[^>]*>([\s\S]*?)<\/f>/i);if(!fm)return'';
    const formula=xmlEntityDecode(fm[1]),match=formula.match(/\bHYPERLINK\s*\(\s*"((?:""|[^"])*)"/i);if(!match)return'';
    const url=match[1].replace(/""/g,'"').trim();return /^https?:\/\/[^\s]+$/i.test(url)?url:'';
  }
  function parseSheet(xml,shared,rels){
    const rows=[],refs=[],formulaLinks={};let maxCol=-1;
    for(const rm of String(xml||'').matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)){
      const row=[],rowRefs=[];for(const cm of rm[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/gi)){
        const attrs='<c '+(cm[1]||cm[3]||'')+'>',body=cm[2]||'',ref=attr(attrs,'r'),ci=colIndex(ref);if(ci<0)continue;row[ci]=cellValue(body,attrs,shared);rowRefs[ci]=ref;const formulaUrl=formulaHyperlinkUrl(body);if(ref&&formulaUrl)formulaLinks[ref]=formulaUrl;maxCol=Math.max(maxCol,ci);
      }rows.push(row);refs.push(rowRefs);
    }
    const hyperlinks={};for(const hm of String(xml||'').matchAll(/<hyperlink\b[^>]*\/?>(?:<\/hyperlink>)?/gi)){const tag=hm[0],ref=attr(tag,'ref'),rid=attr(tag,'r:id'),location=attr(tag,'location');if(!ref)continue;const target=rid&&rels[rid]?rels[rid].target:location;if(target)hyperlinks[ref]=target}
    for(const [ref,url] of Object.entries(formulaLinks))if(!hyperlinks[ref])hyperlinks[ref]=url;
    return{rows,refs,hyperlinks,maxCol};
  }

  function parseXlsxEntries(files){
    const workbookXml=utf8(files['xl/workbook.xml']||new Uint8Array()),wbRelsXml=utf8(files['xl/_rels/workbook.xml.rels']||new Uint8Array()),wbRels=parseRelationships(wbRelsXml,'xl');
    if(!workbookXml)throw new Error('XLSX inválido: falta xl/workbook.xml.');
    const shared=files['xl/sharedStrings.xml']?parseSharedStrings(utf8(files['xl/sharedStrings.xml'])):[];const sheets=[];
    for(const sm of workbookXml.matchAll(/<sheet\b[^>]*\/>/gi)){
      const tag=sm[0],name=attr(tag,'name'),rid=attr(tag,'r:id'),rel=wbRels[rid];if(!rel||!files[rel.target])continue;const sheetPath=rel.target,sheetXml=utf8(files[sheetPath]);const slash=sheetPath.lastIndexOf('/'),base=sheetPath.slice(0,slash),fileName=sheetPath.slice(slash+1),relsPath=normalizePath(base+'/_rels/'+fileName+'.rels'),rels=parseRelationships(files[relsPath]?utf8(files[relsPath]):'',base),parsed=parseSheet(sheetXml,shared,rels);sheets.push({name,path:sheetPath,...parsed});
    }
    const linkIndex={};for(const sheet of sheets){for(let r=0;r<sheet.rows.length;r++){for(let c=0;c<sheet.rows[r].length;c++){const ref=sheet.refs[r]?.[c],url=ref&&sheet.hyperlinks[ref],value=sheet.rows[r]?.[c];if(url&&value!==''&&value!=null){const k=normalizeText(value);if(k&&!linkIndex[k])linkIndex[k]=url}}}}
    return{sheets,linkIndex};
  }
  function parseXlsx(buffer,inflateRaw){return parseXlsxEntries(unzipEntries(buffer,inflateRaw))}

  function detectCsvDelimiter(text){
    const s=String(text??'');let q=false,counts={',':0,';':0,'\t':0},seenContent=false;for(let i=0;i<s.length;i++){const ch=s[i];if(q){if(ch==='"'&&s[i+1]==='"')i++;else if(ch==='"')q=false;continue}if(ch==='"'){q=true;continue}if(ch==='\n'&&seenContent)break;if(ch==='\r')continue;if(ch.trim())seenContent=true;if(Object.prototype.hasOwnProperty.call(counts,ch))counts[ch]++}const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);return ranked[0][1]>0?ranked[0][0]:',';
  }
  function parseCsv(text){
    const s=String(text??''),delimiter=detectCsvDelimiter(s),rows=[];let row=[],field='',q=false;for(let i=0;i<s.length;i++){const ch=s[i];if(q){if(ch==='"'&&s[i+1]==='"'){field+='"';i++}else if(ch==='"')q=false;else field+=ch}else if(ch==='"')q=true;else if(ch===delimiter){row.push(field);field=''}else if(ch==='\n'){row.push(field.replace(/\r$/,''));if(row.some(v=>v!==''))rows.push(row);row=[];field=''}else field+=ch}row.push(field.replace(/\r$/,''));if(row.some(v=>v!==''))rows.push(row);return{rows,delimiter};
  }

  function normalizeText(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function normalizeStreetLevel(v){const raw=String(v??'').trim();if(/^-1(?:[.,]0+)?$/.test(raw))return'Bajo nivel';if(/^\+?1(?:[.,]0+)?$/.test(raw))return'Sobre nivel';if(/^0(?:[.,]0+)?$/.test(raw))return'A nivel';const n=normalizeText(raw);if(n.includes('bajo nivel')||n==='bajo')return'Bajo nivel';if(n.includes('sobre nivel')||n==='sobre')return'Sobre nivel';if(n==='a nivel'||n==='nivel')return'A nivel';return raw}
  const ALIASES={
    fecha:['fecha','fecha de declaracion','fecha declaracion','fecha inicio','fecha de inicio'],
    tramite:['numero de tramite','n de tramite','de tramite','tramite','tramites t d','presentacion'],
    folio:['numero de folio','folio','folios'],
    finca:['finca','numero de finca'],
    plano:['plano catastrado','plano','numero de plano'],
    derecho:['derecho','derechos'],
    id:['id','codigo','n'],
    idDerecho:['id derecho 001','id derecho'],
    area:['area segun registro','area registro','area'],
    propietario:['propietario registral','propietario','nombre igual al siim','nombres t d','nombre'],
    identificacion:['identificacion','cedula','identificacion propietario'],
    tipo:['tipo de tramite','tipo tramite','modelo'],
    observaciones:['observaciones','observacion'],
    provincia:['provincia'],canton:['canton'],distrito:['distrito'],
    lugar:['localidad','poblado','lugar'],direccion:['direccion exacta','direccion','direccion finca'],
    enlace:['enlace','url','link','vinculo']
  };
  const ALIAS_LOOKUP=(()=>{const m={};for(const [k,vals] of Object.entries(ALIASES))for(const v of vals)m[normalizeText(v)]=k;return m})();
  function canonicalHeader(v){const n=normalizeText(v);return ALIAS_LOOKUP[n]||''}
  const WEIGHT={tramite:10,folio:10,finca:7,plano:7,derecho:6,distrito:6,lugar:5,propietario:5,identificacion:5,fecha:3,id:3,idDerecho:2,observaciones:2,provincia:2,canton:2,direccion:2,area:2,tipo:1,enlace:1};
  function headerScore(row){const seen=new Set();let score=0;for(const v of row||[]){const k=canonicalHeader(v);if(k&&!seen.has(k)){seen.add(k);score+=WEIGHT[k]||1}}if(seen.has('tramite'))score+=8;if((seen.has('folio')||seen.has('finca'))&&seen.has('distrito'))score+=5;return{score,fields:seen}}
  function detectWorkbookLayout(workbook){
    let best=null;for(let si=0;si<(workbook?.sheets||[]).length;si++){const sh=workbook.sheets[si];for(let ri=0;ri<Math.min(40,sh.rows.length);ri++){const hs=headerScore(sh.rows[ri]);if(hs.score<8)continue;const candidate={sheetName:sh.name,sheetIndex:si,headerRowIndex:ri,score:hs.score,fields:[...hs.fields]};if(!best||candidate.score>best.score||(candidate.score===best.score&&candidate.headerRowIndex<best.headerRowIndex))best=candidate}}
    if(!best)throw new Error('No se encontró una hoja con encabezados reconocibles de expedientes.');return best;
  }
  const display=v=>{if(v==null)return'';if(typeof v==='boolean')return v?'Sí':'No';return String(v).trim()};
  const cleanPlaceholder=v=>{const s=display(v);return /^(?:—|–|-|n\/?a|na|s\/?d|sin dato)$/i.test(s)?'':s};
  const firstNonEmpty=arr=>{for(const v of arr||[]){const s=cleanPlaceholder(v);if(s)return s}return''};
  const lastNonEmpty=arr=>{for(let i=(arr||[]).length-1;i>=0;i--){const s=cleanPlaceholder(arr[i]);if(s)return s}return''};
  function excelSerialToDate(value){const n=Number(value);if(!Number.isFinite(n))return cleanPlaceholder(value);const ms=Date.UTC(1899,11,30)+Math.round(n*86400000);return new Date(ms).toISOString().slice(0,10)}
  const validHttpUrl=v=>{const s=cleanPlaceholder(v);return /^https?:\/\/[^\s]+$/i.test(s)?s:''};
  function mapRowsToRecords(rows,headerRowIndex=0,options={}){
    const header=rows[headerRowIndex]||[],columns={};header.forEach((h,i)=>{const key=canonicalHeader(h);if(key)(columns[key]||(columns[key]=[])).push(i)});const getVals=(row,k)=>(columns[k]||[]).map(i=>row?.[i]);const get=(row,k)=>firstNonEmpty(getVals(row,k));const records=[];
    const linkIndex=options.linkIndex||{},refs=options.refs||[],hyperlinks=options.hyperlinks||{};
    for(let ri=headerRowIndex+1;ri<rows.length;ri++){
      const row=rows[ri]||[];const fincaVals=getVals(row,'finca'),sourceId=get(row,'id'),explicitLink=validHttpUrl(get(row,'enlace'));let linkFromCell='';
      for(const key of ['enlace','id'])for(const ci of columns[key]||[]){const ref=refs[ri]?.[ci];if(ref&&hyperlinks[ref]){linkFromCell=hyperlinks[ref];break}if(linkFromCell)break}
      const sourceUrl=explicitLink||linkFromCell||linkIndex[normalizeText(sourceId)]||'';
      const explicitFolio=get(row,'folio'),finca=lastNonEmpty(fincaVals),folio=explicitFolio||firstNonEmpty(fincaVals),tramite=get(row,'tramite'),plano=get(row,'plano'),derecho=get(row,'derecho'),idDerecho=get(row,'idDerecho'),identificacion=get(row,'identificacion'),propietario=get(row,'propietario');
      const strong=[folio,finca,plano,tramite,sourceId].some(Boolean)||(identificacion&&propietario);if(!strong)continue;
      const rawDate=(columns.fecha||[]).length?row[columns.fecha[0]]:'';const fecha=typeof rawDate==='number'?excelSerialToDate(rawDate):cleanPlaceholder(rawDate);
      const knownCols=new Set(Object.values(columns).flat()),extra={};header.forEach((h,ci)=>{if(knownCols.has(ci))return;const v=cleanPlaceholder(row[ci]);if(v)extra[display(h)||`Columna ${ci+1}`]=v});
      records.push({
        general:{folio,finca,tramite,plano,derecho,idDerecho,propietario,identificacion,areaRegistro:get(row,'area'),tipoTramite:get(row,'tipo'),observaciones:get(row,'observaciones'),provincia:get(row,'provincia'),canton:get(row,'canton'),distrito:get(row,'distrito'),lugar:get(row,'lugar'),direccionFinca:get(row,'direccion'),fechaDeclaracion:fecha,sourceId,sourceUrl},
        importMeta:{sheetName:options.sheetName||'',sourceRow:ri+1,extra}
      });
    }return records;
  }
  function importRecordsFromWorkbook(workbook){const layout=detectWorkbookLayout(workbook),sheet=workbook.sheets[layout.sheetIndex],records=mapRowsToRecords(sheet.rows,layout.headerRowIndex,{sheetName:sheet.name,linkIndex:workbook.linkIndex,refs:sheet.refs,hyperlinks:sheet.hyperlinks});return{layout,records,warnings:[]}}
  const normKey=v=>normalizeText(v).replace(/\s+/g,'');
  function canonicalIdentityKey(record){const g=record?.general||record||{},folio=normKey(g.folio),finca=normKey(g.finca),plano=normKey(g.plano),derecho=normKey(g.derecho||g.right),id=normKey(g.sourceId),tramite=normKey(g.tramite),base=folio||finca;if(base)return`F:${base}`;if(tramite)return`T:${tramite}|P:${plano}|D:${derecho}`;if(plano||derecho)return`NO-T|P:${plano}|D:${derecho}`;if(id)return`NO-T|ID:${id}`;return''}
  function mergeNonEmpty(a,b){if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&a.length?a:b;if(a&&typeof a==='object'&&b&&typeof b==='object'){const out={...a};for(const [k,v] of Object.entries(b))out[k]=mergeNonEmpty(out[k],v);return out}return cleanPlaceholder(a)!==''?a:b}
  function dedupeImportedRecords(records){const out=[],byKey=new Map();for(const r of records||[]){const k=canonicalIdentityKey(r);if(!k){out.push(r);continue}if(byKey.has(k)){const idx=byKey.get(k);out[idx]=mergeNonEmpty(out[idx],r)}else{byKey.set(k,out.length);out.push(r)}}return out}

  return{parseXlsx,parseXlsxEntries,parseCsv,normalizeText,normalizeStreetLevel,canonicalHeader,detectWorkbookLayout,mapRowsToRecords,importRecordsFromWorkbook,canonicalIdentityKey,dedupeImportedRecords,excelSerialToDate,unzipEntries};
});
