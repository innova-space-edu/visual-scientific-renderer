import type {ScientificRenderRequest} from "../types.js";
export type ScientificSkill={id:string;domain:ScientificRenderRequest["domain"];capabilities:string[];keywords:string[];externalContract?:string;priority:number};
export const SCIENTIFIC_SKILLS:ScientificSkill[]=[
  {id:"astronomy-solar-system",domain:"astronomy",capabilities:["planets","rings","ephemeris","spice","particles","atmosphere"],keywords:["solar","planet","saturn","jupiter","sun","sol","orbita","órbita"],priority:100},
  {id:"physics-plasma",domain:"physics",capabilities:["scalar-fields","vector-fields","particles","streamlines","isosurfaces","monte-carlo"],keywords:["plasma","magnetic","electric","field","campo","warpx","flash","pic"],externalContract:"innova-space-edu/scientificbrain-physics-skills",priority:100},
  {id:"physics-fields",domain:"physics",capabilities:["electric-field","magnetic-dipole","lorentz","gravity","streamlines"],keywords:["electric","magnetic","gravity","lorentz","campo"],priority:80},
  {id:"chemistry-molecule",domain:"chemistry",capabilities:["atoms","bonds","vsepr","molecule"],keywords:["molecule","molécula","h2o","co2","ch4","nh3","nacl","hcl"],priority:100},
  {id:"chemistry-orbital",domain:"chemistry",capabilities:["electron-density","orbital","isosurface"],keywords:["orbital","electron","electrón","1s","2s","2p"],priority:95},
  {id:"biology-cell",domain:"biology",capabilities:["animal-cell","plant-cell","organelles"],keywords:["cell","célula","organelle","orgánulo","mitochondria","chloroplast"],priority:100},
  {id:"biology-reaction-diffusion",domain:"biology",capabilities:["gray-scott","patterns","morphogenesis"],keywords:["reaction diffusion","reacción difusión","pattern","patrón","morphogenesis"],priority:90}
];
function normalize(s:string){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
export function routeScientificSkills(request:ScientificRenderRequest,text=request.scene){
  const hay=normalize(text),domain=SCIENTIFIC_SKILLS.filter(s=>s.domain===request.domain),scored=domain.map(skill=>({skill,score:skill.priority+skill.keywords.reduce((n,k)=>n+(hay.includes(normalize(k))?25:0),0)})).sort((a,b)=>b.score-a.score);
  return scored;
}
export function bestScientificSkill(request:ScientificRenderRequest,text=request.scene){return routeScientificSkills(request,text)[0]?.skill}
