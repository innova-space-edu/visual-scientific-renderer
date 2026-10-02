#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CSPICE_ROOT="${CSPICE_ROOT:-$ROOT/vendor-src/cspice}"
OUT="$ROOT/public/vendor/spice"
LIB="${CSPICE_LIB:-$CSPICE_ROOT/lib/libcspice_wasm.a}"
INCLUDE="${CSPICE_INCLUDE:-$CSPICE_ROOT/include}"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found; install/activate Emscripten" >&2
  exit 1
fi
if [[ ! -f "$LIB" ]]; then
  echo "CSPICE WebAssembly static library not found: $LIB" >&2
  echo "Build CSPICE for wasm first or set CSPICE_LIB/CSPICE_ROOT." >&2
  exit 1
fi
mkdir -p "$OUT"
emcc "$ROOT/spice-wasm/wrapper.c" "$LIB" -I"$INCLUDE" -O3 \
  -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT=web,worker \
  -s ALLOW_MEMORY_GROWTH=1 -s FORCE_FILESYSTEM=1 \
  -s EXPORTED_FUNCTIONS='["_vs_furnsh","_vs_spkpos","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["FS","cwrap","HEAPF64"]' \
  -o "$OUT/spice.js"
echo "SPICE WASM runtime written to $OUT"