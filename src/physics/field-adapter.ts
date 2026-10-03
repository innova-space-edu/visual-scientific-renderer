import type {ParticleSnapshot,ScalarField,ScientificProvenance,VectorField} from "../types.js";
export type ScientificFieldBundle={scalars:ScalarField[];vectors:VectorField[];particles:ParticleSnapshot[];provenance:ScientificProvenance};
export function validateFieldBundle(bundle:ScientificFieldBundle){
  const errors:string[]=[];
  if(!bundle.provenance.schemaVersion)errors.push("schemaVersion missing");
  if(!bundle.provenance.source)errors.push("source missing");
  for(const field of [...bundle.scalars,...bundle.vectors]){
    if(!field.shape.length||field.shape.some(size=>!Number.isInteger(size)||size<1))errors.push(field.name+": invalid shape");
    const expected=field.shape.reduce((a,b)=>a*b,1)*("components" in field?(field as VectorField).components:1);
    if(expected!==field.values.length)errors.push(field.name+": values/shape mismatch");
    if(field.values.some(value=>!Number.isFinite(value)))errors.push(field.name+": non-finite values");
  }
  return{valid:errors.length===0,errors};
}
export function fromScientificBrainPlasma(input:{fields:Record<string,{shape:number[];values:number[];units?:string;components?:1|3}>;particles?:ParticleSnapshot[];metadata:ScientificProvenance}):ScientificFieldBundle{
  const scalars:ScalarField[]=[],vectors:VectorField[]=[];
  for(const [name,field] of Object.entries(input.fields)){
    const values=new Float32Array(field.values);
    // Only exact canonical vector names may supply the legacy implicit convention.
    const vector=field.components===3||(field.components===undefined&&/^(E|B|v|velocity|electric|magnetic)$/i.test(name));
    if(vector)vectors.push({name,shape:field.shape,values,components:3,units:field.units});
    else scalars.push({name,shape:field.shape,values,units:field.units});
  }
  const bundle={scalars,vectors,particles:input.particles??[],provenance:input.metadata};
  const validation=validateFieldBundle(bundle);
  if(!validation.valid)throw new Error(validation.errors.join("; "));
  return bundle;
}
