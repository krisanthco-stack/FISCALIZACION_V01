'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../app/assets/l26_reader_apply_core.js');

test('PDF fill-missing mode does not replace existing values',()=>{
  assert.equal(core.shouldApply('275480',true),false);
  assert.equal(core.shouldApply('   ',true),true);
  assert.equal(core.shouldApply('',true),true);
});

test('web reader mode may apply detected values to non-protected fields',()=>{
  assert.equal(core.shouldApply('275480',false),true);
});
