import re, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

class PdfLayoutStressRegression(unittest.TestCase):
    def _rect(self):
        start=HTML.index('function rectificationPreviewHtml')
        end=HTML.index('function showRectificationPreview',start)
        return HTML[start:end]

    def test_rectification_uses_fixed_official_letter_page(self):
        block=self._rect()
        self.assertIn('.rect-original-page{position:relative;width:215.9mm;height:279.4mm',block)
        self.assertIn('overflow:hidden',block)
        self.assertIn('background:#fff url(${RECTIFICATION_BLANK_PAGE_DATA})',block)

    def test_rectification_fields_wrap_inside_fixed_positions(self):
        block=self._rect()
        self.assertIn('overflow-wrap:anywhere',block)
        self.assertIn('.rf{position:absolute',block)
        self.assertIn('data-pdf-editable="true"',block)

    def test_rectification_signature_entries_stay_on_same_official_page(self):
        block=self._rect()
        for token in ['perito-entry','notifier-entry','notifier-signature-entry','recipient-signature-entry']:
            self.assertIn(token,block)
        self.assertIn('@page{size:Letter;margin:0}',block)

    def test_resolution_signature_block_moves_as_unit(self):
        start=HTML.index('async function buildReportHtml')
        end=HTML.index('async function refreshInlineReportPreview',start)
        block=HTML[start:end]
        self.assertIn('resolution-responsible-table',block)
        self.assertIn('resolution-signature-cell',block)
        self.assertNotIn('<div class="resolution-responsible">',block)
        self.assertRegex(block,r'\.resolution-responsible-table\{[^}]*break-inside:avoid-page')
        self.assertRegex(block,r'th,td\{[^}]*overflow-wrap:anywhere')

if __name__=='__main__': unittest.main(verbosity=2)
