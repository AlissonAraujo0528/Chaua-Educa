// Real-art regression: optional bird/hawk sheets must not duplicate the
// old snake wrap, and A2 must fully replace the old snake when enabled.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const URL=process.env.GAME_URL||'http://127.0.0.1:5501/';
const OUT='test-results/v2-action-integration';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1200,height:720},{width:390,height:844}]){
   const records=[];
   for(const [mode,params] of [['legacy','?actionSprites=0&snakeA2=0'],['action','?snakeA2=0'],['a2','']]){
    const page=await browser.newPage({viewport,deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/js/script.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
    await page.goto(URL+params,{waitUntil:'networkidle'});
    const result=await page.evaluate(async()=>{
     const {Renderer,drawBird}=await import('/js/render.mjs');
     const {isSnakeA2Ready}=await import('/js/snake-a2.mjs');
     const {hasActionSheet}=await import('/js/action-sheets.mjs');
     const canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;
     canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;background:transparent';
     document.body.replaceChildren(canvas);
     const renderer=new Renderer(canvas);await renderer.ready;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     const digest=()=>{const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;let h=2166136261;for(let i=0;i<d.length;i++)h=Math.imul(h^d[i],16777619)>>>0;return h;};
     const drawSnake=(snake)=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);renderer.snake({id:77,kind:'wood',x:Math.min(280,innerWidth*.37),top:65,bottom:Math.min(540,innerHeight*.66),snake},false);return digest();};
     const poses={watching:{phase:'watching',age:3},windup:{phase:'windup',phaseAge:.23,age:4},striking:{phase:'striking',phaseAge:.13,age:5},stunned:{phase:'retreat',retreat:true,dazed:true,retreatTime:.45,age:7}};
     const hashes=Object.fromEntries(Object.entries(poses).map(([name,state])=>[name,drawSnake(state)]));
     const bird=(age,reduced)=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);drawBird(ctx,{x:innerWidth*.65,y:innerHeight*.25,scale:1.04,time:5.2,wing:.7,shieldHitAge:age,reduced});return digest();};
     const originalBird=bird(null,false),shieldBird=bird(.06,false);
     const reducedOriginal=bird(null,true),reducedShield=bird(.06,true);
     ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
     renderer.snake({id:77,kind:'wood',x:Math.min(195,innerWidth*.37),top:55,bottom:Math.min(500,innerHeight*.66),snake:poses.striking},false);
     drawBird(ctx,{x:innerWidth*.65,y:innerHeight*.25,scale:1.04,time:5.2,wing:.7,shieldHitAge:.06});
     return {a2:isSnakeA2Ready(),newFlight:hasActionSheet('parrot-flight'),hashes,originalBird,shieldBird,reducedOriginal,reducedShield};
    });
    assert.deepEqual(errors,[],'uncaught errors in '+mode);
    const filename=path.join(OUT,viewport.width+'-'+mode+'.png');
    await page.screenshot({path:filename});
    records.push({mode,...result,filename});
    await page.close();
   }
   const get=s=>records.find(r=>r.mode===s);
   assert.equal(get('legacy').a2,false);
   assert.equal(get('action').a2,false);
   assert.equal(get('a2').a2,true);
   assert.equal(get('action').newFlight,true);
   assert.equal(get('a2').newFlight,true);
   assert.deepEqual(get('legacy').hashes,get('action').hashes,'old snake changed merely by enabling bird/hawk sheets');
   for(const name of Object.keys(get('a2').hashes))assert.notEqual(get('a2').hashes[name],get('legacy').hashes[name],'A2 failed to replace '+name);
   assert.notEqual(get('action').shieldBird,get('action').originalBird,'shield contact does not select parrot reaction');
   assert.equal(get('action').reducedShield,get('action').reducedOriginal,'reduced motion changed parrot');
   console.log('PASS V2 real sprites and collision reactions '+JSON.stringify({viewport,records:records.map(({mode,hashes,newFlight,a2})=>({mode,hashes,newFlight,a2}))}));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
