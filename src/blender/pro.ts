export type BlenderRenderJob={scene:"solar-system"|"sun"|"saturn"|string;width:number;height:number;samples:number;engine?:"BLENDER_EEVEE_NEXT"|"CYCLES";seed?:number;output?:string;parameters?:Record<string,number|string|boolean>};
export function createBlenderJob(scene:string,options:Partial<BlenderRenderJob>={}):BlenderRenderJob{
  const job={scene,width:options.width??2048,height:options.height??2048,samples:options.samples??128,engine:options.engine??"CYCLES",seed:options.seed??42,output:options.output??"/tmp/scientific-render.png",parameters:options.parameters??{}};
  validateBlenderJob(job);return job;
}
function validateBlenderJob(job:BlenderRenderJob){
  if(!["solar-system","sun","saturn"].includes(job.scene))throw new Error("Unsupported Blender scene: "+job.scene);
  for(const value of [job.width,job.height])if(!Number.isInteger(value)||value<1||value>4096)throw new Error("Blender dimensions must be in 1..4096");
  if(!Number.isInteger(job.samples)||job.samples<1||job.samples>1024)throw new Error("Blender samples must be in 1..1024");
  if(!["CYCLES","BLENDER_EEVEE_NEXT"].includes(job.engine??"CYCLES"))throw new Error("Unsupported Blender engine");
}
export function blenderCommand(jobPath="/tmp/job.json",scriptPath="/app/render_job.py"){return["blender","-b","--python",scriptPath,"--","--job",jobPath]}
export function generateBlenderPython(job:BlenderRenderJob){
  validateBlenderJob(job);
  // An encoded data payload cannot terminate a Python source literal.
  const hex=Array.from(new TextEncoder().encode(JSON.stringify(job)),byte=>byte.toString(16).padStart(2,"0")).join("");
  return `import bpy, json, math, mathutils
job=json.loads(bytes.fromhex('${hex}').decode('utf-8'))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine=job.get('engine','CYCLES')
scene.render.resolution_x=job['width']; scene.render.resolution_y=job['height']; scene.render.resolution_percentage=100
if scene.render.engine=='CYCLES':
    scene.cycles.samples=job['samples']; scene.cycles.seed=job.get('seed',42)
    scene.cycles.use_denoising=True; scene.cycles.max_bounces=8
scene.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Scientific World'); scene.world=world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(0.002,0.004,0.012,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=0.12

def surface(name,colors,bands=False,emission=False):
    mat=bpy.data.materials.new(name); mat.use_nodes=True
    nodes=mat.node_tree.nodes; links=mat.node_tree.links
    shader=nodes.get('Principled BSDF'); shader.inputs['Roughness'].default_value=0.65
    coord=nodes.new('ShaderNodeTexCoord')
    noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=7; noise.inputs['Detail'].default_value=5
    links.new(coord.outputs['Generated'],noise.inputs['Vector'])
    factor=noise.outputs['Fac']
    if bands:
        wave=nodes.new('ShaderNodeTexWave'); wave.wave_type='BANDS'; wave.bands_direction='Z'
        wave.inputs['Scale'].default_value=9; wave.inputs['Distortion'].default_value=2; wave.inputs['Detail'].default_value=4
        links.new(coord.outputs['Generated'],wave.inputs['Vector']); factor=wave.outputs['Fac']
    ramp=nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color=(*colors[0],1); ramp.color_ramp.elements[1].color=(*colors[1],1)
    links.new(factor,ramp.inputs[0]); links.new(ramp.outputs['Color'],shader.inputs['Base Color'])
    if emission:
        links.new(ramp.outputs['Color'],shader.inputs['Emission Color']); shader.inputs['Emission Strength'].default_value=3.5
    else:
        bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=0.12 if bands else 0.25; bump.inputs['Distance'].default_value=0.015
        links.new(noise.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],shader.inputs['Normal'])
    return mat

def sphere(name,radius,position,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=64,radius=radius,location=position)
    obj=bpy.context.object; obj.name=name; obj.data.materials.append(material)
    for polygon in obj.data.polygons: polygon.use_smooth=True
    return obj

def rings(parent,inner,outer):
    n=384; vertices=[]; faces=[]
    for i in range(n):
        a=2*math.pi*i/n
        vertices.extend([(inner*math.cos(a),inner*math.sin(a),0),(outer*math.cos(a),outer*math.sin(a),0)])
    for i in range(n):
        j=(i+1)%n; faces.append((i*2,j*2,j*2+1,i*2+1))
    mesh=bpy.data.meshes.new('Annular rings'); mesh.from_pydata(vertices,[],faces); mesh.update()
    obj=bpy.data.objects.new(parent.name+' rings',mesh); bpy.context.collection.objects.link(obj); obj.parent=parent
    mat=bpy.data.materials.new('Radial ice and dust'); mat.use_nodes=True
    nodes=mat.node_tree.nodes; links=mat.node_tree.links; nodes.clear()
    out=nodes.new('ShaderNodeOutputMaterial'); mix=nodes.new('ShaderNodeMixShader')
    transparent=nodes.new('ShaderNodeBsdfTransparent'); bsdf=nodes.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Base Color'].default_value=(0.65,0.53,0.31,1); bsdf.inputs['Roughness'].default_value=0.85
    coords=nodes.new('ShaderNodeTexCoord'); wave=nodes.new('ShaderNodeTexWave'); wave.wave_type='RINGS'; wave.rings_direction='Z'; wave.inputs['Scale'].default_value=45
    links.new(coords.outputs['Object'],wave.inputs['Vector'])
    ramp=nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color=(0.28,0.28,0.28,1); ramp.color_ramp.elements[1].color=(0.95,0.95,0.95,1)
    links.new(wave.outputs['Fac'],ramp.inputs[0]); links.new(ramp.outputs['Color'],mix.inputs[0]); links.new(transparent.outputs[0],mix.inputs[1]); links.new(bsdf.outputs[0],mix.inputs[2]); links.new(mix.outputs[0],out.inputs['Surface']); obj.data.materials.append(mat)
    return obj

sunmat=surface('Solar granulation',[(0.9,0.13,0.01),(1,0.7,0.18)],emission=True)
saturnmat=surface('Saturn bands',[(0.34,0.23,0.10),(0.85,0.72,0.43)],bands=True)
if job['scene']=='saturn':
    obj=sphere('Saturn',1.25,(0,0,0),saturnmat); rings(obj,1.55,2.65); obj.rotation_euler[0]=math.radians(26.7)
    camera_position=(0,-8,3.5); target=(0,0,0)
elif job['scene']=='sun':
    sphere('Sun',1.25,(0,0,0),sunmat); camera_position=(0,-5.8,1); target=(0,0,0)
elif job['scene']=='solar-system':
    sphere('Sun',0.72,(0,0,0),sunmat)
    planets=[('Mercury',0.055,1.25,(0.24,0.20,0.17),(0.6,0.53,0.43)),('Venus',0.12,1.62,(0.47,0.25,0.06),(0.95,0.72,0.35)),('Earth',0.125,2.02,(0.01,0.09,0.42),(0.08,0.47,0.20)),('Mars',0.08,2.42,(0.30,0.04,0.02),(0.79,0.28,0.10)),('Jupiter',0.34,3.15,(0.25,0.12,0.05),(0.79,0.65,0.47)),('Saturn',0.29,3.95,(0.34,0.23,0.10),(0.85,0.72,0.43)),('Uranus',0.19,4.7,(0.10,0.50,0.58),(0.54,0.89,0.95)),('Neptune',0.185,5.4,(0.01,0.04,0.34),(0.1,0.28,0.79))]
    for name,radius,distance,c1,c2 in planets:
        mat=surface(name,[c1,c2],bands=name in ['Jupiter','Saturn','Uranus','Neptune'])
        obj=sphere(name,radius,(distance,0,0),mat)
        if name=='Saturn': rings(obj,0.38,0.64); obj.rotation_euler[0]=math.radians(26.7)
    bpy.ops.object.light_add(type='POINT',location=(0,0,0)); bpy.context.object.data.energy=650; bpy.context.object.data.shadow_soft_size=0.72
    camera_position=(2.5,-8,5); target=(2.5,0,0)
for position,energy,size in [((4,-4,6),1300,4),((-3,2,3),550,3)]:
    bpy.ops.object.light_add(type='AREA',location=position); light=bpy.context.object; light.data.energy=energy; light.data.shape='DISK'; light.data.size=size
    direction=mathutils.Vector(target)-light.location; light.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=camera_position); camera=bpy.context.object; camera.data.lens=45; scene.camera=camera
camera.rotation_euler=(mathutils.Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.image_settings.file_format='PNG'; scene.render.filepath=job['output']
bpy.ops.render.render(write_still=True)
`;
}
