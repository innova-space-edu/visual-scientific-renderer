/** Public-domain illustration candidates from a topic's Wikipedia articles and Commons metadata. */
export type Artwork={id:string;title:string;description:string;url:string;source:string;credit:string};
const plain=(v:unknown,max=400)=>String(v??'').replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ').trim().slice(0,max);
export function isWikimediaImage(url:string){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='upload.wikimedia.org'&&!u.username&&!u.password;}catch{return false;}}
export async function artworkCandidates(topic:string):Promise<Artwork[]>{
 try{
  const r=await fetch('https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(topic)+'&gsrlimit=2&prop=pageimages&piprop=name|thumbnail&pilicense=free&pithumbsize=1200&format=json',{signal:AbortSignal.timeout(3500)});if(!r.ok)return[];
  const pages=Object.values((await r.json()).query?.pages||{}) as any[],selected=pages.filter(p=>p.pageimage&&isWikimediaImage(p.thumbnail?.source||''));if(!selected.length)return[];
  const info=await fetch('https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&titles='+encodeURIComponent(selected.map(p=>'File:'+p.pageimage).join('|'))+'&format=json',{signal:AbortSignal.timeout(3500)});if(!info.ok)return[];
  const files=Object.values((await info.json()).query?.pages||{}) as any[],out:Artwork[]=[];
  for(const p of selected){const file=files.find(f=>f.title==='File:'+p.pageimage),i=file?.imageinfo?.[0],m=i?.extmetadata||{},license=plain(m.LicenseShortName?.value||m.License?.value);
   if(!/^(public domain|cc0|pd)$/i.test(license)||!i?.descriptionurl?.startsWith('https://commons.wikimedia.org/'))continue;
   out.push({id:'art-'+(out.length+1),title:plain(p.title),description:plain(m.ImageDescription?.value),url:p.thumbnail.source,source:i.descriptionurl,credit:plain(m.Artist?.value,140)+' · '+license});
  }return out;
 }catch{return[];}
}
export async function embedArtwork(art:Artwork):Promise<string|undefined>{
 if(!isWikimediaImage(art.url))return;
 try{const r=await fetch(art.url,{signal:AbortSignal.timeout(6000),redirect:'error'});const mime=r.headers.get('content-type')?.split(';')[0];if(!r.ok||!['image/png','image/jpeg','image/webp'].includes(mime||''))return;
  if(Number(r.headers.get('content-length'))>2400000){await r.body?.cancel();return;}const reader=r.body?.getReader();if(!reader)return;const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>2400000){await reader.cancel();return;}chunks.push(value);}return 'data:'+mime+';base64,'+Buffer.concat(chunks).toString('base64');
 }catch{return;}
}
