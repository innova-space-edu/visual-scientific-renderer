import './style.css';
import './studio/ui.js';
let started=false;
for(const mode of ['2d','3d'])document.querySelector('#mode-'+mode)!.addEventListener('click',async()=>{
 for(const m of ['2d','3d']){(document.querySelector('#studio-'+m) as HTMLElement).hidden=m!==mode;const b=document.querySelector('#mode-'+m)!;b.setAttribute('aria-pressed',String(m===mode));b.classList.toggle('active',m===mode)}
 document.dispatchEvent(new CustomEvent('visual-mode',{detail:mode}));
 if(mode==='3d'&&!started){started=true;try{await import('./demo.js')}catch(e){document.querySelector('#status')!.textContent='No fue posible cargar el motor 3D: '+String(e)}}
});
