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
