'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../app/assets/l26_croquis_core.js');

test('factor de área solo admite normal, x2 y x1/2',()=>{
  assert.equal(core.normalizeFactor(2),2);
  assert.equal(core.normalizeFactor('2'),2);
  assert.equal(core.normalizeFactor(.5),.5);
  assert.equal(core.normalizeFactor('0.5'),.5);
  assert.equal(core.normalizeFactor(1),1);
  assert.equal(core.normalizeFactor('otro'),1);
  assert.equal(core.adjustedArea(36,2),72);
  assert.equal(core.adjustedArea(36,.5),18);
  assert.equal(core.adjustedArea(36,1),36);
});

test('rotar 90 grados conserva distancias entre vértices',()=>{
  const pts=[{x:.2,y:.3},{x:.8,y:.3},{x:.8,y:.7},{x:.2,y:.7}];
  const before=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);
  const out=core.rotate90(pts);
  const after=Math.hypot(out[1].x-out[0].x,out[1].y-out[0].y);
  assert.ok(Math.abs(before-after)<1e-12);
  assert.equal(out.length,4);
});

test('mover polígono conserva forma y lo mantiene dentro del lienzo',()=>{
  const pts=[{x:.1,y:.1},{x:.4,y:.1},{x:.4,y:.4},{x:.1,y:.4}];
  const out=core.translateWithinBounds(pts,.8,.8,{minX:.02,maxX:.98,minY:.05,maxY:.96});
  assert.ok(out.every(p=>p.x>=.02&&p.x<=.98&&p.y>=.05&&p.y<=.96));
  assert.ok(Math.abs((out[1].x-out[0].x)-.3)<1e-12);
  assert.ok(Math.abs((out[3].y-out[0].y)-.3)<1e-12);
});

test('cota usa offset normal y línea de dimensión separada del lado',()=>{
  const d=core.dimensionGeometry({x:100,y:100},{x:300,y:100},{x:200,y:200},900,520,24);
  assert.notEqual(d.a.y,100);
  assert.equal(d.a.y,d.b.y);
  assert.ok(Math.abs(d.a.y-100)>=23.9);
  assert.ok(d.label.x>=0&&d.label.x<=900&&d.label.y>=0&&d.label.y<=520);
});

test('etiqueta de polígono enlaza número y nombre y alterna esquina',()=>{
  assert.equal(core.numberedPolygonLabel(0,'Casa'),'1-Casa');
  assert.equal(core.numberedPolygonLabel(1,'Cochera'),'2-Cochera');
  const pts=[{x:100,y:100},{x:300,y:100},{x:300,y:250},{x:100,y:250}];
  const left=core.polygonLabelAnchor(pts,0,900,520);
  const right=core.polygonLabelAnchor(pts,1,900,520);
  assert.equal(left.align,'left');
  assert.equal(right.align,'right');
  assert.ok(left.x<right.x);
});

test('escala común conserva igual longitud visual para lados métricos iguales',()=>{
  const polygons=[
    {metricPoints:[{x:0,y:0},{x:2,y:0},{x:2,y:1},{x:0,y:1}],center:{x:.28,y:.55}},
    {metricPoints:[{x:0,y:0},{x:2,y:0},{x:2,y:3},{x:0,y:3}],center:{x:.70,y:.55}}
  ];
  const out=core.projectMetricPolygonsCommonScale(polygons,{minX:.04,maxX:.96,minY:.08,maxY:.94});
  const first=Math.hypot(out[0][1].x-out[0][0].x,out[0][1].y-out[0][0].y);
  const second=Math.hypot(out[1][1].x-out[1][0].x,out[1][1].y-out[1][0].y);
  assert.ok(Math.abs(first-second)<1e-12);
  assert.ok(out.flat().every(p=>p.x>=.04&&p.x<=.96&&p.y>=.08&&p.y<=.94));
});

test('escala común conserva el centro solicitado al mover un polígono cuando cabe',()=>{
  const polygons=[
    {metricPoints:[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}],center:{x:.25,y:.55}},
    {metricPoints:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],center:{x:.75,y:.55}}
  ];
  const out=core.projectMetricPolygonsCommonScale(polygons,{minX:.04,maxX:.96,minY:.08,maxY:.94});
  const c0=core.centroid(out[0]),c1=core.centroid(out[1]);
  assert.ok(Math.abs(c0.x-.25)<1e-12);
  assert.ok(Math.abs(c0.y-.55)<1e-12);
  assert.ok(Math.abs(c1.x-.75)<1e-12);
  assert.ok(Math.abs(c1.y-.55)<1e-12);
});

test('leyenda de polígonos usa una esquina fija independiente de la geometría',()=>{
  const a=core.polygonLegendLayout(['Unidad','Casa','Cochera'],900,520);
  const b=core.polygonLegendLayout(['Unidad','Casa','Cochera'],900,520);
  assert.deepEqual(a,b);
  assert.equal(a.corner,'top-right');
  assert.equal(a.items.length,3);
  assert.equal(a.items[0].label,'1 - Unidad');
  assert.equal(a.items[1].label,'2 - Casa');
  assert.ok(a.box.x>900/2);
});

test('escala métrica es isotrópica en un lienzo rectangular',()=>{
  const polygons=[
    {metricPoints:[{x:0,y:0},{x:2,y:0}],center:{x:.30,y:.55}},
    {metricPoints:[{x:0,y:0},{x:0,y:2}],center:{x:.70,y:.55}}
  ];
  const width=900,height=320;
  const out=core.projectMetricPolygonsCommonScale(polygons,{minX:.04,maxX:.96,minY:.08,maxY:.94,width,height});
  const horizontal=Math.hypot((out[0][1].x-out[0][0].x)*width,(out[0][1].y-out[0][0].y)*height);
  const vertical=Math.hypot((out[1][1].x-out[1][0].x)*width,(out[1][1].y-out[1][0].y)*height);
  assert.ok(Math.abs(horizontal-vertical)<1e-9);
});
