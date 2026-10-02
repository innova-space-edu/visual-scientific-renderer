import {cp,mkdir,stat} from "node:fs/promises";import {resolve,join} from "node:path";
const root=process.cwd(),dest=resolve(root,"public/vendor");await mkdir(dest,{recursive:true});
async function exists(path){try{await stat(path);return true}catch{return false}}
async function copyDir(name,source){if(!source||!(await exists(source))){console.log("[vendor] skip",name,"source missing");return false}const target=join(dest,name);await mkdir(target,{recursive:true});await cp(source,target,{recursive:true,force:true});console.log("[vendor] copied",name,"from",source);return true}
const pyodide=process.env.PYODIDE_SOURCE||resolve(root,"node_modules/pyodide");
const opencv=process.env.OPENCV_SOURCE;
const spice=process.env.SPICE_SOURCE;
const result={pyodide:await copyDir("pyodide",pyodide),opencv:await copyDir("opencv",opencv),spice:await copyDir("spice",spice)};
console.log(JSON.stringify(result,null,2));
