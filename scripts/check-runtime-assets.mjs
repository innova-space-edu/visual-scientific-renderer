import {stat} from "node:fs/promises";import {resolve} from "node:path";
const required={pyodide:"public/vendor/pyodide/pyodide.mjs",opencv:"public/vendor/opencv/opencv.js",spice:"public/vendor/spice/spice.js"};let missing=0;
for(const [name,path] of Object.entries(required)){try{await stat(resolve(path));console.log("[runtime]",name,"ready")}catch{missing++;console.log("[runtime]",name,"not vendored:",path)}}
if(process.env.REQUIRE_ALL_LOCAL_RUNTIME==="1"&&missing)process.exit(1);
