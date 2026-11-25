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
 return attachAssetMetadata(surface,image,'canvas')?surface:image;
}

function attachAssetMetadata(asset,image,representation) {
 try {
  Object.defineProperties(asset,{
   naturalWidth:{value:image.naturalWidth,configurable:true},
   naturalHeight:{value:image.naturalHeight,configurable:true},
   src:{value:image.src,configurable:true},
   complete:{value:true,configurable:true},
   _rasterized:{value:true,configurable:true},
   _representation:{value:representation,configurable:true},
  });
  return true;
 } catch { return false; }
}

async function tryImageBitmap(image) {
 try { return await createImageBitmap(image); }
 catch { return null; }
}

// Bound transfer, decoding and bitmap creation. A failed attempt never publishes a partial cache.
export function loadImage(url,{width,height,errorMessage=`Não foi possível carregar a imagem: ${url}`,timeoutMs=20000,rasterize=true,representation=rasterize?'canvas':'image'}={}) {
 return new Promise((resolve,reject)=>{
  const image=new Image();let settled=false;
  const finish=(error,asset)=>{
   if(settled)return;settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;
   if(error){image.src='';reject(error);}else resolve(asset);
  };
  const timer=setTimeout(()=>finish(new Error(`${errorMessage} · tempo limite de carregamento/decodificação`)),timeoutMs);
  image.onerror=()=>finish(new Error(errorMessage));
  image.onload=async()=>{
   if(settled)return;
   if(!image.naturalWidth||!image.naturalHeight||(width&&image.naturalWidth!==width)||(height&&image.naturalHeight!==height)){
    finish(new Error(`${errorMessage} · dimensões inválidas`));return;
   }
   try {
    if(typeof image.decode==='function')await image.decode();
    if(settled)return;
    if(representation==='bitmap'&&typeof createImageBitmap==='function'){
     const bitmap=await tryImageBitmap(image);
     if(settled){bitmap?.close();return;}
     if(bitmap){
      if(attachAssetMetadata(bitmap,image,'bitmap')){finish(null,bitmap);return;}
      bitmap.close();
     }
    }
    finish(null,representation==='image'?image:rasterizeLoadedImage(image));
   }
   catch(error){finish(new Error(`${errorMessage} · falha de decodificação`,{cause:error}));}
  };
  image.src=url;
 });
}
