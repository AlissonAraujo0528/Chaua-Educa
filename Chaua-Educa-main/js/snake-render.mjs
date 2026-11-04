import {SPRITES} from './sprite-data.mjs';
import {snakeMotion,deformSnakePoint} from './snake-motion.mjs';

function triangle(c,image,src,dst){
 const [a,b,d]=src,[p,q,r]=dst,den=(b.x-a.x)*(d.y-a.y)-(d.x-a.x)*(b.y-a.y);
 if(Math.abs(den)<1e-7)return;
 const invDen=1/den;
 const A=((q.x-p.x)*(d.y-a.y)-(r.x-p.x)*(b.y-a.y))*invDen,B=((q.y-p.y)*(d.y-a.y)-(r.y-p.y)*(b.y-a.y))*invDen;
 const C=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(d.x-a.x))*invDen,D=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(d.x-a.x))*invDen;
 const cx=(p.x+q.x+r.x)/3,cy=(p.y+q.y+r.y)/3;
 // Subpixel overlap prevents antialiasing cracks between adjacent triangles.
 const d0x=p.x-cx,d0y=p.y-cy,l0=Math.hypot(d0x,d0y)||1;
 const d1x=q.x-cx,d1y=q.y-cy,l1=Math.hypot(d1x,d1y)||1;
 const d2x=r.x-cx,d2y=r.y-cy,l2=Math.hypot(d2x,d2y)||1;
 c.save();
 c.beginPath();
 c.moveTo(p.x+d0x/l0*.35,p.y+d0y/l0*.35);
 c.lineTo(q.x+d1x/l1*.35,q.y+d1y/l1*.35);
 c.lineTo(r.x+d2x/l2*.35,r.y+d2y/l2*.35);
 c.closePath();
 c.clip();
 c.transform(A,B,C,D,p.x-A*a.x-C*a.y,p.y-B*a.x-D*a.y);
 c.drawImage(image,0,0,384,384,0,0,384,384);
 c.restore();
}

const NECK_ROWS=[180,190,200,210,220,230,240,250,260,270,280];

function drawMesh(c,image,s,factor,pose){
 const data=SPRITES.snake,h=data.frames[0].head;
 const project=(x,y)=>{const p=deformSnakePoint(x,y,pose);return {x:(p.x-192)*factor,y:(p.y-328)*factor};};

 // 1. Top region (y: 0..180) has weight w === 1.0 everywhere: pure rigid-body transform.
 c.save();
 c.translate((h[0]-192+pose.x)*factor,(h[1]-328+pose.y)*factor);
 c.rotate(pose.angle);
 c.drawImage(image,0,0,384,180.5,-h[0]*factor,-h[1]*factor,384*factor,180.5*factor);
 c.restore();

 // 2. Deforming neck region (y: 180..280): 10 strips with exact affine triangles.
 let top=NECK_ROWS[0];
 let tl=project(0,top),tr=project(384,top);
 for(let i=1;i<NECK_ROWS.length;i++){
  const bottom=NECK_ROWS[i];
  const bl=project(0,bottom),br=project(384,bottom);
  const s0={x:0,y:top},s1={x:384,y:top},s2={x:384,y:bottom},s3={x:0,y:bottom};
  triangle(c,image,[s0,s1,s2],[tl,tr,br]);
  triangle(c,image,[s0,s2,s3],[tl,br,bl]);
  top=bottom;tl=bl;tr=br;
 }

 // 3. Base coil region (y: 280..384) has weight w === 0.0 everywhere: completely static.
 c.drawImage(image,0,279.5,384,104.5,-192*factor,(279.5-328)*factor,384*factor,104.5*factor);

 if(pose.mouth>0){
  const open=data.frames[10],o=open.head,scale=h[2]/o[2];
  c.save();
  c.translate((h[0]-192+pose.x)*factor,(h[1]-328+pose.y)*factor);
  c.rotate(pose.angle);
  c.scale(factor,factor);
  c.beginPath();
  c.ellipse(-16,23,40,23,0,0,Math.PI*2);
  c.clip();
  c.globalAlpha*=pose.mouth;
  c.drawImage(image,...open.rect,-o[0]*scale,-o[1]*scale,384*scale,384*scale);
  c.restore();
 }
}

let surface,surfaceCtx,cachedImage=null,cachedFactor=0,cachedX=NaN,cachedY=NaN,cachedAngle=NaN,cachedMouth=NaN;

export function drawContinuousSnake(c,image,s,factor,reduced=false){
 if(!image)return;
 if(reduced){
  c.drawImage(image,...SPRITES.snake.frames[0].rect,-192*factor,-328*factor,384*factor,384*factor);
  return;
 }
 const pose=snakeMotion(s,false);
 if(!surface&&typeof OffscreenCanvas!=='undefined')surface=new OffscreenCanvas(512,512);
 if(!surface&&typeof document!=='undefined'){surface=document.createElement('canvas');surface.width=surface.height=512;}
 if(!surface){drawMesh(c,image,s,factor,pose);return;}
 if(!surfaceCtx)surfaceCtx=surface.getContext('2d');

 const dirty=cachedImage!==image||cachedFactor!==factor||
  Math.abs(pose.x-cachedX)>1e-4||Math.abs(pose.y-cachedY)>1e-4||
  Math.abs(pose.angle-cachedAngle)>1e-4||Math.abs(pose.mouth-cachedMouth)>1e-4;

 if(dirty){
  cachedImage=image;cachedFactor=factor;
  cachedX=pose.x;cachedY=pose.y;cachedAngle=pose.angle;cachedMouth=pose.mouth;
  const layer=surfaceCtx;
  layer.setTransform(1,0,0,1,0,0);
  layer.clearRect(0,0,512,512);
  layer.setTransform(2,0,0,2,256,256);
  layer.globalAlpha=1;
  layer.globalCompositeOperation='source-over';
  drawMesh(layer,image,s,factor,pose);
 }
 c.drawImage(surface,-128,-128,256,256);
}