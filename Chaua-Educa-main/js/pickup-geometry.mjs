import {COLLISION_ART} from './collision-art-data.mjs';
import {FOODS} from './foods.mjs';
import {shapesIntersect,shapesHitRect,rectShape} from './collision.mjs';
export function pickupPose(e,time=0,reduced=false){
 return {float:reduced?0:Math.sin(time*2+(e.id??0))*3,pulse:reduced?1:1+Math.sin(time*3.2+(e.id??0))*.07,
  angle:e.kind==='pepper'&&!reduced?Math.sin(time*3+(e.id??0))*.15:0,
  frame:reduced?0:Math.floor(Math.max(0,time)*7+(e.id??0))%4};
}
export function pickupShapes(e,time=0,reduced=false){
 const p=pickupPose(e,time,reduced),size=e.kind==='fruit'?60:e.kind==='feather'?64:58;
 if(e.kind==='pepper'){
  // The pepper is a code-native drawing; this inset follows its red flesh.
  const points=rectShape({x:-6,y:-10,w:16,h:26}),cos=Math.cos(p.angle),sin=Math.sin(p.angle);
  return [points.map(v=>({x:e.x+(v.x*cos-v.y*sin)*p.pulse,y:e.y+(p.float+v.x*sin+v.y*cos)*p.pulse}))];
 }
 const index=e.kind==='fruit'?(FOODS[e.variety]?.slot??0)*4+p.frame:0;
 const spans=COLLISION_ART.pickups[e.kind]?.[index];
 if(!spans)throw new Error(`Missing current pickup mask: ${e.kind}/${index}`);
 const unit=size/16*p.pulse;
 return spans.map(([col,row,width])=>rectShape({x:e.x+(col-8)*unit,y:e.y+p.float*p.pulse+(row-8)*unit,w:width*unit,h:unit}));
}
const scratchSpanRect = {x: 0, y: 0, w: 0, h: 0};
export function pickupHitsPlayer(e,player,time=0,reduced=false){
 if(e.kind==='pepper'){
  const shapes=pickupShapes(e,time,reduced);
  return shapesIntersect(player,shapes);
 }
 const p=pickupPose(e,time,reduced),size=e.kind==='fruit'?60:e.kind==='feather'?64:58;
 const index=e.kind==='fruit'?(FOODS[e.variety]?.slot??0)*4+p.frame:0;
 const spans=COLLISION_ART.pickups[e.kind]?.[index];
 if(!spans)throw new Error(`Missing current pickup mask: ${e.kind}/${index}`);
 const unit=size/16*p.pulse;
 const baseY=e.y+p.float*p.pulse;
 scratchSpanRect.h=unit;
 for(let i=0;i<spans.length;i++){
  const [col,row,width]=spans[i];
  scratchSpanRect.x=e.x+(col-8)*unit;
  scratchSpanRect.y=baseY+(row-8)*unit;
  scratchSpanRect.w=width*unit;
  if(shapesHitRect(player,scratchSpanRect))return true;
 }
 return false;
}
