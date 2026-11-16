import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeFrames} from '../Chaua-Educa-main/js/perf-probe.mjs';
import {SeasonalBackdrop} from '../Chaua-Educa-main/js/seasons.mjs';

test('real 1% low measures the mean frametime of the slowest 1%, not inverse p99',()=>{
 const data=[...Array(99).fill(16),116];
 const out=summarizeFrames(data);
 assert.equal(out.frames,100);
 assert.equal(out.frameP99Ms,16);
 assert.equal(out.onePercentLowFps,8.62);
 assert.equal(out.framesOver33Ms,1);
 assert.equal(out.framesOver50Ms,1);
 assert.ok(out.fps>50);
 const two=summarizeFrames([...Array(198).fill(16),100,200]);
 assert.equal(two.onePercentLowFps,6.67);
 assert.equal(summarizeFrames([]).onePercentLowFps,null);
});

test('seasonal backdrop emits readiness and invalidation events only when monitored',()=>{
 const old=globalThis.OffscreenCanvas;
 const calls=[];
 class Surface{
  constructor(w,h){this.width=w;this.height=h;}
  getContext(){return {save(){},restore(){},setTransform(){},beginPath(){},rect(){},clip(){},drawImage(){}};}
 }
 globalThis.OffscreenCanvas=Surface;
 try{
  const backdrop=new SeasonalBackdrop();
  backdrop.onTelemetry=(event,details)=>calls.push({event,details});
  const atlas={naturalWidth:1672,naturalHeight:941};
  const game={mode:'aventura',seed:104,elapsed:0,tutorial:false,distance:0};
  backdrop.prepare(atlas,400,300,1,game);
  assert.ok(calls.some(x=>x.event==='surface-start'));
  assert.ok(calls.some(x=>x.event==='surface-ready'));
  backdrop.prepare(atlas,550,300,1,game);
  assert.ok(calls.some(x=>x.event==='cache-reset'));
 }finally{globalThis.OffscreenCanvas=old;}
});
