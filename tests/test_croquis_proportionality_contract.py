from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')


def test_croquis_reprojects_finalized_polygons_with_one_common_metric_scale():
    assert 'function applyCommonMetricScale' in HTML
    assert 'projectMetricPolygonsCommonScale' in HTML
    assert "applyCommonMetricScale(sketch,canvas)" in HTML


def test_croquis_uses_fixed_corner_legend_instead_of_labels_attached_to_polygons():
    assert 'polygonLegendLayout' in HTML
    assert 'function croquisDrawingRect' in HTML
    assert "legend.items.forEach" in HTML
    draw=HTML.split('function drawCompoundSketch',1)[1].split('function manualSketchHtml',1)[0]
    assert 'polygonLabelAnchor' not in draw


def test_pointer_mapping_uses_same_reserved_drawing_rect_as_canvas_renderer():
    bind=HTML.split('function bindManualSketch',1)[1].split('function bindConstructionSketch',1)[0]
    assert 'croquisDrawingRect(canvas,sketch,linear)' in bind


def test_service_worker_cache_is_bumped_for_proportional_croquis_assets():
    sw=(ROOT/'sw.js').read_text(encoding='utf-8')
    assert 'croquis-proportional-v1' in sw


def test_common_scale_uses_actual_canvas_drawing_dimensions():
    assert 'width:view.width,height:view.height' in HTML
    bind=HTML.split('function bindManualSketch',1)[1].split('function bindConstructionSketch',1)[0]
    assert 'applyCommonMetricScale(sketch,canvas)' in bind
