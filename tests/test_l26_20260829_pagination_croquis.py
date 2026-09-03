from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')


def function_block(name,next_name=None,limit=18000):
    starts=[HTML.find(f'function {name}'),HTML.find(f'async function {name}')]
    starts=[x for x in starts if x>=0]
    assert starts, f'No existe {name}'
    start=min(starts)
    if next_name:
        ends=[HTML.find(f'function {next_name}',start+1),HTML.find(f'async function {next_name}',start+1)]
        ends=[x for x in ends if x>=0]
        if ends:
            return HTML[start:min(ends)]
    return HTML[start:start+limit]


def test_pagination_is_25_in_process_and_management():
    assert 'const HIERARCHY_PAGE_SIZE=25' in HTML
    process=function_block('renderCaseHierarchy','managementInspectionCompleted')
    management=function_block('renderManagementList','normalizeBaseLocalFilterText',limit=30000)
    assert 'Math.ceil(pg.cases.length/HIERARCHY_PAGE_SIZE)' in process
    assert 'slice((page-1)*HIERARCHY_PAGE_SIZE,page*HIERARCHY_PAGE_SIZE)' in process
    assert 'absoluteIndex=(page-1)*HIERARCHY_PAGE_SIZE+index' in process
    assert 'Math.ceil(place.cases.length/HIERARCHY_PAGE_SIZE)' in management
    assert 'slice((page-1)*HIERARCHY_PAGE_SIZE,page*HIERARCHY_PAGE_SIZE)' in management
    # No deben quedar paginaciones jerárquicas a 10 en estos dos módulos.
    assert 'cases.length/10' not in process
    assert '*10,page*10' not in process
    assert 'cases.length/10' not in management
    assert '*10,page*10' not in management


def test_hierarchy_open_state_is_restored_after_pagination_rerender():
    assert 'const hierarchyOpenState={}' in HTML
    assert 'function hierarchyDistrictOpenKey' in HTML
    assert 'function hierarchyPlaceOpenKey' in HTML
    process=function_block('renderCaseHierarchy','managementInspectionCompleted')
    management=function_block('renderManagementList','normalizeBaseLocalFilterText',limit=30000)
    # El estado open se restaura antes de insertar cada details.
    assert 'section.open=Boolean(hierarchyOpenState[districtOpenKey])' in process
    assert 'place.open=Boolean(hierarchyOpenState[placeOpenKey])' in process
    assert 'd.open=Boolean(hierarchyOpenState[districtOpenKey])' in management
    assert 'p.open=Boolean(hierarchyOpenState[placeOpenKey])' in management
    # El usuario controla el estado mediante toggle; paginar no lo borra.
    assert 'dataset.hierarchyOpenKey' in HTML
    toggle=re.search(r"document\.addEventListener\('toggle'.*?\);",HTML,re.S)
    assert toggle and 'hierarchyOpenState' in toggle.group(0)
    pagination=function_block('renderPlacePagination','caseChronologyDate')
    assert 'hierarchyPageState[key]=p' in pagination
    assert 'hierarchyOpenState' not in pagination, 'Paginar no debe resetear el estado del acordeón'


def test_default_link_remains_protected_for_cases_without_source():
    assert "const DEFAULT_CASE_SOURCE_URL='https://metro.sarapiqui.go.cr/'" in HTML
    blank=function_block('blankCase','blankConstruction')
    normalize=function_block('normalizeCase','mergeCaseRecords')
    assert 'sourceLink:DEFAULT_CASE_SOURCE_URL' in blank
    assert 'DEFAULT_CASE_SOURCE_URL' in normalize


def test_croquis_manual_position_survives_recalculation_and_normalization():
    blank=function_block('blankPolygonSketch','blankManualSketch')
    normalize=function_block('normalizePolygonSketch','normalizeManualSketch')
    bind=function_block('bindManualSketch','bindConstructionSketch',limit=45000)
    assert 'manualPlacement:false' in blank
    assert 'manualPlacementCenter:null' in blank
    assert 'out.manualPlacement=Boolean(out.manualPlacement)' in normalize
    assert 'manualPlacementCenter' in normalize
    assert 'function adjustPolygonPreservingPlacement' in HTML
    helper=function_block('adjustPolygonPreservingPlacement','ensureDraftSides')
    assert 'adjustSketchToDistances(poly)' in helper
    assert 'translateWithinBounds' in helper
    assert 'manualPlacementCenter' in helper
    # Al soltar un polígono movido se fija su centro y se registra como colocación manual.
    assert 'poly.manualPlacement=true' in bind
    assert 'poly.manualPlacementCenter=core?.centroid?.(poly.points)' in bind
    # Finalizar usa el ajuste que preserva ubicación, no el ajuste directo que recentra.
    assert 'adjustPolygonPreservingPlacement(poly)' in bind


def test_release_is_bumped_for_manual_pwa_update():
    assert "const APP_VERSION='27.3.9'" in HTML
    sw=(ROOT/'sw.js').read_text(encoding='utf-8')
    assert 'release-27.3.9' in sw
