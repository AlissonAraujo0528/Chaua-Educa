const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   let id=0,time=100;const callbacks=new Map();
   window.requestAnimationFrame=fn=>{callbacks.set(++id,fn);return id;};
   window.cancelAnimationFrame=id=>callbacks.delete(id);
   window.stepQuality=seconds=>{time+=seconds*1000;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn(time));};
  });
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
  await page.locator('#start-training:not([disabled])').waitFor();
  await page.bringToFront();
  await page.locator('#start-training').click();
  await page.evaluate(async()=>{
   const {game}=await import('/js/script.js');const {Renderer}=await import('/js/render.mjs');const draw=Renderer.prototype.game;Renderer.prototype.game=function(...args){window.activeRenderer=this;return draw.apply(this,args);};game.startTutorial();game.state='playing';game.snapshot();window.stepQuality(1/60);
  });
  const step=(pattern,count)=>page.evaluate(({pattern,count})=>{
   for(let i=0;i<count;i++)window.stepQuality(pattern[i%pattern.length]);
  },{pattern,count});
  const state=()=>page.evaluate(async()=>({
   state:(await import('/js/script.js')).game.state,
   width:document.querySelector('#forest').width,
   stored:JSON.parse(localStorage.getItem('chaua-visual-quality')),
   decoration:window.activeRenderer?.decoration,
   resolution:window.activeRenderer?.resolution
  }));
  const mode=async value=>{
   await page.locator('#quality-mode').evaluate((select,value)=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));},value);
  };
  // Exercise the real frame loop, controller, renderer resize and setting handler.
  await mode('auto');assert.equal((await state()).width,780);assert.equal((await state()).decoration,'high');
  await step([.25],1);await step([1/60],180);
  assert.equal((await state()).width,780,'one stall must not lower quality');
  await step([1/60,1/30],100);
  assert.equal((await state()).width,390,'mixed active slowdown must resize the renderer');
  assert.equal((await state()).decoration,'high','Automatic must keep all forest effects when resolution falls');
  assert.equal((await state()).state,'playing');
  await step([1/60],660);assert.equal((await state()).width,390,'healthy low frames cannot prove high is sustainable');
  await page.locator('#pause-button').click();await step([1/30],90);
  assert.equal((await state()).state,'paused');
  await page.locator('#resume-button').click();await step([1/60],120);
  await step([1/60],600);assert.equal((await state()).width,390,'pause must not unlock a degraded profile');
  await step([1/60],120);assert.equal((await state()).width,390);
  await mode('high');await step([.12,1/60],60);
  assert.equal((await state()).width,780);assert.equal((await state()).stored,'high');
  assert.equal((await state()).decoration,'high','Manual High keeps full effects');
  await mode('low');await step([1/60],780);
  assert.equal((await state()).width,390);assert.equal((await state()).stored,'low');
  assert.equal((await state()).decoration,'low','Manual Low must retain its existing reduced decoration');
  await mode('auto');await step([.12,1/60],40);
  assert.equal((await state()).width,390,'recurring active stalls above 100 ms must count');
  assert.equal((await state()).decoration,'high','Automatic must restore full effects after Manual Low');
  assert.equal((await state()).stored,'auto');
  const restart=async()=>{
   await page.locator('#pause-button').click();
   await page.locator('#pause-dialog .back-home').click();
   await page.locator('#start-training').click();
  };
  await restart();assert.equal((await state()).width,780,'new Auto flight must reassess High');
  await step([1/60],240);
  await mode('low');await restart();assert.equal((await state()).width,390,'new flight must preserve manual Low');
  await step([1/60],240);
  await mode('high');await restart();assert.equal((await state()).width,780,'new flight must preserve manual High');
  assert.deepEqual(errors,[]);
  console.log('Automatic quality: real frame loop, renderer, manual settings, pause and reduced motion passed.');
  await page.close();
  // Native scheduling + real rendering. Deliberately expensive High reproduces
  // profile-dependent load on fast CI machines; this is not a hardware FPS claim.
  const live=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2}),liveErrors=[];
  live.on('pageerror',e=>liveErrors.push(e.message));
  await live.addInitScript(()=>localStorage.setItem('chaua-visual-quality',JSON.stringify('auto')));
  await live.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
  await live.locator('#start-training:not([disabled])').click();
  await live.evaluate(async()=>{
   const {game}=await import('/js/script.js'),{Renderer}=await import('/js/render.mjs');
   window.qualityTransitions=[];
   const set=Renderer.prototype.setQuality;
   Renderer.prototype.setQuality=function(level){const old=this.quality;const result=set.call(this,level);if(old!==level)window.qualityTransitions.push(level);window.profileDecoration=this.decoration;return result;};
   const draw=Renderer.prototype.game;
   Renderer.prototype.game=function(...args){const start=performance.now();const result=draw.apply(this,args);if(this.quality==='high')while(performance.now()-start<35){}return result;};
   game.startTutorial();game.state='playing';game.elapsed=35;game.distance=15000;game.stage=2;game.stageAge=10;game.y=320;game.snapshot();
  });
  for(let i=0;i<4;i++)await live.waitForTimeout(10000);
  const native=await live.evaluate(async()=>({changes:window.qualityTransitions,state:(await import('/js/script.js')).game.state,width:document.querySelector('#forest').width,decoration:window.profileDecoration}));
  assert.deepEqual(native.changes,['low'],'native scheduling must not repeatedly retry expensive High');
  assert.equal(native.state,'playing');assert.equal(native.width,1440);assert.equal(native.decoration,'high');assert.deepEqual(liveErrors,[]);
  console.log('Automatic quality: 40-second native rendering under profile-dependent load passed.',native);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
