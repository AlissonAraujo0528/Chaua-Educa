import {RUNTIME_ART} from './runtime-art-data.mjs';
// One cache for gameplay, menus and results. All files are local.
export const ASSET_PATHS = Object.fromEntries([
 ...['chaua','hawk'].map(k=>[`${k}-atlas`,`../assets/v6/${k}-atlas.webp`]),
 ...['lower','upper'].map(k=>[`trees-${k}`,`../assets/v7/trees-${k}.webp`]),
 // Keep only the authored full-winter atlas plus transparent transition
 // overlays. Remove 2 identical legacy copies and 6 unused intermediate
 // full-size frames from BOOT, while keeping their on-disk originals intact.
 ...['lower','upper'].map(k=>[`trees-${k}-snow-04`,`../assets/Seasons/Winter/trees-${k}-snow-04.webp`]),
 ...['lower','upper'].flatMap(k=>[1,2,3,4].map(s=>[`trees-${k}-overlay-0${s}`,`../assets/Seasons/Winter/trees-${k}-overlay-0${s}.webp`])),
 ...Object.entries(RUNTIME_ART).flatMap(([family,def])=>def.pages.map((page,i)=>[`runtime-${family}-${i}`,page.path])),
 ...['forest'].map(k=>[k,`../assets/v3/${k}.webp`]),
 ...['feather','shield'].map(k=>[k,`../assets/v4/${k}.webp`]),
 ['tree-variants','../assets/v9/tree-variants.webp'],
 ['tree-variants-snow','../assets/v10/tree-variants-snow.webp'],
 ['season-backgrounds','../assets/v10/season-backgrounds.webp'],
 ['season-particles','../assets/v10/season-particles.webp'],
 ['clay-breath','../assets/v10/clay-breath.webp'],
]);
export const images = new Map();
const runtimeDimensions=new Map(Object.entries(RUNTIME_ART).flatMap(([family,def])=>def.pages.map((p,i)=>[`runtime-${family}-${i}`,[p.width,p.height]])));
let pending;
export function loadAssets() {
 if(typeof Image==='undefined')return Promise.resolve([]);
 if(pending)return pending;
 pending=Promise.all(Object.entries(ASSET_PATHS).map(async([key,path])=>{
  const img=new Image(),url=new URL(path,import.meta.url).href;
  await new Promise((resolve,reject)=>{
   img.onload=resolve;
   img.onerror=()=>reject(new Error(`Não foi possível carregar ${key}: ${url}`));
   img.src=url;
  });
  if(!img.naturalWidth||!img.naturalHeight)
   throw new Error(`Imagem vazia ou inválida: ${key}`);
  const expected=runtimeDimensions.get(key);
  if(expected&&(img.naturalWidth!==expected[0]||img.naturalHeight!==expected[1]))
   throw new Error(`Dimensões incorretas no atlas obrigatório: ${key}`);
  // onload may precede decoding; await it, but do NOT claim GPU texture
  // residency: the browser may upload textures on first actual drawing.
  if(typeof img.decode==='function'){
   try{await img.decode();}
   catch(error){throw new Error(`Não foi possível decodificar ${key}: ${url}`,{cause:error});}
  }
  images.set(key,img);
  return img;
 })).catch(error=>{images.clear();pending=null;throw error;});
 return pending;
}
