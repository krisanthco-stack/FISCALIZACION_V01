from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SW=(ROOT/'sw.js').read_text(encoding='utf-8')

def test_year_filter_is_visible_in_fiscalizacion_and_gestion():
    assert 'id="baseLocalYearFilter"' in HTML
    assert 'id="managementYearFilter"' in HTML
    assert HTML.index('baseLocalYearFilter') < HTML.index('baseLocalDistrictFilter') < HTML.index('baseLocalPlaceFilter')
    assert HTML.index('managementYearFilter') < HTML.index('managementDistrictFilter') < HTML.index('managementPlaceFilter')
    assert 'Todos los años' in HTML

def test_year_filter_is_chained_into_district_and_place_filters():
    assert "baseLocalFilterState={query:'',year:''" in HTML
    assert "managementFilterState={query:'',year:''" in HTML
    assert 'L26FilterCore.filterByYear(cases,baseLocalFilterState.year)' in HTML
    assert 'L26FilterCore.filterByYear(cases,managementFilterState.year)' in HTML
    assert "baseLocalFilterState.year=event.target.value" in HTML
    assert "managementFilterState.year=e.target.value" in HTML

def test_year_filter_core_is_offline_cached():
    assert 'app/assets/l26_filter_core.js' in HTML
    assert './app/assets/l26_filter_core.js' in SW
