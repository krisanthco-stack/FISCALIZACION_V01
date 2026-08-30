from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MAIN=(ROOT/'desktop/main.js').read_text(encoding='utf-8')
PRELOAD=(ROOT/'desktop/reader-preload.js').read_text(encoding='utf-8')
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

def test_reader_area_is_rectangle_mode_not_text_selection_only():
    assert "readerReadArea: 'read-area'" in PRELOAD
    assert "command === 'read-area'" in MAIN
    assert 'capturePage' in MAIN
    assert 'TreeWalker' in MAIN
    assert "getSelection?.().toString()" not in MAIN

def test_main_app_has_no_duplicate_read_link_button():
    assert 'id="readCaseSourceBtn"' not in HTML
    assert "read.textContent='📖 Leer'" not in HTML
    assert 'id="openCaseSourceBtn"' in HTML
