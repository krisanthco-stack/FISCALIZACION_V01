#!/usr/bin/env python3
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
import shutil, tempfile

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'templates/final/Informe_Fiscalizacion_V01_MACHOTE_FINAL.docx'
DST=ROOT/'templates/parametrized/Informe_Fiscalizacion_APLICACION_V1.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
# index -> (expected original, replacement)
MAP={
7:('Expediente: 0','Expediente: «EXPEDIENTE»'),12:('0','«EXPEDIENTE»'),15:('2026-08-22','«FECHA_DECLARACION»'),17:('0','«OBSERVACIONES»'),
20:('Sin datos','«NUMERO_FINCA»'),22:('Sin datos','«NUMERO_PLANO»'),24:('Sin datos','«PROPIETARIO_NOMBRE»'),26:('Sin datos','«PROPIETARIO_ID»'),28:('Sin datos','«AREA_REGISTRO»'),30:('Dato registral','«ORIGEN_DATO»'),32:('Sin datos','«TIPO_TRAMITE»'),34:('Sin datos','«USO_OBSERVADO»'),
37:('498551.898','«COORD_ESTE»'),39:('1155456.359','«COORD_NORTE»'),41:('CR-SIRGAS / CRTM05','«SISTEMA_COORD»'),43:('21/8/2026','«FECHA_TOMA»'),
46:('Ondulada','«TOPOGRAFIA»'),48:('0 %','«PENDIENTE»'),50:('Sin datos','«NIVEL_VIA»'),52:('Sin datos','«DIF_NIVEL»'),54:('Público','«TIPO_ACCESO»'),56:('Asfalto','«SUPERFICIE»'),58:('1 — Sin acera; sin cordón y caño','«SERVICIOS_1»'),60:('14 — Alumbrado + electricidad + cañería','«SERVICIOS_2»'),62:('Sí','«CAUCE»'),64:('1 — Mayor desarrollo comercial; cualquier material; tránsito vial o peatonal denso','«CODIGO_VIA»'),65:('Observación técnica: 0','Observación técnica: «OBS_TECNICA»'),
69:('Viviendas de concreto','«TIPO_CONSTRUCCION»'),71:('4.00 m²','«MEDIDA_REGISTRADA»'),73:('1','«PISOS»'),75:('0 años','«EDAD»'),77:('2 — Muy Bueno (MB)','«ESTADO_GENERAL»'),79:('No aplica','«PAREDES»'),81:('Lámina de hierro galvanizado / zinc','«TECHO»'),83:('Otro','«ESTRUCTURA_TECHO»'),85:('Fibrocemento','«CIELO_RASO»'),87:('Sin piso','«PISO»'),89:('Especializada','«INST_ELECTRICA»'),91:('0','«DETALLES_CONSTR»'),
93:('Área total: 4.00 m² · Perímetro de control: 8.00 m','Área total: «AREA_CONSTRUIDA» m² · Perímetro de control: «PERIMETRO» m'),96:('1','«CANT_DECLARADA»'),98:('1','«CANT_CONSTRUCCIONES»'),99:('construcción · 4.00 m²','construcción · «AREA_CONSTRUIDA» m²'),101:('FOTOGRAFÍA 1. VIVIENDA CONCRETO · FACHADA PRINCIPAL · 21/8/2026, 11:04:25 P. M.','FOTOGRAFÍA 1. «FOTO_DESCRIPCION» · «FOTO_FECHA»'),
104:('4','«FUNCIONARIO_CAMPO»'),106:('Encargado(a) del Departamento de Catastro y Valoración','«PUESTO_CAMPO»'),108:('2026-08-22 · 23:02','«FECHA_HORA_CAMPO»'),
116:('Expediente: 0','Expediente: «EXPEDIENTE»'),120:('Los parámetros verificados del terreno guardan conformidad con la información consignada en la declaración presentada.','«RES_TERRENO»'),122:('Las características y mediciones verificadas de las construcciones guardan conformidad con la información consignada en la declaración presentada.','«RES_CONSTRUCCIONES»'),124:('Pendiente de completar los criterios del uso agropecuario.','«RES_AGRO»'),127:('PENDIENTE','«RESULTADO»'),129:('Complete los criterios aplicables del formulario para determinar el resultado.','«EFECTO»'),132:('Complete las verificaciones aplicables para generar automáticamente el resultado de la fiscalización.','«MOTIVACION_TECNICA»'),134:('La resolución se emite con fundamento en la Ley N.° 7509, su Reglamento y las demás disposiciones aplicables al procedimiento de fiscalización, junto con los antecedentes técnicos incorporados al expediente.','«FUNDAMENTO_LEGAL»'),137:('1','«FUNCIONARIO_RESOLUCION»'),139:('Encargado(a) del Departamento de Catastro y Valoración','«PUESTO_RESOLUCION»'),141:('2026-08-22 · 23:02','«FECHA_HORA_RESOLUCION»')
}

def main():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td)
        with ZipFile(SRC) as zin:
            zin.extractall(td)
        doc=td/'word/document.xml'
        root=etree.fromstring(doc.read_bytes())
        texts=root.xpath('//w:t',namespaces=NS)
        for idx,(expected,replacement) in MAP.items():
            got=texts[idx].text or ''
            if got != expected:
                raise SystemExit(f'Master changed at w:t[{idx}]: expected {expected!r}, got {got!r}')
            texts[idx].text=replacement
        doc.write_bytes(etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone='yes'))

        # Replace the example croquis image with a neutral control placeholder.
        # The browser app replaces this image with the case croquis when the user selects one.
        from PIL import Image, ImageDraw, ImageFont
        media=td/'word/media/image2.png'
        im=Image.new('RGB',(1100,520),'#f1f4f2')
        dr=ImageDraw.Draw(im)
        dr.rectangle((35,35,1065,485),outline='#9bad9f',width=4)
        try:
            font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',36)
            small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',24)
        except Exception:
            font=small=None
        title='CROQUIS REGISTRADO EN EL EXPEDIENTE'
        sub='Vista de control del formato Word · sustituido al generar si se adjunta croquis'
        box=dr.textbbox((0,0),title,font=font); tw=box[2]-box[0]
        dr.text(((1100-tw)/2,210),title,fill='#385548',font=font)
        box=dr.textbbox((0,0),sub,font=small); sw=box[2]-box[0]
        dr.text(((1100-sw)/2,270),sub,fill='#64756c',font=small)
        im.save(media,'PNG')
        DST.parent.mkdir(parents=True, exist_ok=True)
        with ZipFile(DST,'w',ZIP_DEFLATED) as zout:
            for p in td.rglob('*'):
                if p.is_file(): zout.write(p,p.relative_to(td))
    print(DST)
if __name__=='__main__': main()
