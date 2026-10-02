export type OrbitalElements={a:number;e:number;I:number;L:number;peri:number;node:number};
export type ElementRate=OrbitalElements;
export type PlanetElementSet={base:OrbitalElements;rate:ElementRate};

export const JPL_APPROX_1800_2050:Record<string,PlanetElementSet>={
  mercury:{base:{a:.38709927,e:.20563593,I:7.00497902,L:252.25032350,peri:77.45779628,node:48.33076593},rate:{a:.00000037,e:.00001906,I:-.00594749,L:149472.67411175,peri:.16047689,node:-.12534081}},
  venus:{base:{a:.72333566,e:.00677672,I:3.39467605,L:181.97909950,peri:131.60246718,node:76.67984255},rate:{a:.00000390,e:-.00004107,I:-.00078890,L:58517.81538729,peri:.00268329,node:-.27769418}},
  earth:{base:{a:1.00000261,e:.01671123,I:-.00001531,L:100.46457166,peri:102.93768193,node:0},rate:{a:.00000562,e:-.00004392,I:-.01294668,L:35999.37244981,peri:.32327364,node:0}},
  mars:{base:{a:1.52371034,e:.09339410,I:1.84969142,L:-4.55343205,peri:-23.94362959,node:49.55953891},rate:{a:.00001847,e:.00007882,I:-.00813131,L:19140.30268499,peri:.44441088,node:-.29257343}},
  jupiter:{base:{a:5.20288700,e:.04838624,I:1.30439695,L:34.39644051,peri:14.72847983,node:100.47390909},rate:{a:-.00011607,e:-.00013253,I:-.00183714,L:3034.74612775,peri:.21252668,node:.20469106}},
  saturn:{base:{a:9.53667594,e:.05386179,I:2.48599187,L:49.95424423,peri:92.59887831,node:113.66242448},rate:{a:-.00125060,e:-.00050991,I:.00193609,L:1222.49362201,peri:-.41897216,node:-.28867794}},
  uranus:{base:{a:19.18916464,e:.04725744,I:.77263783,L:313.23810451,peri:170.95427630,node:74.01692503},rate:{a:-.00196176,e:-.00004397,I:-.00242939,L:428.48202785,peri:.40805281,node:.04240589}},
  neptune:{base:{a:30.06992276,e:.00859048,I:1.77004347,L:-55.12002969,peri:44.96476227,node:131.78422574},rate:{a:.00026291,e:.00005105,I:.00035372,L:218.45945325,peri:-.32241464,node:-.00508664}}
};

const d2r=Math.PI/180;
function wrapDeg(x:number){x%=360;if(x>180)x-=360;if(x<-180)x+=360;return x}
export function julianDate(date:Date){return date.getTime()/86400000+2440587.5}
export function solveEccentricAnomaly(meanAnomalyDeg:number,e:number,tolerance=1e-8){
  const M=wrapDeg(meanAnomalyDeg)*d2r;let E=M+e*Math.sin(M);
  for(let i=0;i<20;i++){const d=(M-(E-e*Math.sin(E)))/(1-e*Math.cos(E));E+=d;if(Math.abs(d)<tolerance)break}
  return E;
}
export function approximateHeliocentricPosition(planet:keyof typeof JPL_APPROX_1800_2050,date:Date){
  const set=JPL_APPROX_1800_2050[planet],T=(julianDate(date)-2451545)/36525,el={} as OrbitalElements;
  for(const key of ["a","e","I","L","peri","node"] as const)el[key]=set.base[key]+set.rate[key]*T;
  const omega=(el.peri-el.node)*d2r,M=el.L-el.peri,E=solveEccentricAnomaly(M,el.e),xp=el.a*(Math.cos(E)-el.e),yp=el.a*Math.sqrt(1-el.e*el.e)*Math.sin(E),O=el.node*d2r,I=el.I*d2r,co=Math.cos(omega),so=Math.sin(omega),cO=Math.cos(O),sO=Math.sin(O),cI=Math.cos(I),sI=Math.sin(I);
  const x=(co*cO-so*sO*cI)*xp+(-so*cO-co*sO*cI)*yp,y=(co*sO+so*cO*cI)*xp+(-so*sO+co*cO*cI)*yp,z=(so*sI)*xp+(co*sI)*yp;
  return{x,y,z,distanceAU:Math.hypot(x,y,z),elements:el};
}
export function approximateSolarSystem(date:Date){return Object.fromEntries(Object.keys(JPL_APPROX_1800_2050).map(name=>[name,approximateHeliocentricPosition(name,date)]))}
