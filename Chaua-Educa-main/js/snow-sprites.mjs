// Pregenerated-in-memory authored snow sprites: a fixed number of sprites
// is assembled ONCE during asset preload, never rebuilt during active flight.
// They use the exact approved 2026 winter WebP masks; AI prototype PNG sheets
// are deliberately excluded because their alpha/noise and silhouettes do not
// align with the original tree metadata.
import {images} from './assets.mjs';
import {FOREST_ART} from './forest-art-data.mjs';
import {clipSnowReveal} from './winter-vfx.mjs';

export const SNOW_FRAMES=16;
const FRAMES_PER_PAGE=8,RASTER_SCALE=.75,PAD=2;
const atlases=new Map();
export const snowSpriteMetrics={generated:0,buildMs:0,draws:0,estimatedBytes:0,ready:false};
function newCanvas(width,height){
 const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(width,height):
   typeof document!=='undefined'?document.createElement('canvas'):null;
 if(!c)return null;
 c.width=width;c.height=height;return c;
}
function geometry(f,upper){
 const [sx,sy]=f.rect,cx=f.content[0],cw=f.content[2];
 const top=upper?f.spliceY:0;
 const bottom=upper?Math.min(512,f.endY+30):f.spliceY;
 const capY=upper?f.spliceY:0;
 const capH=upper?bottom-f.spliceY:f.spliceY;
 return {sourceX:sx+cx,sourceY:sy+capY,cw,capH,clipX:sx,clipY:sy+top,clipH:bottom-top};
}
export function prepareSnowSprites(){
 if(snowSpriteMetrics.ready)return true;
 if(typeof performance==='undefined')return false;
 const first=performance.now();
 const pending=[];
 let totalBytes=0;
 for(const kind of ['lower','upper']){
  const image=images.get('trees-'+kind+'-overlay-04');
  if(!image)return false;
  const upper=kind==='upper',info=FOREST_ART[kind].map(f=>geometry(f,upper));
  const width=Math.ceil(Math.max(...info.map(v=>v.cw))*RASTER_SCALE);
  const height=Math.ceil(Math.max(...info.map(v=>v.capH))*RASTER_SCALE);
  const strideX=width+PAD*2,strideY=height+PAD*2;
  const pages=[];
  for(let page=0;page<Math.ceil(SNOW_FRAMES/FRAMES_PER_PAGE);page++){
   const canvas=newCanvas(strideX*4,strideY*FRAMES_PER_PAGE);
   if(!canvas)return false;
   const c=canvas.getContext('2d');
   if(!c)return false;
   c.imageSmoothingEnabled=true;
   for(let row=0;row<FRAMES_PER_PAGE;row++){
    const level=(page*FRAMES_PER_PAGE+row+1)/SNOW_FRAMES;
    for(let variant=0;variant<4;variant++){
     const g=info[variant],f=FOREST_ART[kind][variant];
     const x=variant*strideX+PAD,y=row*strideY+PAD;
     c.save();
     c.translate(x-g.sourceX*RASTER_SCALE,y-g.sourceY*RASTER_SCALE);
     c.scale(RASTER_SCALE,RASTER_SCALE);
     clipSnowReveal(c,g.clipX,g.clipY,512,g.clipH,level);
     c.drawImage(image,g.sourceX,g.sourceY,g.cw,g.capH,
      g.sourceX,g.sourceY,g.cw,g.capH);
     c.restore();
    }
   }
   totalBytes+=canvas.width*canvas.height*4;
   pages.push(canvas);
  }
  pending.push([kind,{image,pages,info,strideX,strideY,scale:RASTER_SCALE}]);
 }
 for(const entry of pending)atlases.set(...entry);
 snowSpriteMetrics.generated=SNOW_FRAMES*4*2;
 snowSpriteMetrics.estimatedBytes=totalBytes;
 snowSpriteMetrics.buildMs=Math.round((performance.now()-first)*100)/100;
 snowSpriteMetrics.ready=true;
 return true;
}
function drawStage(c,atlas,variant,stage,dx,dy,dw,dh){
 const index=stage-1,page=Math.floor(index/FRAMES_PER_PAGE),row=index%FRAMES_PER_PAGE;
 const g=atlas.info[variant],sx=variant*atlas.strideX+PAD,sy=row*atlas.strideY+PAD;
 const sw=Math.ceil(g.cw*atlas.scale),sh=Math.ceil(g.capH*atlas.scale);
 c.drawImage(atlas.pages[page],sx,sy,sw,sh,dx,dy,dw,dh);
 snowSpriteMetrics.draws++;
}
export function drawSnowSprites(c,kind,variant,snow,dx,dy,dw,dh){
 const atlas=atlases.get(kind);
 if(!atlas||atlas.image!==images.get('trees-'+kind+'-overlay-04'))return false;
 const v=Math.min(SNOW_FRAMES,Math.max(0,snow*SNOW_FRAMES));
 const lower=Math.floor(v),fraction=v-lower;
 // Complementary interpolation makes atlas transitions mathematically
 // continuous: at stage boundaries the previous layer has exactly zero
 // weight, so there is no 1-frame double-compositing discontinuity.
 // Frame alpha is unchanged at each exact authored stage.
 if(fraction>.00001&&lower<SNOW_FRAMES){
  if(lower>0){
   c.save();c.globalAlpha*=1-fraction;
   drawStage(c,atlas,variant,lower,dx,dy,dw,dh);
   c.restore();
  }
  c.save();c.globalAlpha*=fraction;
  drawStage(c,atlas,variant,lower+1,dx,dy,dw,dh);
  c.restore();
 }else if(lower>0){
  drawStage(c,atlas,variant,lower,dx,dy,dw,dh);
 }
 return true;
}

// Used during countdown, before the opaque seasonal background covers these
// tiny draws. This primes texture upload without affecting the game image.
export function warmupSnowSpriteTexture(c,index){
 const ordered=[...atlases.get('lower')?.pages||[],...atlases.get('upper')?.pages||[]];
 const source=ordered[index];if(!source)return false;
 c.save();c.setTransform(1,0,0,1,0,0);
 c.drawImage(source,0,0,1,1,0,0,1,1);
 c.restore();
 return true;
}
