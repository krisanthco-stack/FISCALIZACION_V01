const fs=require('fs');
const path=require('path');
const JSZip=require('../app/assets/jszip.min.js');
global.window=global;
require('../app/assets/templates.js');

const fiscalKeys=['EXPEDIENTE','FECHA_DECLARACION','OBSERVACIONES','NUMERO_FINCA','NUMERO_PLANO','PROPIETARIO_NOMBRE','PROPIETARIO_ID','AREA_REGISTRO','ORIGEN_DATO','TIPO_TRAMITE','USO_OBSERVADO','COORD_ESTE','COORD_NORTE','SISTEMA_COORD','FECHA_TOMA','TOPOGRAFIA','PENDIENTE','NIVEL_VIA','DIF_NIVEL','TIPO_ACCESO','SUPERFICIE','SERVICIOS_1','SERVICIOS_2','CAUCE','CODIGO_VIA','OBS_TECNICA','TIPO_CONSTRUCCION','MEDIDA_REGISTRADA','PISOS','EDAD','ESTADO_GENERAL','PAREDES','TECHO','ESTRUCTURA_TECHO','CIELO_RASO','PISO','INST_ELECTRICA','DETALLES_CONSTR','AREA_CONSTRUIDA','PERIMETRO','CANT_DECLARADA','CANT_CONSTRUCCIONES','FOTO_DESCRIPCION','FOTO_FECHA','FUNCIONARIO_CAMPO','PUESTO_CAMPO','FECHA_HORA_CAMPO','RES_TERRENO','RES_CONSTRUCCIONES','RES_AGRO','RESULTADO','EFECTO','MOTIVACION_TECNICA','FUNDAMENTO_LEGAL','FUNCIONARIO_RESOLUCION','PUESTO_RESOLUCION','FECHA_HORA_RESOLUCION'];
const rectKeys=['OFICIO','FECHA_OFICIO','NOMBRE','CEDULA','DIRECCION_FISCAL','PROVINCIA','CANTON','DISTRITO','CELULAR','TELEFONO','CORREO','REP_LEGAL','REP_CEDULA','REP_CEL','FAX','OTRO_TEL','ZONA','DBI','FINCA','DERECHO','PLANO','DIST_FINCA','DIRECCION_FINCA','OBJETO_1','MOTIVO_1','OBJETO_2','MOTIVO_2'];
function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
async function build(kind, keys, sentinel){
  const zip=await JSZip.loadAsync(APP_TEMPLATES[kind],{base64:true});
  for(const n of Object.keys(zip.files).filter(n=>n.endsWith('.xml'))){
    let s=await zip.file(n).async('string');
    for(const k of keys)s=s.split(`«${k}»`).join(esc(k===keys[0]?sentinel:`VAL_${k}`));
    if(/«[^»]+»/.test(s)) throw new Error(`${kind}: token remained in ${n}: ${s.match(/«[^»]+»/)[0]}`);
    zip.file(n,s);
  }
  const buf=await zip.generateAsync({type:'nodebuffer'});
  const reread=await JSZip.loadAsync(buf);
  let all='';
  for(const n of Object.keys(reread.files).filter(n=>n.endsWith('.xml'))) all+=await reread.file(n).async('string');
  if(!all.includes(sentinel)) throw new Error(`${kind}: sentinel missing`);
  if(/«[^»]+»/.test(all)) throw new Error(`${kind}: token remained after generation`);
  return buf.length;
}
(async()=>{
  const a=await build('fiscalizacion',fiscalKeys,'TEST-EXP-001');
  const b=await build('rectificacion',rectKeys,'MS-DFBI-RD-99-2026');
  if(a<10000||b<10000) throw new Error('Generated DOCX unexpectedly small');
  console.log(JSON.stringify({ok:true,fiscal_bytes:a,rect_bytes:b}));
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
