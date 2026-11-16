import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../Chaua-Educa-main/js/engine.mjs';
import {parrotAction,hawkAction,ACTION_TIMINGS,SHIELD_REBOUND_FRAMES} from '../Chaua-Educa-main/js/action-states.mjs';
import {woodContactPosition,PARROT_IMPACT_BOUNDS} from '../Chaua-Educa-main/js/render.mjs';
import {hawkAngle,hawkShapes} from '../Chaua-Educa-main/js/collision.mjs';
import {hawkFlightProgress,predictedHawkY,advanceHawk} from '../Chaua-Educa-main/js/animals.mjs';

test('stunned hawk frames remain explicitly defined throughout the dazed phase',()=>{
 const values=[0,.14,.42,.78,1.08,1.7].map(retreatTime=>hawkAction({retreat:true,dazed:true,retreatTime}));
 assert.ok(values.some(x=>x.frame>0));
 for(const x of values){
  assert.equal(x.sheet,'hawk-stunned');
  assert.equal(x.next,x.frame);
  assert.equal(x.blend,0);
 }
});

test('shield rebound skips fatal spiral-eye artwork, preserving timing',()=>{
 assert.deepEqual(SHIELD_REBOUND_FRAMES,[0,1,4,5]);
 assert.equal(ACTION_TIMINGS.shieldRebound,.3);
 assert.equal(ACTION_TIMINGS.parrotImpact,1.2);
 for(let k=0;k<4;k++){
  const a=parrotAction({shieldHitAge:(k+.5)*ACTION_TIMINGS.shieldRebound/4});
  assert.equal(a.frame,SHIELD_REBOUND_FRAMES[k]);
 }
 assert.equal(parrotAction({defeated:true,impactProgress:1}).frame,3);
});

test('actual four parrot-impact alpha bounds determine only the visual contact recoil',()=>{
 assert.equal(PARROT_IMPACT_BOUNDS.length,4);
 const g=new Game();g.state='impact';g.y=320;g.angle=0;g.impactContact={x:260,y:100,w:40,h:400};
 for(const progress of [0,.25,.5,.75,1]){
  const next=woodContactPosition(g,progress,false);
  assert.ok(Number.isFinite(next.x) && next.x<=g.x);
  assert.equal(next.y,320);
 }
 const reduced=woodContactPosition(g,.5,true);
 assert.ok(Number.isFinite(reduced.x));
 assert.equal(g.x,220,'contact positioning must not modify the game or its hitbox');
});

test('hawk flight intercept uses identical interpolation for warning and movement',()=>{
 for(const [startY,targetY] of [[105,420],[535,200],[320,320]]){
  const e={startX:1100,targetX:160,x:1100,y:startY,startY,targetY,warning:0};
  assert.equal(hawkFlightProgress(e,e.startX),0);
  assert.equal(hawkFlightProgress(e,e.targetX),1);
  const at=predictedHawkY(e,220);
  assert.ok(at>=Math.min(startY,targetY)&&at<=Math.max(startY,targetY));
  const dt=(e.startX-220)/325;
  advanceHawk(e,dt,275,220);
  assert.ok(Math.abs(e.y-at)<1e-9,`warning ${at} disagrees with physics ${e.y}`);
 }
 const upward={x:500,y:400,startX:1100,targetX:160,startY:535,targetY:180,ascent:true};
 assert.ok(hawkAngle(upward)>0 && hawkAngle(upward)<=.28);
 assert.notDeepEqual(hawkShapes(upward),hawkShapes({...upward,ascent:false}));
});

test('pooling a feather particle slot cannot turn a later leaf into a feather or seed',()=>{
 const g=new Game();g.state='playing';
 g.particles=[{id:1,x:50,y:60,prevX:50,prevY:60,feather:true,seed:true,rotation:1,life:1,maxLife:1}];
 g.visual(.5);
 const slot=g._visualParticles[0];assert.equal(slot.feather,true);
 g.particles=[{id:2,x:80,y:90,prevX:80,prevY:90,life:1,maxLife:1}];
 const p=g.visual(.5).particles[0];
 assert.equal(p,slot);
 for(const key of ['feather','chip','splinter','seed','puff','spark'])assert.equal(p[key],false);
 assert.equal(p.rotation,undefined);
});
