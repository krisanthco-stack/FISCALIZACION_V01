import base64, re, unittest, zipfile, io, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

class BaselineRegression(unittest.TestCase):
    def test_v27_horizontal_navigation_preserved(self):
        self.assertIn('id="l26-v27-final-ui"', HTML)
        self.assertRegex(HTML, r'#desktopNav\{[^}]*display:flex!important')
        self.assertRegex(HTML, r'#desktopNav \.nav-btn\{[^}]*width:auto!important')
        labels=re.findall(r'<a class="nav-btn(?: active)?"[^>]*data-target="[^"]+"[^>]*>.*?</span>\s*([^<]+)</a>',HTML,re.S)
        self.assertEqual([x.strip() for x in labels[:8]],[
            'Trámites de Fiscalización','Información General','Terreno y entorno','Construcciones','Fotografías','Fiscalización','Informes','Gestión'])

    def test_v27_accordion_features_preserved(self):
        for token in ['details.module-accordion','details.inline-accordion','persistent-selection-accordion','district-accordion-summary','place-accordion-summary','enforceExclusiveAccordion','refreshPersistentAccordionSummaries']:
            self.assertIn(token,HTML)

    def test_management_and_json_features_preserved(self):
        for token in ['id="view-management"','id="managementPackageExportBtn"','id="managementPackageImport"','id="expedientePackageImport"','importJsonCases','exportCasePackage']:
            self.assertIn(token,HTML)

    def test_existing_report_output_preserved(self):
        for token in ['id="previewBtn"','id="pdfBtn"','id="wordBtn"','id="excelBtn"','makeDocx(state.current)']:
            self.assertIn(token,HTML)

    def test_html_ids_are_unique(self):
        ids=re.findall(r'\bid=[\"\']([^\"\']+)[\"\']',HTML)
        self.assertEqual(len(ids),len(set(ids)))

    def test_navigation_targets_still_resolve_to_v27_views(self):
        targets=re.findall(r'<a class=\"nav-btn(?: active)?\"[^>]*data-target=\"([^\"]+)\"',HTML)[:8]
        self.assertEqual(targets,['database','general','terrain','construction','photos','fiscalization','report','management'])
        for target in targets:self.assertIn(f'id=\"view-{target}\"',HTML)

class RectificationFeature(unittest.TestCase):
    def test_second_output_ui_exists(self):
        for token in ['id="rectificationOutput"','id="rectificationOfficeNumber"','id="rectificationDocxBtn"','id="rectificationPreviewBtn"','id="rectificationPrintBtn"']:
            self.assertIn(token,HTML)

    def test_rectification_data_model_exists(self):
        self.assertIn('rectification:{',HTML)
        self.assertIn('base.report.rectification',HTML)

    def test_rectification_generator_uses_official_template(self):
        self.assertIn('RECTIFICATION_TEMPLATE_BASE64',HTML)
        self.assertIn('makeRectificationDocx',HTML)
        self.assertIn("const RECTIFICATION_TEMPLATE_NAME='MS-FBI-RD-01-2026_RECTIFICACION_FINAL.docx'",HTML)
        self.assertIn('wordSetCellText',HTML)
        self.assertIn('wordReplaceExact',HTML)

    def test_embedded_template_is_valid_official_structure_for_direct_cell_filling(self):
        m=re.search(r"const RECTIFICATION_TEMPLATE_BASE64='([^']+)'",HTML)
        self.assertIsNotNone(m)
        raw=base64.b64decode(m.group(1))
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            self.assertIn('word/document.xml',z.namelist())
            self.assertIn('word/header1.xml',z.namelist())
            self.assertIn(b'<w:tbl',z.read('word/document.xml'))
        self.assertIn('wordSetCellText',HTML)
        self.assertIn('wordReplaceExact',HTML)


    def test_embedded_template_preserves_official_assets(self):
        from hashlib import sha256
        final=ROOT/'templates/MS-FBI-RD-01-2026_RECTIFICACION_FINAL.docx'
        m=re.search(r"const RECTIFICATION_TEMPLATE_BASE64='([^']+)'",HTML)
        raw=base64.b64decode(m.group(1))
        with zipfile.ZipFile(final) as a, zipfile.ZipFile(io.BytesIO(raw)) as b:
            self.assertEqual(set(a.namelist()),set(b.namelist()))
            for name in a.namelist():
                if name in {'word/document.xml','word/header1.xml'}: continue
                self.assertEqual(sha256(a.read(name)).hexdigest(),sha256(b.read(name)).hexdigest(),name)
            self.assertIn(b'<w:drawing',b.read('word/header1.xml'))

    def test_no_old_productos_de_salida_label(self):
        self.assertNotIn('>Productos de salida<',HTML)


class FiscalReportMachoteRegression(unittest.TestCase):
    def _func(self,name,next_name):
        start=HTML.index(f'async function {name}')
        end=HTML.index(f'async function {next_name}',start)
        return HTML[start:end]

    def test_preview_uses_final_fiscal_report_machote_labels(self):
        block=self._func('buildReportHtml','refreshInlineReportPreview')
        for token in [
            'INFORME TÉCNICO DE INSPECCIÓN.',
            'FECHA DE DECLARACIÓN',
            'FISCALIZACIÓN DECLARACIONES',
            'RESULTADO DEL ANÁLISIS TÉCNICO',
            'JUSTIFICACIÓN',
            'RESPONSABLE DE LA RESOLUCIÓN ADMINISTRATIVA'
        ]:
            self.assertIn(token,block)
        for old in ['INFORME TÉCNICO DE INSPECCIÓN DE BIENES INMUEBLES','FOLIO / FINCA','FECHA DE INSPECCIÓN','INICIO DE CAPTURA','DECISIÓN ADMINISTRATIVA']:
            self.assertNotIn(old,block)


    def test_service_worker_cache_bumped_for_report_change(self):
        sw=(ROOT/'sw.js').read_text(encoding='utf-8')
        self.assertRegex(sw,r"fiscalizacion-bi-l26-manual-202608\d{2}")
        self.assertIn("event.data==='SKIP_WAITING'",sw)
        self.assertNotIn('.then(()=>self.skipWaiting())',sw)
        self.assertRegex(HTML,r"const APP_VERSION='27\.3\.\d+-FINAL'")

    def test_docx_uses_final_fiscal_report_machote_labels(self):
        start=HTML.index('async function makeDocx(c)')
        end=HTML.index("$('#wordBtn').addEventListener",start)
        block=HTML[start:end]
        for token in [
            'INFORME TÉCNICO DE INSPECCIÓN.',
            'FECHA DE DECLARACIÓN',
            'FISCALIZACIÓN DECLARACIONES',
            'RESULTADO DEL ANÁLISIS TÉCNICO',
            'JUSTIFICACIÓN',
            'RESPONSABLE DE LA RESOLUCIÓN ADMINISTRATIVA'
        ]:
            self.assertIn(token,block)
        for old in ['INFORME TÉCNICO DE INSPECCIÓN DE BIENES INMUEBLES','FOLIO / FINCA','FECHA DE INSPECCIÓN','INICIO DE CAPTURA','DECISIÓN ADMINISTRATIVA']:
            self.assertNotIn(old,block)

if __name__=='__main__': unittest.main(verbosity=2)
