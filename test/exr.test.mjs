import test from"node:test";import assert from"node:assert/strict";import{encodeOpenEXR,verifyOpenEXR,rgbToRgbaFloat}from"../dist/index.js";

test("OpenEXR float export round-trip metadata",()=>{
  const rgba=new Float32Array([4,1,.25,1,.1,.2,.3,1]);
  const bytes=encodeOpenEXR(2,1,rgba,{precision:"half",colorSpace:"Linear Rec.709"});
  assert.ok(bytes.byteLength>32);
  const info=verifyOpenEXR(bytes);
  assert.ok(info);
});

test("RGB float buffer converts to RGBA",()=>{
  assert.deepEqual([...rgbToRgbaFloat(new Float32Array([1,2,3]),.5)],[1,2,3,.5]);
});
