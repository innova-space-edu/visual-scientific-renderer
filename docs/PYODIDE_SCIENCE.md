# Self-hosted scientific Python packages

The NPM `pyodide` package contains the core runtime, but not the full scientific wheel repository. Visual Scientific Renderer therefore has a separate vendoring step for the packages used by the scientific kernels.

## Fully offline build

Download/unpack a matching full Pyodide distribution once and point the build at it:

```bash
PYODIDE_FULL_SOURCE_DIR=/opt/pyodide-full npm run vendor:science-python
```

The script recursively follows `pyodide-lock.json` dependencies and copies only the required artifacts into `public/vendor/pyodide`.

Default set:

- NumPy
- SciPy
- SymPy
- Astropy
- Matplotlib
- scikit-image

## Connected build

If the build machine has network access, the same subset can be materialized once from the official versioned Pyodide distribution:

```bash
npm run vendor:science-python:download
```

The deployed application then serves all copied wheels itself; there is no runtime CDN dependency.

The Docker web image performs this connected-build step by default. For an air-gapped deployment, mount/copy the full distribution and use `PYODIDE_FULL_SOURCE_DIR` instead.
