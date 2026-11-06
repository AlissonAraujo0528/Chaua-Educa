import test from 'node:test';
import assert from 'node:assert/strict';
import {flightViewport,warningPosition,snakeWarningPosition} from '../Chaua-Educa-main/js/viewport.mjs';
import {Game} from '../Chaua-Educa-main/js/engine.mjs';
test('phone and desktop viewports reserve control bands and retain full vertical world',()=>{
 for(const [w,h] of [[320,568],[390,844],[768,1024],[844,390],[1440,960]]){
  const v=flightViewport(w,h,{top:24,bottom:20,left:12,right:12});
  assert.ok(v.x>=12&&v.x+v.w<=w-12+.001);assert.ok(v.y>=24+(h<=500?58:124));
  assert.ok(v.y+v.h<=h-20-(h<=500?64:104)+.001);assert.equal(v.h,640*v.scale);
  assert.ok((220-v.worldLeft)*v.scale>36);
 }
});
test('portrait enlarges world by a third and keeps at least 1.7 seconds of warning distance',()=>{
 const v=flightViewport(390,844);assert.ok(v.scale/(390/960)>1.3);
 assert.ok((v.worldLeft+v.worldWidth-220)/(300+50)>1.65);
});
test('hawk labels retain 108px width within playing area at both trajectory extremes',()=>{
 for(const [w,h] of [[320,568],[390,844],[844,390]]){
  const v=flightViewport(w,h);for(const y of [40,100,460,600]){const p=warningPosition(v,y);assert.ok(p.x>=v.x);assert.ok(p.x+108<=v.x+v.w);assert.ok(p.y>=v.y&&p.y+36<=v.y+v.h);}
 }
});
test('viewport changes cannot mutate physics or encounter state',()=>{
 const g=new Game({random:()=>.5});g.spawn();const before=JSON.stringify(g);
 flightViewport(390,844);flightViewport(844,390);assert.equal(JSON.stringify(g),before);
});

test('A2 attack warnings stay above the raised snake head without shifting legacy labels',()=>{
 const wood={x:360,bottom:442};
 for(const [width,height] of [[1200,720],[390,844],[844,390]]){
  const view=flightViewport(width,height);
  const original=snakeWarningPosition(view,wood);
  const a2=snakeWarningPosition(view,wood,true);
  assert.equal(original.x,view.x+(wood.x-view.worldLeft)*view.scale-30);
  assert.equal(original.y,view.y+(wood.bottom-155)*view.scale);
  assert.equal(a2.x,original.x);
  assert.ok(Math.abs((original.y-a2.y)-90*view.scale)<1e-9);
  assert.ok(a2.y>=view.y+4,'warning stays in playfield before collision avoidance');
 }
});
