#include "SpiceUsr.h"
#include <emscripten/emscripten.h>

EMSCRIPTEN_KEEPALIVE
void vs_furnsh(const char *path){furnsh_c(path);}

EMSCRIPTEN_KEEPALIVE
int vs_spkpos(const char *target,double et,const char *frame,const char *abcorr,const char *observer,double *out){
  SpiceDouble pos[3],lt=0.0;
  reset_c();
  spkpos_c(target,et,frame,abcorr,observer,pos,&lt);
  if(failed_c()){reset_c();return 1;}
  out[0]=pos[0];out[1]=pos[1];out[2]=pos[2];out[3]=lt;
  return 0;
}