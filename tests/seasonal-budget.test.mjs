import test from 'node:test';
import assert from 'node:assert/strict';
import {SeasonalBackdrop} from '../Chaua-Educa-main/js/seasons.mjs';
import {setWeatherMode} from '../Chaua-Educa-main/js/weather.mjs';
import {climateReferenceSeconds} from '../Chaua-Educa-main/js/climate-progress.mjs';

// Deterministic OffscreenCanvas model measures *wall-clock* time per draw and
// verifies the bounded scheduler, not device GPU throughput or visual parity.
test('seasonal cache prewarms incremental surfaces and never loses a visible season',()=>{
 const original=globalThis.OffscreenCanvas;
 let now=0;
 const created=[];
 class FakeOffscreenCanvas {
  constructor(width,height){this.width=width;this.height=height;created.push(this);}
  getContext(){return {
   save(){},restore(){},setTransform(){},beginPath(){},rect(){},clip(){},
   drawImage(){now+=.75;}
  };}
 }
 globalThis.OffscreenCanvas=FakeOffscreenCanvas;
 try{
  setWeatherMode('auto');
  const events=[],atlas={naturalWidth:2048,naturalHeight:1024};
  const b=new SeasonalBackdrop({prewarmSeconds:18,sliceRows:24,budgetMs:1.8,now:()=>now});
  b.onTelemetry=(name,data)=>events.push({name,...data});
  const game={mode:'aventura',seed:694180000,elapsed:0};
  const transition=.2*climateReferenceSeconds(game.mode,game.seed);
  b.prepare(atlas,800,500,1,game);
  assert.ok(b.frames.has(0),'spring is ready synchronously for visible draw');
  assert.equal(b.pending,null);
  game.elapsed=transition-17.5;
  b.prepare(atlas,800,500,1,game);
  assert.equal(b.pending?.id,1,'summer is prepared 18s ahead of transition');
  assert.ok(b.pending.row<=72 && b.pending.row>0,'one frame must use a short bounded number of slices');
  let steps=0;
  while(!b.frames.has(1) && steps++<100)b.prepare(atlas,800,500,1,game);
  assert.ok(b.frames.has(1),'upcoming summer finishes with ordinary active frames');
  assert.ok(steps>1,'surface was not generated in one expensive call');
  assert.ok(!events.some(e=>e.name==='surface-urgent'&&e.seasonId===1),'summer never required urgent fallback');
  const ready=events.find(e=>e.name==='surface-ready'&&e.seasonId===1);
  assert.ok(ready && ready.slices>1 && ready.drawMs>0,'telemetry separates canvas draw time from wall duration');
  game.elapsed=transition+.01;
  const visible=b.prepare(atlas,800,500,1,game);
  assert.equal(visible.to,1);
  assert.ok(b.frames.has(0)&&b.frames.has(1),'both crossfade surfaces present');
  const oldSummer=b.frames.get(1);
  b.prepare(atlas,900,500,1,game);
  assert.equal(oldSummer.width,0,'resize discards prior resolution surfaces');
  assert.ok(created.length>=3);
 }finally{
  if(original===undefined)delete globalThis.OffscreenCanvas;
  else globalThis.OffscreenCanvas=original;
  setWeatherMode('auto');
 }
});

test('over-budget first slice does not accumulate extra speculative work',()=>{
 const original=globalThis.OffscreenCanvas;
 let now=0;
 class FakeOffscreenCanvas {
  constructor(w,h){this.width=w;this.height=h;}
  getContext(){return {save(){},restore(){},setTransform(){},beginPath(){},rect(){},clip(){},drawImage(){now+=4;}};}
 }
 globalThis.OffscreenCanvas=FakeOffscreenCanvas;
 try{
  setWeatherMode('auto');
  const b=new SeasonalBackdrop({now:()=>now,sliceRows:24,budgetMs:1.8});
  const atlas={naturalWidth:2048,naturalHeight:1024};
  const game={mode:'aventura',seed:104,elapsed:0};
  b.prepare(atlas,800,500,1,game);
  game.elapsed=.2*climateReferenceSeconds(game.mode,game.seed)-17;
  b.prepare(atlas,800,500,1,game);
  assert.equal(b.pending.id,1);
  assert.equal(b.pending.row,24,'one slow slice may exceed the soft budget but stops further work');
  assert.ok(now>=8,'the test deliberately simulated a costly first slice');
  const events=[];b.onTelemetry=(name,details)=>events.push({name,...details});
  game.elapsed=.2*climateReferenceSeconds(game.mode,game.seed)+.1;
  b.prepare(atlas,800,500,1,game);
  assert.ok(b.frames.has(1),'urgent fallback prioritizes correctness');
  assert.ok(events.some(e=>e.name==='surface-urgent'&&e.seasonId===1),'urgent fallback is observable');
 }finally{
  if(original===undefined)delete globalThis.OffscreenCanvas;
  else globalThis.OffscreenCanvas=original;
  setWeatherMode('auto');
 }
});
