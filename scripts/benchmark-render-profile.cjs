// Diagnostic only: compare independent axes without changing persisted presets.
// Start the game server first. JSON is written to stdout; progress to stderr.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*p)];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const rows=[],viewport={width:1440,height:960};
  const profiles=[{resolution:'high',decoration:'high'},{resolution:'low',decoration:'high'},{resolution:'high',decoration:'low'},{resolution:'low',decoration:'low'}];
  for(let repetition=0;repetition<3;repetition++)for(const profile of repetition%2?[...profiles].reverse():profiles){
   const page=await browser.newPage({viewport,deviceScaleFactor:2}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    localStorage.setItem('chaua-visual-quality',JSON.stringify('high'));
    window.profileCapture=false;window.profileIntervals=[];
    const native=requestAnimationFrame;let previous=0;
    window.requestAnimationFrame=callback=>native.call(window,time=>{
     if(callback.name==='frame'){
      if(previous&&window.profileCapture)window.profileIntervals.push(time-previous);
      previous=time;
     }
     callback(time);
    });
   });
   await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
   await page.locator('#start-training:not([disabled])').click();
   await page.evaluate(async()=>{
    const {game}=await import('/js/script.js'),{Renderer}=await import('/js/render.mjs');
    const draw=Renderer.prototype.game;
    Renderer.prototype.game=function(...args){window.profileRenderer=this;return draw.apply(this,args);};
    game.startTutorial();game.state='playing';game.elapsed=35;game.distance=15000;
    game.stage=2;game.stageAge=10;game.y=320;game.snapshot();
   });
   await page.waitForFunction(()=>window.profileRenderer);
   await page.evaluate(profile=>window.profileRenderer.setVisualProfile(profile),profile);
   await page.waitForTimeout(1000);
   await page.evaluate(()=>{window.profileIntervals=[];window.profileCapture=true;});
   await page.waitForTimeout(8000);
   const sample=await page.evaluate(async()=>{
    window.profileCapture=false;const r=window.profileRenderer;
    return {intervals:window.profileIntervals,width:r.canvas.width,height:r.canvas.height,
     resolution:r.resolution,decoration:r.decoration,state:(await import('/js/script.js')).game.state};
   });
   assert.equal(sample.state,'playing');assert.equal(sample.resolution,profile.resolution);
   assert.equal(sample.decoration,profile.decoration);assert.deepEqual(errors,[]);assert.ok(sample.intervals.length>0);
   const {intervals,...settings}=sample;
   const row={repetition,...settings,frames:intervals.length,fps:1000*intervals.length/intervals.reduce((a,b)=>a+b,0),p95:percentile(intervals,.95),p99:percentile(intervals,.99),max:Math.max(...intervals),over50:intervals.filter(t=>t>50).length};
   rows.push(row);console.error(JSON.stringify(row));await page.close();
  }
  const gpu=(await (await browser.newBrowserCDPSession()).send('SystemInfo.getInfo')).gpu;
  console.log(JSON.stringify({browser:browser.version(),viewport,deviceScaleFactor:2,warmupSeconds:1,sampleSeconds:8,repetitions:3,scene:'protected training, stage 2, no encounters',gpu,rows},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
