import test from 'node:test';
import assert from 'node:assert/strict';
import {VisualQuality,canvasResolution} from '../Chaua-Educa-main/js/quality.mjs';
import {Game,FlightClock} from '../Chaua-Educa-main/js/engine.mjs';

test('profile-dependent frame cost cannot cause repeated upgrades during a three-minute flight',()=>{
 const q=new VisualQuality(),changes=[];let elapsed=0;
 while(elapsed<180){
  const dt=q.level==='high'?1/30:1/60;
  elapsed+=dt;if(q.sample(dt))changes.push(q.level);
 }
 assert.deepEqual(changes,['low']);
});

test('automatic quality requires sustained slowdown and reassesses on a new flight',()=>{
 const q=new VisualQuality();
 for(let i=0;i<59;i++)assert.equal(q.sample(1/30),false);
 let changed=false;for(let i=0;i<3;i++)changed=q.sample(1/30)||changed;
 assert.equal(changed,true);assert.equal(q.level,'low');
 for(let i=0;i<600;i++)q.sample(1/60);assert.equal(q.level,'low');
 for(let i=0;i<130;i++)q.sample(1/60);assert.equal(q.level,'low');
 assert.equal(q.beginFlight(),true);assert.equal(q.level,'high');
 for(let i=0;i<45;i++)assert.equal(q.sample(1/30),false);
});
test('hidden tabs and pauses discard samples, and manual quality stays selected',()=>{
 const q=new VisualQuality();
 for(let i=0;i<300;i++){q.sample(1/30,false);q.sample(.25);q.sample(1/60);}
 assert.equal(q.level,'high');
 for(const mode of ['high','low']){q.setMode(mode);for(let i=0;i<1000;i++)q.sample(1/30);assert.equal(q.beginFlight(),false);assert.equal(q.level,mode);assert.equal(q.mode,mode);}
 q.setMode('corrupt');assert.equal(q.mode,'auto');
});
test('mixed fast and slow frames downgrade within three seconds of active flight',()=>{
 for(const pattern of [[1/60,1/30],[.12,1/60],[.25,1/60],[.12,...Array(8).fill(1/60)]]){
  const q=new VisualQuality();let elapsed=0,index=0;
  while(q.level==='high'&&elapsed<3){const dt=pattern[index++%pattern.length];q.sample(dt);elapsed+=dt;}
  assert.equal(q.level,'low',`pattern ${pattern} was missed`);
  assert.ok(elapsed<=3);
 }
});
test('an isolated active stall does not reduce quality or contaminate the next window',()=>{
 const q=new VisualQuality();
 for(let i=0;i<180;i++)q.sample(1/60);
 assert.equal(q.sample(.25),false);
 for(let i=0;i<240;i++)assert.equal(q.sample(1/60),false);
 assert.equal(q.level,'high');
});
test('occasional missed frames do not force lower quality',()=>{
 const q=new VisualQuality();
 for(let i=0;i<1800;i++)assert.equal(q.sample(i%10===0?1/30:1/60),false);
 assert.equal(q.level,'high');
});
test('old slow frames expire instead of accumulating across healthy flight',()=>{
 const q=new VisualQuality();
 for(let i=0;i<15;i++)q.sample(1/30);
 for(let i=0;i<240;i++)q.sample(1/60);
 for(let i=0;i<15;i++)q.sample(1/30);
 assert.equal(q.level,'high');
 for(let i=0;i<50;i++)q.sample(1/30);
 assert.equal(q.level,'low');
});
test('changing quality mode starts with fresh measurements',()=>{
 const q=new VisualQuality();
 for(let i=0;i<45;i++)q.sample(1/30);
 q.setMode('low');
 for(let i=0;i<900;i++)assert.equal(q.sample(1/60),false);
 assert.equal(q.level,'low');
 q.setMode('auto');
 for(let i=0;i<45;i++)assert.equal(q.sample(1/30),false);
 assert.equal(q.level,'high');
});
test('inactive and invalid samples clear partial slowdown without unlocking low quality',()=>{
 for(const [seconds,active] of [[.25,false],[NaN,true],[Infinity,true],[0,true],[-1,true]]){
  const q=new VisualQuality();
  for(let i=0;i<45;i++)q.sample(1/30);
  q.sample(seconds,active);
  for(let i=0;i<45;i++)q.sample(1/30);
  assert.equal(q.level,'high');
  for(let i=0;i<30;i++)q.sample(1/30);
  assert.equal(q.level,'low');
  for(let i=0;i<660;i++)q.sample(1/60);
  q.sample(seconds,active);
  for(let i=0;i<660;i++)q.sample(1/60);
  assert.equal(q.level,'low');
 }
});
test('mixed load cannot oscillate quality even after a long healthy period',()=>{
 const q=new VisualQuality();let changes=0;
 for(let i=0;i<1500;i++)changes+=Number(q.sample(i%2?1/60:1/30));
 assert.equal(changes,1);assert.equal(q.level,'low');
 for(let i=0;i<660;i++)assert.equal(q.sample(1/60),false);
 q.sample(.12);
 for(let i=0;i<660;i++)assert.equal(q.sample(1/60),false);
 assert.equal(q.level,'low');
 for(let i=0;i<70;i++)changes+=Number(q.sample(1/60));
 assert.equal(q.level,'low');assert.equal(changes,1);
});
test('stable high-refresh displays remain high and only reassess at a new flight',()=>{
 for(const hz of [60,90,120,144,240]){
  const q=new VisualQuality();
  for(let i=0;i<hz*15;i++)assert.equal(q.sample(1/hz),false);
  assert.equal(q.level,'high');
  for(let i=0;i<75;i++)q.sample(1/30);
  assert.equal(q.level,'low');
  for(let i=0;i<hz*11;i++)q.sample(1/hz);
  assert.equal(q.level,'low');
  for(let i=0;i<hz*2;i++)q.sample(1/hz);
  assert.equal(q.level,'low');
  assert.equal(q.beginFlight(),true);assert.equal(q.level,'high');
  for(let i=0;i<hz*2;i++)assert.equal(q.sample(1/hz),false);
 }
});
test('a new flight discards unfinished slowdown measurements',()=>{
 const q=new VisualQuality();
 for(let i=0;i<45;i++)q.sample(1/30);
 assert.equal(q.beginFlight(),false);
 for(let i=0;i<45;i++)assert.equal(q.sample(1/30),false);
 assert.equal(q.level,'high');
});
test('backing canvas respects pixel budget on 4K and extreme displays',()=>{
 for(const [w,h,dpr] of [[3840,2160,2],[1920,1080,3],[390,844,3],[12000,8000,4]]){
  for(const mode of ['high','low']){
   const size=canvasResolution(w,h,dpr,mode);assert.ok(size.width*size.height<=4_000_000);
   assert.ok(size.dpr<=(mode==='low'?1:2));assert.ok(size.width>0&&size.height>0);
  }
 }
 assert.equal(canvasResolution(390,844,3,'low').dpr,1);
 assert.ok(Number.isFinite(canvasResolution(NaN,0,Infinity).dpr));
});
test('graphics quality cannot change fixed-step flight or encounter planning',()=>{
 const run=mode=>{
  const q=new VisualQuality(mode),g=new Game({seed:123});g.startTutorial();const clock=new FlightClock(g);
  for(let i=0;i<600;i++){q.sample(1/60);clock.advance(1/60);}
  return {y:g.y,vy:g.vy,elapsed:g.elapsed,score:g.score,distance:g.distance};
 };
 assert.deepEqual(run('low'),run('high'));assert.deepEqual(run('auto'),run('high'));
});
