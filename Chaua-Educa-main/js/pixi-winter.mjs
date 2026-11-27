// WebGL presentation for the recorded winter flight. Keep a single game clock.
// The existing artwork specifies the drawing order, atlas rectangles and poses.
import {Container, Sprite, Texture, Rectangle, Matrix, Graphics, GraphicsPath, CanvasSource, ImageSource, WebGLRenderer} from './vendor/pixi/pixi-8.6.6.mjs';

export async function createWinterRenderer(original){
 const canvas=document.createElement('canvas');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:-2;pointer-events:none';
 canvas.setAttribute('aria-hidden','true');
 const gpu=new WebGLRenderer();
 await gpu.init({canvas,width:original.width,height:original.height,antialias:true,resolution:1});
 original.after(canvas);
 canvas.hidden=true;
 const scene=new WinterScene(canvas);
 return {
  canvas,
  dispose(){canvas.remove();gpu.destroy();},
  draw(renderer,view,reduced,time){
   if(gpu.gl.isContextLost())throw new Error('Contexto WebGL perdido. Recarregue o teste.');
   if(canvas.width!==original.width||canvas.height!==original.height)gpu.resize(original.width,original.height);
   scene.begin();
   const previous=renderer.c;
   renderer.c=scene;
   try{renderer.game(view,reduced,time);}
   finally{renderer.c=previous;}
   gpu.render(scene.root);
   canvas.hidden=false;
  }
 };
}

