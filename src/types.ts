export type ScientificQuality="draft"|"realtime"|"pro"; export type Vec3=[number,number,number];
export type ScientificRenderRequest={domain:"astronomy"|"physics"|"chemistry"|"biology"|"generic";scene:string;quality?:ScientificQuality;width?:number;height?:number;time?:string;seed?:number;parameters?:Record<string,number|string|boolean>};
export type RuntimeCapabilities={webgpu:boolean;webgl2:boolean;workers:boolean;offscreenCanvas:boolean;sharedArrayBuffer:boolean;recommendedQuality:ScientificQuality};
export type ScalarField={shape:number[];values:Float32Array;units?:string;name:string;time?:number};
export type VectorField={shape:number[];values:Float32Array;components:3;units?:string;name:string;time?:number};
export type ParticleSnapshot={positions:Float32Array;velocities?:Float32Array;weights?:Float32Array;species?:string;units?:Record<string,string>;seed?:number};
export type ScientificProvenance={schemaVersion:string;source:string;runId?:string;solver?:string;solverRevision?:string;geometry?:string;dimensionality?:1|2|3;time?:number;fields?:Record<string,{units?:string;sourceField?:string}>;seed?:number;notes?:string[]};