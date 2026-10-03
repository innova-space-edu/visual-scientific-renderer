/** Schematic hydrological cycle. Arrows show transport, not measured quantities. */
export function waterCycleSVG():string{
 const arrow=(path:string)=>`<path d="${path}" fill="none" stroke="#2b7baf" stroke-width="5" marker-end="url(#water-arrow)"/>`;
 const tag=(x:number,y:number,text:string)=>`<text x="${x}" y="${y}" font-family="sans-serif" font-size="20" font-weight="600" fill="#214c67">${text}</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 480" data-diagram="water-cycle">
 <defs><linearGradient id="water-sky" x2="0" y2="1"><stop stop-color="#e1f3fc"/><stop offset="1" stop-color="#fbfdf7"/></linearGradient><marker id="water-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#2b7baf"/></marker></defs>
 <rect width="1000" height="480" rx="22" fill="url(#water-sky)"/>
 <circle cx="94" cy="86" r="38" fill="#f5c451"/><circle cx="94" cy="86" r="50" fill="none" stroke="#f5c451" stroke-opacity=".4" stroke-width="7"/>
 <path d="M470 152C423 152 423 98 458 93C460 48 532 44 548 85C581 64 623 94 618 121C647 144 623 165 590 160H476Z" fill="#fff" stroke="#bad5e4" stroke-width="3"/>
 <path d="M710 338L837 162L977 338Z" fill="#a5c7b3"/><path d="M800 212L837 162L879 217L853 209L836 220L822 209Z" fill="#fff"/>
 <path d="M0 330Q195 316 350 345Q550 342 720 314L1000 345V480H0Z" fill="#cfe0b8"/><path d="M0 338Q130 322 295 347L368 404Q185 384 0 409Z" fill="#78bfd7"/>
 <path d="M780 297Q666 315 644 349Q604 374 494 369Q420 361 337 385" fill="none" stroke="#78bfd7" stroke-width="15"/>
 <path d="M0 435Q290 417 470 443T1000 435V480H0Z" fill="#b5c8a6"/>
 <path d="M575 316V364" stroke="#85694c" stroke-width="8"/><path d="M575 253L541 321H609Z" fill="#6d9c74"/>
 ${arrow('M198 305Q195 220 284 166')}${arrow('M320 139Q385 109 438 111')}${arrow('M650 174L714 263')}${arrow('M566 268Q564 213 581 189')}${arrow('M676 368L676 421')}${arrow('M543 433Q405 447 286 424')}
 <path d="M642 195L633 211M676 211L667 227M696 177L687 193" stroke="#59a8ce" stroke-width="4"/>
 ${tag(50,252,'Evaporación')}${tag(313,79,'Condensación')}${tag(709,133,'Precipitación')}${tag(385,235,'Transpiración')}${tag(686,390,'Infiltración')}${tag(390,334,'Escorrentía')}${tag(379,468,'Agua subterránea')}${tag(82,386,'Océano')}
 </svg>`;
}
