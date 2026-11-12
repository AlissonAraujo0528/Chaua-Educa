// Measure the official A2 draw path, never the abandoned triangle/mesh renderer.
// Browser/canvas cost is diagnostic; it does not establish device FPS.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const pct=(a,p)=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor((b.length-1)*p)]};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:640}});
  await page.route('**/js/script.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
  const stats=await page.evaluate(async()=>{
   const {Renderer}=await import('/js/render.mjs');
   const c=document.createElement('canvas');c.width=960;c.height=640;
   const renderer=new Renderer(c);await renderer.ready;
   const phases=['watching','warning','windup','striking','recovering','spent'];
   const values=[];
   let drawCalls=0;
   for(let i=0;i<300;i++){
    const wood={id:1,kind:'wood',x:420,top:120,bottom:465,
      snake:{phase:phases[i%phases.length],age:i/60,phaseAge:(i%30)/60,warningAge:(i%60)/60}};
    const ctx=renderer.c;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,960,640);
    const start=performance.now();
    renderer.snake(wood,false,0,0,i/60,false);
    // Symmetric raster flush with actual graphics only.
    const alpha=ctx.getImageData(420,450,1,1).data[3];
    if(i>=20)values.push(performance.now()-start);
    if(alpha>=0)drawCalls++;
   }
   return {samples:values,drawCalls};
  });
  assert.equal(stats.samples.length,280);assert.equal(stats.drawCalls,300);
  const out={samples:stats.samples.length,medianMs:pct(stats.samples,.5),p95Ms:pct(stats.samples,.95),
    p99Ms:pct(stats.samples,.99),browser:browser.version()};
  console.log('A2_RENDER_PROFILE '+JSON.stringify(out));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
