import test from 'node:test';
import assert from 'node:assert/strict';
import {ForensicRecorder,aggregateOperations,overlaps} from '../Chaua-Educa-main/js/perf-forensics.mjs';
import {activeProbe,setActiveProbe} from '../Chaua-Educa-main/js/perf-hooks.mjs';
import DB from '../Chaua-Educa-main/js/database.js';
import {ENTRIES} from '../Chaua-Educa-main/js/collection.mjs';

test('correlate a measured storage stall without conflating it with nearby fruit events',()=>{
 let now=0;const p=new ForensicRecorder(()=>now);p.startedAt=0;
 p.event('fruit:collect',{gameSeconds:1});
 const start=p.begin('storage.write');now=73;
 p.end('storage.write',start,{key:'chaua-missions-v1'});
 p.beginFrame(75,0);now=77;p.endFrame();p.rememberStutter(1);
 const result=p.report([{frame:1,atSeconds:.073,frameMs:73}]);
 const found=result.correlatedStutters[0];
 assert.equal(found.attributionStatus,'measured-js-work-overlap');
 assert.equal(found.nearbyMeasuredOperations[0].name,'storage.write');
 assert.equal(found.nearbyGameEvents[0].name,'fruit:collect');
 assert.equal(found.nearbyFrameCpu.length,1);
 assert.equal(result.measuredOperations['storage.write'].count,1);
 assert.ok(result.limitations.some(s=>s.includes('GPU')));
});

test('coincidence alone is explicitly unattributed, not falsely blamed on JavaScript',()=>{
 let now=0;const p=new ForensicRecorder(()=>now);p.startedAt=0;
 now=95;p.event('snake:spawn');
 const result=p.report([{frame:1,atSeconds:.1,frameMs:80}]).correlatedStutters[0];
 assert.equal(result.attributionStatus,'unattributed');
 assert.equal(result.nearbyGameEvents[0].name,'snake:spawn');
 assert.deepEqual(result.nearbyMeasuredOperations,[]);
});

test('Long Animation Frame entries identify script entry points with bounded output',()=>{
 let now=200;const p=new ForensicRecorder(()=>now);p.startedAt=0;
 p.longFrame({entryType:'long-animation-frame',startTime:120,duration:85,blockingDuration:35,
  renderStart:172,styleAndLayoutStart:180,scripts:[{
   duration:61,sourceURL:'https://example.test/Chaua-Educa/js/script.js?perf-test=1',
   sourceFunctionName:'frame',invoker:'Window.requestAnimationFrame',
   forcedStyleAndLayoutDuration:4,pauseDuration:0
  }]});
 const result=p.report([{frame:2,atSeconds:.2,frameMs:90}]).correlatedStutters[0];
 assert.equal(result.attributionStatus,'browser-long-animation-frame-observed');
 assert.equal(result.nearbyLongAnimationFrames[0].scripts[0].source,'/Chaua-Educa/js/script.js');
 assert.equal(result.nearbyLongAnimationFrames[0].scripts[0].forcedLayoutMs,4);
});

test('bounded first draw is recorded once for each actual A2 image',()=>{
 let now=15;const p=new ForensicRecorder(()=>now);p.firstDraw('snake:idle',9.4);
 now=40;p.firstDraw('snake:idle',3);
 p.firstDraw('snake:attack',12.3);
 assert.deepEqual(p.events.map(e=>e.asset),['snake:idle','snake:attack']);
 assert.equal(overlaps(0,10,8,20),true);
 assert.equal(overlaps(0,7,8,20),false);
 assert.equal(aggregateOperations([{name:'vfx',ms:2},{name:'vfx',ms:9}]).vfx.over8Ms,1);
});

test('existing discovered fruits and entries are not re-written synchronously',()=>{
 const old=globalThis.localStorage,oldAvailable=DB.storageAvailable,oldMemory=DB.memory;
 const store=new Map(),writes=[];
 globalThis.localStorage={
  getItem(key){return store.has(key)?store.get(key):null;},
  setItem(key,value){writes.push(key);store.set(key,value);},
 };
 DB.memory=new Map();DB.storageAvailable=true;
 try{
  DB.unlock('Manga');DB.unlock('Manga');
  assert.equal(writes.filter(x=>x==='chaua-floresta-collection').length,1);
  const entry=ENTRIES[0].id;
  DB.discoverEntries([entry]);DB.discoverEntries([entry]);
  assert.equal(writes.filter(x=>x==='chaua-nature-discoveries').length,1);
  assert.ok(DB.unlocked().includes('Manga'));
  assert.ok(DB.discoveredEntries().includes(entry));
 }finally{
  globalThis.localStorage=old;DB.storageAvailable=oldAvailable;DB.memory=oldMemory;
 }
});
