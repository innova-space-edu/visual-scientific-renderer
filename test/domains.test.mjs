import test from"node:test";import assert from"node:assert/strict";import{approximateHeliocentricPosition,GrayScottSimulation,GRAY_SCOTT_PRESETS,hydrogenOrbitalDensity,sampleOrbitalGrid,densityAtAltitude,rayleighPhase,pointChargeField,magneticDipoleField}from"../dist/index.js";

test("local ephemeris produces finite Earth position",()=>{const p=approximateHeliocentricPosition("earth",new Date("2026-10-02T00:00:00Z"));assert.ok(Number.isFinite(p.x)&&p.distanceAU>.9&&p.distanceAU<1.1)});
test("reaction diffusion is deterministic",()=>{const a=new GrayScottSimulation(32,32,GRAY_SCOTT_PRESETS.coral,7).step(4),b=new GrayScottSimulation(32,32,GRAY_SCOTT_PRESETS.coral,7).step(4);assert.deepEqual([...a.v],[...b.v])});
test("hydrogen 1s density decays with radius",()=>{assert.ok(hydrogenOrbitalDensity("1s",0,0,0)>hydrogenOrbitalDensity("1s",3,0,0));const g=sampleOrbitalGrid("2pz",16,4);assert.equal(g.values.length,4096)});
test("atmospheric density decreases with altitude",()=>{assert.ok(densityAtAltitude(0).rayleigh>densityAtAltitude(50000).rayleigh);assert.ok(rayleighPhase(1)>0)});
test("analytic electric and magnetic fields are finite",()=>{const e=pointChargeField([1,0,0],[0,0,0],1e-9),b=magneticDipoleField([1,0,0]);assert.ok(e.every(Number.isFinite)&&b.every(Number.isFinite))});
