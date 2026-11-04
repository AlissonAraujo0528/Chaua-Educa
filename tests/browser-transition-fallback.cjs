// Guard transitions against synchronous GPU readbacks and verify the direct-render fallback.
// The optimized compositor does not call getImageData while painting staged stripes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/js/script.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
   const {Renderer}=await import('/js/render.mjs');
   const {images}=await import('/js/assets.mjs');
   const samples=[];
   for(const fault of ['throw','stall']){
    const canvas=document.createElement('canvas');
    canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh';
    document.body.append(canvas);
    const renderer=new Renderer(canvas);await renderer.ready;
    const forest=images.get('forest');
    if(!forest)throw Error('Missing forest asset');
    const normal=renderer.prepareFragmentedBackdrop(forest,'#dbe7b5',0,1);
    const originalSurface=normal.surface;
    const pending=renderer.ensureTransitionBackdrop();
    if(!pending)throw Error('Expected high-resolution transition buffer');
    const stagedSurface=pending.surface;
    const originalRead=pending.c.getImageData.bind(pending.c);
    let readCalls=0;
    pending.c.getImageData=(...args)=>{
     readCalls++;
     if(fault==='throw')throw Error('Simulated unsupported GPU readback');
     const until=performance.now()+21;
     while(performance.now()<until){}
     return originalRead(...args);
    };
    for(let i=0;i<8;i++){
     renderer.base(false);
     renderer.background(35,15000,2,false,false,.5);
     if(i<7&&normal.surface!==originalSurface)
      throw Error('Published partially painted transition at stripe '+i);
     if(i===7&&normal.surface!==stagedSurface)
      throw Error('Did not publish fully painted eighth stripe');
    }
    if(readCalls!==0)throw Error('Transition performed synchronous GPU readback');
    if(pending.rowsDone!==0||pending.target!==null)
     throw Error('Transition state not reset after publishing full image');
    // Explicitly disabling staging must choose the direct full-backdrop path.
    renderer.transitionRasterDisabled=true;
    if(renderer.ensureTransitionBackdrop()!==null)
     throw Error('Direct fallback was not selected');
    renderer.base(false);
    renderer.background(35.6,16000,2,false,false,.65);
    const pixelAlpha=renderer.c.getImageData(0,0,1,1).data[3];
    samples.push({fault,readCalls,fullImagePublished:normal.surface===stagedSurface,
     directFallback:true,pixelAlpha});
    canvas.remove();
   }
   return samples;
  });
  assert.deepEqual(errors,[]);
  assert.ok(result.every(x=>x.readCalls===0&&x.fullImagePublished&&x.directFallback&&x.pixelAlpha===255));
  console.log('PASS transition staging: no blocking GPU readbacks, complete eight-stripe publish and direct fallback '+JSON.stringify(result));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
