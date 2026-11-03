// Diagnostic resolution ladder. It DOES NOT change production quality presets.
// Simulates fractional devicePixelRatio for backing-canvas comparison, while
// keeping browser viewport, all decoration and game logic fixed.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const out='test-results/resolution';
fs.mkdirSync(out,{recursive:true});
function percentile(data,p){const sorted=[...data].sort((a,b)=>a-b);return sorted[Math.floor((sorted.length-1)*p)];}
const ratios=[1,1.15,1.25,1.35,1.5,1.7];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const results=[];
  for(const ratio of ratios){
   const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(value=>{
    Object.defineProperty(window,'devicePixelRatio',{configurable:true,get:()=>value});
    localStorage.setItem('chaua-visual-quality',JSON.stringify('high'));
    let previous=0;
    const native=window.requestAnimationFrame;
    window.resolutionSample=false;window.resolutionFrames=[];
    window.requestAnimationFrame=callback=>native.call(window,now=>{
     if(callback.name==='frame'){
      if(previous&&window.resolutionSample)window.resolutionFrames.push(now-previous);
      previous=now;
     }
     callback(now);
    });
   },ratio);
   await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
   await page.locator('#start-training:not([disabled])').click();
   await page.evaluate(async()=>{
    const {game}=await import('/js/script.js');
    const {Renderer}=await import('/js/render.mjs');
    const original=Renderer.prototype.game;
    Renderer.prototype.game=function(...args){window.profileRenderer=this;return original.apply(this,args);};
    game.startTutorial();game.state='playing';game.elapsed=35;game.sceneTime=35;
    game.distance=15000;game.stage=2;game.stageAge=10;game.y=320;
    game.nextSpawn=Infinity;game.entities=[];game.snapshot();
   });
   await page.waitForFunction(()=>window.profileRenderer);
   await page.waitForTimeout(1200);
   await page.evaluate(()=>{window.resolutionFrames=[];window.resolutionSample=true;});
   await page.waitForTimeout(6000);
   const data=await page.evaluate(async()=>{
    window.resolutionSample=false;
    const r=window.profileRenderer;
    const {game}=await import('/js/script.js');
    return {frames:window.resolutionFrames,width:r.canvas.width,height:r.canvas.height,
      resolution:r.resolution,decoration:r.decoration,state:game.state};
   });
   assert.equal(data.state,'playing');
   assert.equal(data.resolution,'high');assert.equal(data.decoration,'high');assert.deepEqual(errors,[]);
   const {frames,...meta}=data;
   assert.ok(frames.length>10);
   const sample={...meta,requestedBackingDpr:ratio,actualBackingDpr:data.width/1440,backingPixels:data.width*data.height,
     frames:frames.length,fps:1000*frames.length/frames.reduce((a,b)=>a+b,0),
     p50Ms:percentile(frames,.5),p95Ms:percentile(frames,.95),p99Ms:percentile(frames,.99),maxMs:Math.max(...frames),
     over33:frames.filter(v=>v>33.33).length,over50:frames.filter(v=>v>50).length};
   results.push(sample);
   console.log('RESOLUTION_ROW '+JSON.stringify(sample));
   // Capture a deterministic game frame at its own native backing resolution.
   const png=await page.evaluate(async()=>{
    const {Game}=await import('/js/engine.mjs');
    const {advanceSnake}=await import('/js/animals.mjs');
    const g=new Game({seed:104});
    g.state='playing';g.elapsed=35;g.sceneTime=35;g.distance=15000;
    g.stage=2;g.stageAge=10;g.y=320;g.wing=.4;
    const wood={id:1,kind:'wood',x:430,top:180,bottom:460,variant:'plain',snake:{age:0}};
    advanceSnake(wood,.4,g.x);
    g.entities=[wood,{id:2,kind:'hawk',x:660,y:280,startX:660,startY:280,targetX:260,targetY:280,warning:0,age:2,dive:false},
      {id:3,kind:'fruit',x:750,y:315,variety:0,collected:false}];
    const r=window.profileRenderer;
    r.game(g,false,35);
    return r.canvas.toDataURL('image/png').split(',')[1];
   });
   fs.writeFileSync(path.join(out,'dpr-'+ratio.toFixed(2)+'.png'),Buffer.from(png,'base64'));
   await page.close();
  }
  const gpu=(await (await browser.newBrowserCDPSession()).send('SystemInfo.getInfo')).gpu;
  const payload={browser:browser.version(),gpuRenderer:gpu.devices?.[0]?.deviceString,
   method:'Fractional DPR diagnostic override, native RAF, all effects, stage 2 protected training, 1.2s warmup + 6s captured per resolution, single run; not a device setting or full journey.',
   results};
  fs.writeFileSync(path.join(out,'resolution-results.json'),JSON.stringify(payload,null,2));
  console.log('RESOLUTION_SUMMARY '+JSON.stringify(payload));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
