import {readFile,writeFile,copyFile,mkdir,stat} from "node:fs/promises";
import {resolve,join,basename} from "node:path";
import process from "node:process";

const root=process.cwd();
const args=process.argv.slice(2);
const download=args.includes("--download");
const requested=args.filter(x=>x!=="--download");
const packages=requested.length?requested:["numpy","scipy","sympy","astropy","matplotlib","scikit-image"];
const npmRoot=resolve(root,"node_modules/pyodide");
const sourceRoot=process.env.PYODIDE_FULL_SOURCE_DIR?resolve(process.env.PYODIDE_FULL_SOURCE_DIR):npmRoot;
const target=resolve(root,"public/vendor/pyodide");

async function exists(path){try{await stat(path);return true}catch{return false}}
await mkdir(target,{recursive:true});

const packageJson=JSON.parse(await readFile(join(npmRoot,"package.json"),"utf8"));
const version=packageJson.version;
const lockPath=(await exists(join(sourceRoot,"pyodide-lock.json"))?join(sourceRoot,"pyodide-lock.json"):join(npmRoot,"pyodide-lock.json"));
const lock=JSON.parse(await readFile(lockPath,"utf8"));
const table=lock.packages??lock;
const selected=new Set();

function add(name){
  if(selected.has(name))return;
  const entry=table[name];
  if(!entry)throw new Error("Pyodide package not found in lockfile: "+name);
  selected.add(name);
  for(const dep of entry.depends??entry.dependencies??[])add(dep);
}
for(const name of packages)add(name);

const base="https://cdn.jsdelivr.net/pyodide/v"+version+"/full/";
const manifest={version,requested:packages,packages:[],generatedAt:new Date().toISOString()};

for(const name of selected){
  const entry=table[name];
  const file=entry.file_name??entry.fileName;
  if(!file)continue;
  const local=join(sourceRoot,file);
  const destination=join(target,basename(file));
  if(await exists(local)){
    await copyFile(local,destination);
  }else if(download){
    const response=await fetch(base+file);
    if(!response.ok)throw new Error("Unable to download "+file+": HTTP "+response.status);
    await writeFile(destination,new Uint8Array(await response.arrayBuffer()));
  }else{
    throw new Error("Missing "+file+". Provide PYODIDE_FULL_SOURCE_DIR or use --download.");
  }
  manifest.packages.push({name,file:basename(file),sha256:entry.sha256??null});
  const metadata=file.replace(/\.whl$/,".metadata");
  const metadataSource=join(sourceRoot,metadata);
  if(await exists(metadataSource))await copyFile(metadataSource,join(target,basename(metadata)));
}
await writeFile(join(target,"scientific-packages.json"),JSON.stringify(manifest,null,2));
console.log("[pyodide] vendored",manifest.packages.length,"package artifacts for",packages.join(", "));
