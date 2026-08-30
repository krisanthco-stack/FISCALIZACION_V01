from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

def test_process_geoname_matching_no_longer_uses_generic_edit_distance():
    m=re.search(r'function processGeoNamesMatch\(a,b\)\{([^\n]+)\}',HTML)
    assert m, 'processGeoNamesMatch missing'
    body=m.group(1)
    assert 'placeNameDistance' not in body
    assert 'a===b' in body

def test_explicit_hoquetas_alias_is_preserved():
    assert "hoquetas:'horquetas'" in HTML
