import {defineConfig} from "vite";
export default defineConfig({
  optimizeDeps:{exclude:["three-mesh-bvh/worker"]},
  build:{target:"esnext",outDir:"site-dist",sourcemap:true},
  server:{port:4173}
});
