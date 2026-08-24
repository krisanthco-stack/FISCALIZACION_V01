import re, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

class PdfLayoutStressRegression(unittest.TestCase):
    def test_rectification_signature_is_inside_table(self):
        start=HTML.index('function rectificationPreviewHtml')
        end=HTML.index('function showRectificationPreview',start)
        block=HTML[start:end]
        self.assertIn('rectification-signature-table',block)
        self.assertIn('rectification-signature-cell',block)
        self.assertNotIn('<div class="sign">',block)

    def test_rectification_tables_wrap_and_rows_avoid_splitting(self):
        start=HTML.index('function rectificationPreviewHtml')
        end=HTML.index('function showRectificationPreview',start)
        block=HTML[start:end]
        self.assertIn('table-layout:fixed',block)
        self.assertIn('overflow-wrap:anywhere',block)
        self.assertIn('break-inside:avoid',block)


    def test_rectification_rejection_block_moves_as_unit(self):
        start=HTML.index('function rectificationPreviewHtml')
        end=HTML.index('function showRectificationPreview',start)
        block=HTML[start:end]
        self.assertIn('rectification-rejection-block',block)
        self.assertRegex(block,r'\.rectification-rejection-block\{[^}]*break-inside:avoid-page')

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
