// Validate the production safety fallback for slow/unsupported 1px GPU readbacks.
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
    const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh';
    document.body.append(canvas);
    const renderer=new Renderer(canvas);await renderer.ready;
    const forest=images.get('forest');if(!forest)throw Error('Missing forest asset');
    renderer.prepareFragmentedBackdrop(forest,'#dbe7b5',0,1);
    const pending=renderer.ensureTransitionBackdrop();if(!pending)throw Error('Expected high-resolution transition buffer');
    const original=pending.c.getImageData.bind(pending.c);
    pending.c.getImageData=(...args)=>{
     if(fault==='throw')throw Error('Simulated unsupported GPU readback');
     const until=performance.now()+21;
     while(performance.now()<until){}
     return original(...args);
    };
    for(let i=0;i<3;i++){
     renderer.base();renderer.background(35,15000,2,false,false,.5);
    }
    if(!renderer.transitionRasterDisabled||renderer.transitionBackdrop!==null)
     throw Error('Renderer failed to disable a broken or slow tile path');
    renderer.base();renderer.background(35.6,16000,2,false,false,.65);
    const data=renderer.c.getImageData(0,0,1,1).data;
    samples.push({fault,disabled:renderer.transitionRasterDisabled,bufferReleased:pending.surface.width===0,
     pixelAlpha:data[3],freshCache:!!renderer.fragmentedBackdrop});
   }
   return samples;
  });
  assert.deepEqual(errors,[]);
  assert.ok(result.every(x=>x.disabled&&x.bufferReleased&&x.freshCache&&x.pixelAlpha===255));
  console.log('PASS transition GPU-readback fallback '+JSON.stringify(result));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
