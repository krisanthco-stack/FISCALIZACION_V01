from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')


def test_process_and_management_use_compact_district_grid():
    assert 'id="caseList" aria-live="polite" class="case-list case-hierarchy compact-district-grid"' in HTML or 'class="case-list case-hierarchy compact-district-grid" id="caseList"' in HTML
    assert 'id="managementList" aria-live="polite" class="case-list case-hierarchy compact-district-grid"' in HTML or 'class="case-list case-hierarchy compact-district-grid" id="managementList"' in HTML


def test_compact_grid_fits_six_district_items_on_wide_screens():
    assert '.compact-district-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))' in HTML
    assert '.compact-district-grid>details.district-group[open]{grid-column:1/-1}' in HTML
    assert '@media(max-width:1100px)' in HTML and '.compact-district-grid{grid-template-columns:repeat(3,minmax(0,1fr))' in HTML
    assert '@media(max-width:600px)' in HTML and '.compact-district-grid{grid-template-columns:repeat(2,minmax(0,1fr))' in HTML


def test_district_summary_uses_compact_count_badge_in_both_lists():
    # The requested compact header shows the district name and a small numeric count only.
    assert 'class="district-count compact-count"' in HTML
    assert 'aria-label="${L26IntegrityCore.uniqueFolioCount(group.cases)} ${L26IntegrityCore.uniqueFolioCount(group.cases)===1?\'trámite\':\'trámites\'}"' in HTML
    assert 'aria-label="${L26IntegrityCore.uniqueFolioCount(district.cases)} ${L26IntegrityCore.uniqueFolioCount(district.cases)===1?\'trámite\':\'trámites\'}"' in HTML


def test_service_worker_cache_refreshes_compact_layout():
    sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
    assert 'compact-districts-v1' in sw
