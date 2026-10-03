import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {FrameClock,preparePhysicalScene,disposeScientificScene,generateCameraRay,MonteCarloEngine,fromScientificBrainPlasma,generateBlenderPython,createBlenderJob,ParticleSystem,WebGPUParticleCompute} from '../dist/index.js';

test('frame deltas track the frame clock independently of FPS reporting',()=>{
  const clock=new FrameClock();assert.equal(clock.tick(0),0);
  for(let i=1;i<=60;i++)assert.ok(Math.abs(clock.tick(i*1000/60)-1/60)<1e-12);
  clock.reset();assert.equal(clock.tick(9000),0);assert.equal(clock.tick(10000),.033);
});
test('thin lens converges on a camera-relative focal plane in metres',()=>{
  const camera={position:[4,2,0],target:[3,2,0],apertureF:2,focalLengthMm:50,focusDistance:5};
  const ray=generateCameraRay(camera,.7,.4,16/9,()=>.25);
  const pinhole=generateCameraRay({...camera,apertureF:Infinity},.7,.4,16/9);
  assert.ok(Math.hypot(ray.origin[1]-2,ray.origin[2])<=.0125);
  const k=(4-5-ray.origin[0])/ray.direction[0],q=(4-5-pinhole.origin[0])/pinhole.direction[0];
  for(let axis=0;axis<3;axis++)assert.ok(Math.abs(ray.origin[axis]+ray.direction[axis]*k-(pinhole.origin[axis]+pinhole.direction[axis]*q))<1e-10);
});
test('Monte Carlo summaries support 250000 samples without argument overflow',()=>{
  const result=new MonteCarloEngine(42).run({variables:[],samples:250000,model:(_,i)=>i});
  assert.equal(result.summary.min,0);assert.equal(result.summary.max,249999);assert.equal(result.summary.mean,124999.5);
  assert.throws(()=>new MonteCarloEngine().run({variables:[],samples:0,model:()=>0}));
});
test('field components cannot be inferred from electron_density or energy',()=>{
  const bundle=fromScientificBrainPlasma({fields:{electron_density:{shape:[3],values:[1,2,3]},energy:{shape:[3],values:[2,3,4]},custom:{shape:[1],values:[1,2,3],components:3}},metadata:{schemaVersion:'1',source:'test'}});
  assert.deepEqual(bundle.scalars.map(f=>f.name),['electron_density','energy']);assert.equal(bundle.vectors[0].name,'custom');
  assert.throws(()=>fromScientificBrainPlasma({fields:{B:{shape:[3],values:[1,2,3]}},metadata:{schemaVersion:'1',source:'test'}}),/mismatch/);
});
test('CPU and GPU parameter contracts preserve the same gravity and damping',async()=>{
  let shader,uniform;
  const device={createBuffer:()=>({destroy(){}}),queue:{writeBuffer:(buffer,offset,data)=>{if(data.length===8)uniform=[...data]},submit(){}},createShaderModule:({code})=>(shader=code,{}),createComputePipelineAsync:async()=>({getBindGroupLayout:()=>({})}),createBindGroup:()=>({}),createCommandEncoder:()=>({beginComputePass:()=>({setPipeline(){},setBindGroup(){},dispatchWorkgroups(){},end(){}}),finish:()=>({})}),destroy(){}};
  Object.defineProperty(globalThis,'navigator',{value:{gpu:{requestAdapter:async()=>({requestDevice:async()=>device})}},configurable:true});
  globalThis.GPUBufferUsage={STORAGE:1,COPY_DST:2,COPY_SRC:4,UNIFORM:8};
  const config={count:1,gravity:[1,-9.81,2],drag:.2,radialForce:.4};const particles=new ParticleSystem(config);
  const gpu=await new WebGPUParticleCompute().init(config,particles.positions,particles.velocities);gpu.step(.01);
  assert.ok(Math.abs(uniform[1]-.998)<1e-6);assert.deepEqual(uniform.slice(4).map(v=>Math.round(v*100)/100),[1,-9.81,2,0]);
  assert.match(shader,/params.gravity.xyz/);assert.match(shader,/p.pos.xyz\/r/);gpu.dispose();
});
test('physical adapter preserves textures, multi-materials, transforms and source ownership',()=>{
  const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),map=new THREE.Texture();
  const metal=new THREE.MeshPhysicalMaterial({metalness:1,roughness:.12,map}),glass=new THREE.MeshPhysicalMaterial({transmission:1,ior:1.5,thickness:.8});
  const mesh=new THREE.Mesh(geometry,[metal,glass]);mesh.position.set(1,2,3);scene.add(mesh);
  scene.add(new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial()));
  const prepared=preparePhysicalScene(scene),copy=prepared.scene.children[0];
  assert.equal(prepared.omittedEffects,1);assert.equal(copy.material[0].map,map);assert.equal(copy.material[1].transmission,1);assert.equal(copy.position.x,1);
  assert.notEqual(copy.material[0],metal);assert.equal(mesh.material[0],metal);
  let disposed=false;geometry.addEventListener('dispose',()=>disposed=true);prepared.dispose();assert.equal(disposed,false);
});
test('scene disposal releases shared resources only once',()=>{
  const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:texture});
  let count=0;texture.addEventListener('dispose',()=>count++);
  scene.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));disposeScientificScene(scene);assert.equal(count,1);
});
test('Blender script is valid Python and safely encodes adversarial text as data',()=>{
  const job=createBlenderJob('saturn',{output:"/tmp/'''\\é\nimage.png",parameters:{text:"''');raise Exception('injected')#"}});
  const script=generateBlenderPython(job);
  const output=execFileSync('python',['-c',"import ast,sys; tree=ast.parse(sys.stdin.read()); exec(compile(ast.Module(body=tree.body[1:2],type_ignores=[]),'<payload>','exec'),{'json':__import__('json')})"],{input:script});
  assert.equal(output.length,0);assert.ok(script.includes("rings(obj,1.55,2.65)"));assert.ok(script.includes("planets=["));
  assert.throws(()=>createBlenderJob('unsupported'),/Unsupported/);
});
