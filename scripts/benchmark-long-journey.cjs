// Real-time pilot and native-RAF long-session diagnostic (no production changes).
// Unlike browser-journey.cjs, this does NOT replace requestAnimationFrame with a
// synthetic clock; physical wall time and visual frame intervals are measured.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const out='test-results/long-flight';
fs.mkdirSync(out,{recursive:true});
const pct=(xs,p)=>{if(!xs.length)return null;const ys=[...xs].sort((a,b)=>a-b);return ys[Math.floor((ys.length-1)*p)];};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.setItem('chaua-visual-quality',JSON.stringify('auto'));
   const native=requestAnimationFrame;
   let previous=0;
   window.longFrames=[];
   window.requestAnimationFrame=callback=>native.call(window,now=>{
    if(callback.name==='frame'&&window.longCapture){
     if(previous)window.longFrames.push(now-previous);
     previous=now;
    }
    callback(now);
   });
  });
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
  await page.locator('#inputPlayer').fill('Teste prolongado');
  await page.locator('input[value=aventura]').check();
  await page.locator('#btnStart:not([disabled])').click();
  await page.bringToFront();
  const seconds=Math.max(30,Math.min(140,Number(process.env.LONG_SECONDS)||90));
  await page.evaluate(async seconds=>{
   const {game:g}=await import('/js/script.js');
   const {flightViewport}=await import('/js/viewport.mjs');
   const {Renderer}=await import('/js/render.mjs');
   const qualityChanges=[];
   const change=Renderer.prototype.setQuality;
   Renderer.prototype.setQuality=function(level){if(this.quality!==level)qualityChanges.push({level,at:performance.now()});return change.call(this,level);};
   g.start('aventura',[],104);
   window.longCapture=true;
   window.longStart=performance.now();
   const encounters=new Set(),stages=new Set(),pickups=new Set();
   let questions=0,failures=0,pending=null,nextDecision=0,decisions=0,done=false;
   const finish=()=>{
    if(done)return;done=true;window.longCapture=false;
    clearInterval(pilot);clearTimeout(deadline);
    const elapsed=(performance.now()-window.longStart)/1000;
    window.longResult={
     elapsedWallSeconds:elapsed,gameSeconds:g.elapsed,state:g.state,reason:g.reason,
     won:g.won,stages:[...stages],encounters:[...encounters],pickups:[...pickups],
     questions,failures,decisions,qualityChanges,
     canvasWidth:document.querySelector('#forest').width,
     canvasHeight:document.querySelector('#forest').height,
     frameIntervals:window.longFrames
    };
    window.longDone=true;
   };
   const pilot=setInterval(()=>{
    if(done)return;
    if(g.state==='quiz'){
     try{
      document.querySelector(g.question.answer?'#answer-true':'#answer-false').click();
      document.querySelector('#quiz-continue').click();
      questions++;pending=null;
     }catch{failures++;}
     return;
    }
    if(g.state==='ended'||g.state==='trained'){finish();return;}
    if(g.state!=='playing')return;
    stages.add(g.stage);
    for(const entity of g.entities){
     if(entity.kind==='hawk')encounters.add(entity.dive?'diving-hawk':'hawk');
     if(entity.kind==='wood')encounters.add('wood');
     if(entity.snake)encounters.add(entity.snake.branch?'branch-snake':'snake');
     if(['feather','shield','pepper'].includes(entity.kind))pickups.add(entity.kind);
    }
    const v=flightViewport(innerWidth,innerHeight);
    const right=v.worldLeft+v.w/v.scale;
    const wood=g.entities.find(e=>e.kind==='wood'&&e.x+100>g.x&&e.x<=right);
    const hawk=g.entities.find(e=>e.kind==='hawk'&&!e.harmless&&!e.retreat&&e.x+60>g.x);
    let target=wood?(wood.top+wood.bottom)/2:320;
    if(!wood&&hawk){
     const t=Math.max(0,Math.min(1,(hawk.startX-g.x)/(hawk.startX-hawk.targetX)));
     const lane=hawk.startY+(hawk.targetY-hawk.startY)*t;
     target=lane>=320?Math.max(145,lane-125):Math.min(495,lane+125);
    }
    if(g.elapsed>=nextDecision){
     nextDecision=g.elapsed+1/30;
     const predicted=g.y+g.vy*.12+450*.12**2;
     if(pending===null&&predicted>target+10&&g.vy>0)pending=g.elapsed+.12;
    }
    if(pending!==null&&g.elapsed>=pending){
     window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));
     window.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true}));
     pending=null;decisions++;
    }
   },16);
   const deadline=setTimeout(finish,seconds*1000);
   window.longDone=false;
  },seconds);
  await page.waitForFunction(()=>window.longDone,null,{timeout:(seconds+20)*1000,polling:250});
  const captured=await page.evaluate(()=>window.longResult);
  const {frameIntervals:frames,...details}=captured;
  assert.ok(frames.length>100,'native frames must be captured');
  assert.deepEqual(errors,[]);
  const stats={...details,frames:frames.length,
    fps:1000*frames.length/frames.reduce((a,b)=>a+b,0),
    frameP50Ms:pct(frames,.50),frameP95Ms:pct(frames,.95),
    frameP99Ms:pct(frames,.99),maxMs:Math.max(...frames),
    framesAbove33Ms:frames.filter(t=>t>33.33).length,
    framesAbove50Ms:frames.filter(t=>t>50).length,
    framesAbove100Ms:frames.filter(t=>t>100).length};
  fs.writeFileSync(path.join(out,'long-flight.json'),JSON.stringify(stats,null,2));
  console.log('LONG_FLIGHT_RESULT '+JSON.stringify(stats));
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
