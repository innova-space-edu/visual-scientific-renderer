/** Small local vector illustrations: no image model, font glyph or remote asset. */
export function iconSVG(kind:string,x:number,y:number,size:number,color:string){
 const paths:Record<string,string>={bulb:'<path d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14ZM8 24h8M10 28h4M12 12v8M2 3l-2-2M24 3l2-2M0 12h3M23 12h3"/>',calculator:'<rect x="3" y="1" width="22" height="29" rx="3"/><path d="M7 5h14v6H7ZM7 16h3M15 16h5M7 21h3M15 21h5M7 26h3M15 26h5"/>',book:'<path d="M2 4q7-3 12 1q6-4 12-1v23q-7-3-12 0q-6-3-12 0ZM14 5v22M5 9h5M18 9h5M5 14h5M18 14h5"/>',arrow:'<path d="M2 15h22M16 7l8 8-8 8"/>',check:'<circle cx="14" cy="15" r="12"/><path d="m7 15 5 5 10-11"/>',warning:'<path d="m14 2 13 26H1ZM14 10v9M14 23v1"/>'};
 return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="-3 -3 35 36" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths[kind]||paths.book}</svg>`;
}
