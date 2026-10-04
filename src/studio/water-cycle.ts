import {natureDefs,treeSVG,cloudSVG} from './nature-art.js';
/** Illustrated cutaway. Transport arrows are schematic, not measured fluxes. */
export function waterCycleSVG():string{
 const p='water',arrow=(path:string)=>`<path d="${path}" fill="none" stroke="#277eae" stroke-width="5" stroke-linecap="round" marker-end="url(#water-arrow)"/>`;
 const tag=(x:number,y:number,text:string)=>`<text x="${x}" y="${y}" font-family="sans-serif" font-size="22" font-weight="600" fill="#214c67" paint-order="stroke" stroke="#f4faf9" stroke-width="4" stroke-linejoin="round">${text}</text>`;
 let forest='';for(let i=0;i<10;i++)forest+=treeSVG(630+i*31,355-(i%3)*9,.35+(i%4)*.06,p,i);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" data-diagram="water-cycle">${natureDefs(p)}
 <defs><linearGradient id="water-sky" x2="0" y2="1"><stop stop-color="#d8eff8"/><stop offset="1" stop-color="#fcfcf1"/></linearGradient><linearGradient id="water-mountain" x2="1" y2="1"><stop stop-color="#c6d9d4"/><stop offset=".45" stop-color="#7b9e9b"/><stop offset="1" stop-color="#476d72"/></linearGradient><linearGradient id="water-land" x2="0" y2="1"><stop stop-color="#b6d69a"/><stop offset="1" stop-color="#62956c"/></linearGradient><marker id="water-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#277eae"/></marker></defs>
 <rect width="1000" height="600" rx="22" fill="url(#water-sky)"/>
 <circle cx="100" cy="93" r="59" fill="#ffd781" opacity=".22"/><circle cx="100" cy="93" r="42" fill="#ffcd6d"/>
 <path d="M568 344C621 281 639 257 670 216L732 172L777 109L817 169L839 196L868 232L940 287L1000 348Z" fill="url(#water-mountain)"/><path d="M777 110L817 170L805 163L798 189L779 162L764 180L750 175L732 172Z" fill="#edf5f3"/><path d="M781 164L809 257L820 289L872 330L819 302L778 231L751 278L719 299L749 230Z" fill="#476b72" opacity=".48"/>
 <path d="M0 375C156 356 280 350 382 377C491 390 549 345 672 324Q798 305 1000 345L1000 492H0Z" fill="url(#water-land)"/>
 <path d="M0 399Q218 370 372 403L399 454Q245 421 0 468Z" fill="url(#water-water)"/>
 <path d="M0 466Q181 433 399 454Q617 420 1000 436V571Q709 585 500 559Q254 572 0 557Z" fill="#aa8d67"/><path d="M0 492Q198 465 399 487Q659 455 1000 467V500Q716 498 502 509Q195 493 0 521Z" fill="#d3bd95"/><path d="M0 532Q215 504 501 527Q738 509 1000 518V546Q720 536 505 551Q192 526 0 551Z" fill="#65a6b3" opacity=".85"/>
 <path d="M777 229C742 274 781 306 714 322C675 335 677 364 605 369C526 373 504 405 377 416" fill="none" stroke="#2b879f" stroke-width="12"/><path d="M776 229C742 274 781 306 714 322C675 335 677 364 605 369C526 373 504 405 377 416" fill="none" stroke="#a2e5e7" stroke-width="5"/>
 ${forest}${treeSVG(522,394,.72,p,13)}${treeSVG(589,385,.58,p,2)}${cloudSVG(448,115,.9,p)}${cloudSVG(657,141,.65,p)}
 <g stroke="#70b6cc" stroke-width="4" stroke-linecap="round"><path d="M620 195L608 215M659 199L647 219M691 193L679 213M635 230L623 250M677 229L665 249"/></g>
 <g fill="none" stroke="#d0f1ed" stroke-opacity=".65" stroke-width="2"><path d="M37 407Q113 397 168 408M204 421Q271 410 327 422M38 441Q112 428 176 440"/></g>
 ${arrow('M197 348C195 263 262 197 324 171')}${arrow('M350 124Q374 113 386 114')}${arrow('M673 176L714 261')}${arrow('M525 286Q518 220 550 194')}${arrow('M714 374L714 448')}${arrow('M644 538Q431 548 277 508')}${arrow('M658 369Q537 395 438 410')}
 ${tag(53,275,'Evaporación')}${tag(349,57,'Condensación')}${tag(724,77,'Precipitación')}${tag(345,251,'Transpiración')}${tag(735,420,'Infiltración')}${tag(456,436,'Escorrentía')}${tag(411,583,'Agua subterránea')}${tag(72,477,'Océano')}
 </svg>`;
}
