function rasterizeLoadedImage(image) {
 // Keep decoded pixel data in a persistent canvas surface so Chromium does not
 // evict discardable LazyPixelRefs and synchronously re-decode WebPs mid-flight.
 if (typeof document === 'undefined' && typeof OffscreenCanvasRenderingContext2D === 'undefined') return image;
 const w = image.naturalWidth, h = image.naturalHeight;
 if (!(w > 0 && h > 0)) return image;
 const surface = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) :
  typeof document !== 'undefined' ? document.createElement('canvas') : null;
 if (!surface) return image;
 surface.width = w; surface.height = h;
 const ctx = surface.getContext('2d');
 if (!ctx || typeof ctx.drawImage !== 'function') return image;
 ctx.drawImage(image, 0, 0);
 // Clear HTMLImageElement backing while retaining expected asset metadata.
 const src = image.src;
 try {
  Object.defineProperties(surface, {
   naturalWidth: { value: w, configurable: true },
   naturalHeight: { value: h, configurable: true },
   src: { value: src, configurable: true },
   complete: { value: true, configurable: true },
   _rasterized: { value: true, configurable: true },
  });
 } catch { return image; }
 return surface;
}

// Bound both transfer and decoding. A failed attempt never publishes a partial cache.
export function loadImage(url,{width,height,errorMessage=`Não foi possível carregar a imagem: ${url}`,timeoutMs=20000,rasterize=true}={}) {
 return new Promise((resolve,reject)=>{
  const image=new Image();let settled=false;
  const finish=(error)=>{
   if(settled)return;settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;
   if(error){image.src='';reject(error);}else resolve(rasterize?rasterizeLoadedImage(image):image);
  };
  const timer=setTimeout(()=>finish(new Error(`${errorMessage} · tempo limite de carregamento/decodificação`)),timeoutMs);
  image.onerror=()=>finish(new Error(errorMessage));
  image.onload=async()=>{
   if(settled)return;
   if(!image.naturalWidth||!image.naturalHeight||(width&&image.naturalWidth!==width)||(height&&image.naturalHeight!==height)){
    finish(new Error(`${errorMessage} · dimensões inválidas`));return;
   }
   try{if(typeof image.decode==='function')await image.decode();finish();}
   catch(error){finish(new Error(`${errorMessage} · falha de decodificação`,{cause:error}));}
  };
  image.src=url;
 });
}