class WinterScene {
 constructor(canvas){
  this.canvas=canvas;
  // The native context holds Canvas drawing state only, never a frame image.
  this.state=document.createElement('canvas').getContext('2d');
  this.root=new Container();
  this.sources=new WeakMap();
  this.patterns=new WeakMap();
  this.sprites=[];this.graphics=[];this.groups=[];this.patches=[];
  this.parents=[];
  this.matrix=new Matrix();
 }
 begin(){
  this.root.removeChildren();
  for(let i=0;i<(this.groupCount||0);i++){
   this.groups[i].mask=null;this.groups[i].removeChildren();
  }
  this.spriteCount=this.graphicCount=this.groupCount=this.patchCount=0;
  this.parent=this.root;
  this.parents.length=0;
  this.state.reset();
  this.transformCache=null;
 }
 save(){this.state.save();this.parents.push(this.parent);}
 restore(){this.state.restore();this.parent=this.parents.pop()||this.root;this.transformCache=null;}
 getTransform(){return this.transformCache??=this.state.getTransform();}
 position(node,x=0,y=0,sx=1,sy=1){
  const m=this.getTransform();
  node.setFromMatrix(this.matrix.set(m.a*sx,m.b*sx,m.c*sy,m.d*sy,m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f));
  node.alpha=this.globalAlpha;
  this.parent.addChild(node);
 }
 source(image){
  let entry=this.sources.get(image);
  if(!entry){
   const Source=image instanceof HTMLCanvasElement||(typeof OffscreenCanvas!=='undefined'&&image instanceof OffscreenCanvas)?CanvasSource:ImageSource;
   const source=new Source({resource:image,resolution:1,autoGenerateMipmaps:false});
   entry={source,full:new Texture({source}),frames:new Map()};this.sources.set(image,entry);
  }
  return entry;
 }
 refreshImage(image){this.sources.get(image)?.source.update();}
 drawImage(image,...args){
  const entry=this.source(image);
  let texture=entry.full,dx,dy,dw,dh;
  if(args.length===8){
   const [x,y,w,h]=args;
   if(w<=0||h<=0)return;
   const key=x+','+y+','+w+','+h;
   texture=entry.frames.get(key);
   if(!texture){
    texture=new Texture({source:entry.source,frame:new Rectangle(x,y,w,h)});
    entry.frames.set(key,texture);
   }
   [, , , ,dx,dy,dw,dh]=args;
  }else{
   [dx,dy,dw=texture.width,dh=texture.height]=args;
  }
  const i=this.spriteCount++;
  const sprite=this.sprites[i]??=new Sprite();
  sprite.texture=texture;
  this.position(sprite,dx,dy,dw/texture.width,dh/texture.height);
 }
 createPattern(image,repeat){
  const pattern=this.state.createPattern(image,repeat);
  this.patterns.set(pattern,image);return pattern;
 }
 fillRect(x,y,w,h){
  const tile=this.patterns.get(this.fillStyle);
  if(tile){
   // Bark tiles are mirrored pairs. Preserve the phase at the cap splice.
   for(let top=y;top<y+h;){
    const offset=((top%tile.height)+tile.height)%tile.height;
    const band=Math.min(tile.height-offset,y+h-top);
    if(band<1e-7)break;
    // Use a per-draw frame for the continuously changing final partial band.
    this.barkBand(tile,x,top,w,band,offset);
    top+=band;
   }
   return;
  }
  this.beginPath();this.rect(x,y,w,h);this.fill();
 }
 barkBand(tile,x,y,width,height,offset){
  const entry=this.source(tile),i=this.spriteCount++;
  const sprite=this.sprites[i]??=new Sprite();
  let tex=sprite.barkTexture;
  if(!tex||tex.source!==entry.source){
   tex?.destroy(false);
   tex=sprite.barkTexture=new Texture({source:entry.source,frame:new Rectangle(),dynamic:true});
  }
  tex.frame.x=0;tex.frame.y=offset;tex.frame.width=tile.width;tex.frame.height=height;
  tex.updateUvs();tex.update();
  sprite.texture=tex;
  this.position(sprite,x,y,width/tile.width,1);
 }
 beginPath(){this.path=new GraphicsPath();this.nativePath=new Path2D();}
 ellipse(x,y,rx,ry,rotation,start,end){
  this.nativePath.ellipse(x,y,rx,ry,rotation,start,end);
  // All ellipses in the winter flight are complete.
  const p=new GraphicsPath().ellipse(0,0,rx,ry);
  this.path.addPath(p,new Matrix().rotate(rotation).translate(x,y));
 }
 graphic(){
  const i=this.graphicCount++;
  const node=this.graphics[i]??=new Graphics();
  node.clear().path(this.path);this.position(node);return node;
 }
 clip(){
  const mask=this.graphic().fill(0xffffff);
  mask.alpha=1;
  const i=this.groupCount++;
  const group=this.groups[i]??=new Container();
  this.parent.addChild(group);group.mask=mask;this.parent=group;
 }
 fill(){
  if(typeof this.fillStyle==='string')this.graphic().fill(this.fillStyle);
  else this.paintPath('fill');
 }
 stroke(){
  if(this.state.getLineDash().length||typeof this.strokeStyle!=='string'){this.paintPath('stroke');return;}
  this.graphic().stroke({color:this.strokeStyle,width:this.lineWidth,cap:this.lineCap,join:this.lineJoin});
 }
 // Preserve the original dashes and gradient art in tightly bounded sprites.
 paintPath(mode){
  const b=this.path.bounds,pad=2+(mode==='stroke'?this.lineWidth:0);
  const x=Math.floor(b.minX-pad),y=Math.floor(b.minY-pad);
  const width=Math.ceil(b.maxX+pad-x),height=Math.ceil(b.maxY+pad-y);
  if(!(width>0&&height>0))return;
  const i=this.patchCount++;
  const surf=this.patches[i]??=document.createElement('canvas');
  if(surf.width!==width)surf.width=width;
  if(surf.height!==height)surf.height=height;
  const c=surf.getContext('2d');c.reset();c.translate(-x,-y);
  c.fillStyle=this.fillStyle;c.strokeStyle=this.strokeStyle;c.lineWidth=this.lineWidth;
  c.lineCap=this.lineCap;c.lineJoin=this.lineJoin;c.setLineDash(this.state.getLineDash());
  c[mode](this.nativePath);
  const previous=this.sources.get(surf);
  if(previous){previous.source.resize(width,height);previous.source.update();}
  this.drawImage(surf,x,y,width,height);
 }
}

for(const name of ['translate','scale','rotate','transform','setTransform']){
 WinterScene.prototype[name]=function(...args){this.state[name](...args);this.transformCache=null;};
}
for(const name of ['moveTo','lineTo','rect','roundRect','arc','closePath','bezierCurveTo','quadraticCurveTo']){
 WinterScene.prototype[name]=function(...args){this.path[name](...args);this.nativePath[name](...args);};
}
for(const name of ['globalAlpha','fillStyle','strokeStyle','lineWidth','lineCap','lineJoin']){
 Object.defineProperty(WinterScene.prototype,name,{
  get(){return this.state[name];},set(value){this.state[name]=value;}
 });
}
for(const name of ['setLineDash','createLinearGradient','createRadialGradient']){
 WinterScene.prototype[name]=function(...args){return this.state[name](...args);};
}
