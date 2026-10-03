import type {VisualDocument,ContentSection} from './content.js';
import {applyBrief,type Brief} from './intent.js';
export const SOLAR_SOURCES=[{id:'nasa-solar',title:'NASA Science · Sistema solar',url:'https://science.nasa.gov/solar-system/'},{id:'nasa-planets',title:'NASA Science · Los planetas',url:'https://science.nasa.gov/solar-system/planets/'}];
export const SOLAR_FACTS=[
 ['Sol','sun','Es una estrella: produce energía por fusión nuclear. Su gravedad mantiene unidos a los cuerpos del sistema solar.'],
 ['Mercurio','mercury','Es el planeta más cercano al Sol y el más pequeño. Su superficie rocosa está cubierta de cráteres.'],
 ['Venus','venus','Su atmósfera densa, rica en dióxido de carbono, retiene calor. Es el planeta más caliente.'],
 ['Tierra','earth','Tiene agua líquida abundante y una atmósfera que permite la vida conocida. La Luna es su satélite natural.'],
 ['Marte','mars','Su color rojizo se debe a óxidos de hierro. Tiene una atmósfera tenue y evidencias de agua en el pasado.'],
 ['Júpiter','jupiter','Es el planeta más grande: un gigante gaseoso. Su Gran Mancha Roja es una enorme tormenta.'],
 ['Saturno','saturn','Es un gigante gaseoso con anillos de partículas de hielo y roca. Otros planetas gigantes también tienen anillos.'],
 ['Urano','uranus','Es un gigante helado que gira muy inclinado. El metano de su atmósfera contribuye a su color azul verdoso.'],
 ['Neptuno','neptune','Es el planeta más lejano del Sol. Este gigante helado tiene vientos muy intensos.']
] as const;
export function solarDocument(b:Brief):VisualDocument{
 const sections:ContentSection[]=SOLAR_FACTS.map(([title,diagram,text],i)=>({title,diagram,text,kind:i===0?'key-idea':'text',tone:(['gold','blue','pink','green','pink','gold','purple','blue','blue'] as const)[i]}));
 sections[0].span=4;delete sections[0].diagram;
 sections.push({title:'Otros cuerpos del sistema solar',text:'Los satélites orbitan planetas u otros cuerpos. Los asteroides son principalmente rocosos; muchos están entre Marte y Júpiter. Los cometas contienen hielo y polvo. Plutón es un planeta enano.',kind:'text',span:4,region:'footer'});
 const d=applyBrief({version:2,title:'El sistema solar',subtitle:'Una estrella, ocho planetas y muchos otros cuerpos · Esquema sin escala de tamaños ni distancias',subject:'Astronomía',diagram:'solar-system',format:b.format,theme:'educational',sections,sources:SOLAR_SOURCES},b);
 if(d.design){d.design.columns=b.format==='portrait'?1:4;d.design.density='compact';}
 return d;
}
