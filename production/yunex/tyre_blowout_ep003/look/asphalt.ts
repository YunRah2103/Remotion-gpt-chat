import * as T from 'three';

/**
 * Muted, broad-band asphalt tone: deterministic world-space tiling.
 *
 * We deliberately avoid per-pixel white noise, temporal noise, high-contrast
 * bump maps and huge textures: those produce obvious grain and shimmer in
 * 270-pixel-wide review footage. This texture varies only about 2% in colour.
 * The existing highway and refuge use the same map and same metres-to-UV
 * coordinates, so their surface finish does not jump at the seam.
 */
export function makePremiumAsphaltTexture():T.DataTexture {
  const size=128;
  const pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size, v=y/size;
    const broad=Math.sin(2*Math.PI*u)*.58
      +Math.cos(2*Math.PI*v+Math.sin(2*Math.PI*u)*.45)*.27
      +Math.sin(4*Math.PI*u+2*Math.PI*v)*.15;
    const shade=Math.round(246+4*broad);
    const index=(y*size+x)*4;
    pixels[index]=pixels[index+1]=pixels[index+2]=shade;
    pixels[index+3]=255;
  }
  const texture=new T.DataTexture(pixels,size,size,T.RGBAFormat);
  texture.name='EP003-subtle-asphalt-tone-no-noise';
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.magFilter=T.LinearFilter;
  texture.minFilter=T.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;
  texture.anisotropy=4;
  texture.colorSpace=T.SRGBColorSpace;
  texture.needsUpdate=true;
  return texture;
}
