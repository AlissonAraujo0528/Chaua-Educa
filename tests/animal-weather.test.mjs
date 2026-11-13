import test from 'node:test';
import assert from 'node:assert/strict';
import {AnimalWeather,animalContactPoints,drawAnimalSurface} from '../Chaua-Educa-main/js/animal-weather.mjs';
import {ANIMAL_CONTACTS} from '../Chaua-Educa-main/js/animal-contact-data.mjs';
const identity={a:1,b:0,c:0,d:1,e:0,f:0};
function context(matrix=identity){
 const calls=[];
 return new Proxy({matrix,calls,getTransform(){return this.matrix;}},{get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args]);}});
}
const pose={sheet:'parrot-flight',frame:0,rect:[-77,-77,154,154]};
function run(fx,c,time,opts={},actor={}){fx.begin(c,{time,seed:42,snow:1,wet:1,...opts});fx.actor(c,{id:'bird',pose,moving:false,...actor});}
test('contacts cover every flight, legacy pose and official A2 frame without face data',()=>{
 for(const [sheet,frames] of Object.entries(ANIMAL_CONTACTS)){
  assert.equal(frames.length,['chaua','hawk'].includes(sheet)?16:8);
  for(let frame=0;frame<frames.length;frame++){
   assert.equal(frames[frame].length,3);
   for(const [x,y] of frames[frame])assert.ok(x>0&&y>0&&x<384&&y<384);
   const rect=[-100,-200,200,200];
   const a=animalContactPoints({sheet,frame,rect}),b=animalContactPoints({sheet,frame,rect,mirror:true});
   assert.deepEqual(b,a.map(([x,y])=>[-x,y]),'A2 mirror must match the exact rendered strike pose');
  }
 }
});
test('snow is subtle and static in reduced motion, absent before deposition',()=>{
 const points=animalContactPoints(pose),c=context();
 drawAnimalSurface(c,points,{snow:0});assert.equal(c.calls.length,0);
 drawAnimalSurface(c,points,{snow:1,reduced:true});
 assert.equal(c.calls.filter(x=>x[0]==='stroke').length,3);
 assert.ok(c.calls.every(x=>!['drawImage','fillRect'].includes(x[0])));
 const low=context();drawAnimalSurface(low,points,{snow:1,low:true});
 assert.equal(low.calls.filter(x=>x[0]==='stroke').length,2);
});
test('wing release detaches from translated mirrored pose; gravity is world-down',()=>{
 const fx=new AnimalWeather(),c=context({a:2,b:0,c:0,d:2,e:25,f:60});
 run(fx,c,0);fx.draw(c);
 fx.begin(c,{time:.1,seed:42,snow:1,wet:0});
 c.matrix={a:-2,b:0,c:0,d:2,e:225,f:160};
 fx.actor(c,{id:'bird',pose,moving:true});
 assert.equal(fx.particles.length,3);
 const first={...fx.particles[0]};
 const point=animalContactPoints(pose)[0];
 assert.ok(fx.particles.some(p=>Math.abs(p.x-(100-point[0]))<1e-8));
 fx.draw(c);c.matrix={...identity,e:999,f:999};
 run(fx,c,.2,{}, {moving:true});
 assert.equal(fx.particles.length,3,'a held downstroke cannot continuously spawn particles');
 const p=fx.particles[0];assert.ok(Math.abs(p.x-first.x)<5,'detached snow followed the moving animal');
 assert.ok(p.vy>first.vy,'gravity must increase world Y even with a flipped character');
 assert.ok(fx.actors.get('bird').load<1,'shaking removes deposited snow');
});
test('pause freezes trajectories, new run resets, reduced motion and Low enforce budgets',()=>{
 const fx=new AnimalWeather(),c=context();run(fx,c,0);fx.draw(c);run(fx,c,.1,{}, {moving:true});fx.draw(c);
 const snap=JSON.stringify(fx.particles);run(fx,c,.1,{}, {moving:true});assert.equal(JSON.stringify(fx.particles),snap);fx.draw(c);
 for(let i=2;i<100;i++){run(fx,c,i*.02,{low:true,rain:1},{moving:i%2===0});fx.draw(c);assert.ok(fx.particles.length<=8);}
 run(fx,c,2.1,{reduced:true});assert.equal(fx.particles.length,0);fx.draw(c);
 run(fx,c,0);assert.equal(fx.particles.length,0);assert.equal(fx.actors.size,1);
});
test('rain beads release after surface residence, dry weather never emits water',()=>{
 const fx=new AnimalWeather(),c=context();run(fx,c,0,{snow:0,wet:1,rain:1});fx.draw(c);
 run(fx,c,.4,{snow:0,wet:1,rain:1});assert.equal(fx.particles.length,0);fx.draw(c);
 run(fx,c,.81,{snow:0,wet:1,rain:1});assert.equal(fx.particles.length,1);assert.equal(fx.particles[0].snow,false);fx.draw(c);
 run(fx,c,0,{snow:0,wet:0,rain:0});fx.draw(c);run(fx,c,1,{snow:0,wet:0,rain:0},{moving:true});assert.equal(fx.particles.length,0);
});
test('first snow contacts precede deposition, while reduced motion stays static',()=>{
 const points=animalContactPoints(pose),c=context();
 drawAnimalSurface(c,points,{snow:0,snowfall:1,time:0});
 assert.ok(c.calls.some(x=>x[0]==='arc'));
 assert.ok(!c.calls.some(x=>x[0]==='stroke'),'first snow cannot create a full permanent coat');
 const reduced=context();drawAnimalSurface(reduced,points,{snow:0,snowfall:1,time:0,reduced:true});
 assert.equal(reduced.calls.length,0);
});
test('dry frames create no contact records; a predator entering in a dive releases once',()=>{
 const fx=new AnimalWeather(),c=context();
 run(fx,c,0,{snow:0,wet:0});assert.equal(fx.actors.size,0);fx.draw(c);
 fx.begin(c,{time:.1,seed:42,snow:1});
 fx.actor(c,{id:'hawk',pose:{sheet:'hawk',frame:8,rect:[-100,-100,200,200]},moving:true});
 assert.equal(fx.particles.length,3);fx.draw(c);
 fx.begin(c,{time:.2,seed:42,snow:1});
 fx.actor(c,{id:'hawk',pose:{sheet:'hawk',frame:8,rect:[-100,-100,200,200]},moving:true});
 assert.equal(fx.particles.length,3);
});
