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
   const {game}=await import('/js/script.js');game.startTutorial();game.state='playing';game.snapshot();window.stepQuality(1/60);
  });
  const step=(pattern,count)=>page.evaluate(({pattern,count})=>{
   for(let i=0;i<count;i++)window.stepQuality(pattern[i%pattern.length]);
  },{pattern,count});
  const state=()=>page.evaluate(async()=>({
   state:(await import('/js/script.js')).game.state,
   width:document.querySelector('#forest').width,
   stored:JSON.parse(localStorage.getItem('chaua-visual-quality'))
  }));
  const mode=async value=>{
   await page.locator('#quality-mode').evaluate((select,value)=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));},value);
  };
  // Exercise the real frame loop, controller, renderer resize and setting handler.
  await mode('auto');assert.equal((await state()).width,780);
  await step([.25],1);await step([1/60],180);
  assert.equal((await state()).width,780,'one stall must not lower quality');
  await step([1/60,1/30],100);
  assert.equal((await state()).width,390,'mixed active slowdown must resize the renderer');
  assert.equal((await state()).state,'playing');
  await step([1/60],660);assert.equal((await state()).width,390,'eleven seconds cannot recover quality');
  await page.locator('#pause-button').click();await step([1/30],90);
  assert.equal((await state()).state,'paused');
  await page.locator('#resume-button').click();await step([1/60],120);
  await step([1/60],600);assert.equal((await state()).width,390,'pause must reset the recovery period');
  await step([1/60],120);assert.equal((await state()).width,780);
  await mode('high');await step([.12,1/60],60);
  assert.equal((await state()).width,780);assert.equal((await state()).stored,'high');
  await mode('low');await step([1/60],780);
  assert.equal((await state()).width,390);assert.equal((await state()).stored,'low');
  await mode('auto');await step([.12,1/60],40);
  assert.equal((await state()).width,390,'recurring active stalls above 100 ms must count');
  assert.equal((await state()).stored,'auto');assert.deepEqual(errors,[]);
  console.log('Automatic quality: real frame loop, renderer, manual settings, pause and reduced motion passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
