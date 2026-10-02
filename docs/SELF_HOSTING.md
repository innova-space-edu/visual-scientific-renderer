# Self-hosted always-on deployment

The renderer can run without a commercial image-generation service.

## Stack

- `web`: static Vite/Three/WebGPU app served by nginx.
- `blender-worker`: persistent Node + Blender/Cycles worker.
- `render-cache`: persistent cache keyed by the deterministic render request hash.

Start:

```bash
docker compose up -d --build
```

Ports:
- Web review UI: 8080
- Blender worker is internal to the compose network by default.

For GPU Cycles, use an NVIDIA-enabled host and extend the Blender image with the NVIDIA container runtime/CUDA-compatible Blender configuration. CPU rendering remains available without it.

This is intended for an owned server or an always-on VM. Colab remains a development/research worker, not production infrastructure.
