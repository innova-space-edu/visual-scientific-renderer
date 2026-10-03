import {createBlenderWorkerServer} from "../dist/node.js";
const port=Number(process.env.PORT||8787),concurrency=Math.max(1,Number(process.env.BLENDER_CONCURRENCY||1));
const app=createBlenderWorkerServer({port,concurrency});
await app.listen();
console.log("[visual-scientific-renderer] Blender worker listening on",port,"concurrency",concurrency);
