export const PYTHON_KERNELS={
  fft:`import numpy as np\nx=np.asarray(input_values,dtype=float)\nresult=np.fft.rfft(x).tolist()`,
  gaussian:`import numpy as np\nfrom scipy.ndimage import gaussian_filter\na=np.asarray(input_values,dtype=float)\nresult=gaussian_filter(a,sigma=float(sigma)).tolist()`,
  orbital:`import numpy as np\nx=np.linspace(-extent,extent,resolution)\nX,Y,Z=np.meshgrid(x,x,x,indexing="ij")\nr=np.sqrt(X*X+Y*Y+Z*Z)\npsi=np.exp(-r)\nresult=(psi*psi).astype(np.float32).ravel().tolist()`,
  astropyEarth:`from astropy.time import Time\nfrom astropy.coordinates import get_body_barycentric\nt=Time(iso_date)\np=get_body_barycentric("earth",t)\nresult={"x":float(p.x.value),"y":float(p.y.value),"z":float(p.z.value)}`
} as const;
