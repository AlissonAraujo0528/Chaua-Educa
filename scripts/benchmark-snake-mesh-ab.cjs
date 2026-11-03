// Within-browser paired A/B for snake raster cost. No production changes.
// Pixel equality is enforced by tests/browser-snake-raster-parity.cjs.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const percentile=(a,p)=>{const x=[...a].sort((x,y)=>x-y);return x[Math.floor((x.length-1)*p)]??null;};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/js/script.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await page.route('**/js/snake-render-baseline.mjs',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/snake-render-original.mjs','utf8')}));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
  const results=await page.evaluate(async()=>{
   const {loadAssets,images}=await import('/js/assets.mjs');
   const old=(await import('/js/snake-render-baseline.mjs')).drawContinuousSnake;
   const optimized=(await import('/js/snake-render.mjs')).drawContinuousSnake;
   await loadAssets();
   const make=()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
    return canvas.getContext('2d',{willReadFrequently:true});
   };
   const contexts={baseline:make(),optimized:make()},draw={baseline:old,optimized};
   const samples={baseline:[],optimized:[]};
   const loops=Number.isFinite(Number(window.__RUNS))?Number(window.__RUNS):160;
   for(let i=0;i<loops+20;i++){
    const phase=i%4===0?'warning':i%4===1?'windup':i%4===2?'striking':'recovering';
    const s={phase,age:i/60+2,warningAge:(i%46)/60,phaseAge:(i%28)/60,retreat:false};
    const order=i%2?['baseline','optimized']:['optimized','baseline'];
    for(const label of order){
     const c=contexts[label];c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,512,512);
     c.translate(256,256);
     const begin=performance.now();
     draw[label](c,images.get('snake-atlas'),s,.52,false);
     c.getImageData(256,256,1,1); // Forces readback for each variant symmetrically.
     if(i>=20)samples[label].push(performance.now()-begin);
    }
   }
   const summarize=data=>({
    count:data.length,meanMs:data.reduce((a,b)=>a+b,0)/data.length,
    medianMs:(()=>{const z=[...data].sort((a,b)=>a-b);return z[Math.floor(z.length*.5)]})(),
    p95Ms:(()=>{const z=[...data].sort((a,b)=>a-b);return z[Math.floor(z.length*.95)]})()
   });
   return {baseline:summarize(samples.baseline),optimized:summarize(samples.optimized),samples:loops};
  });
  assert.deepEqual(errors,[]);
  const ratio=results.optimized.medianMs/results.baseline.medianMs;
  console.log('SNAKE_AB_RESULT '+JSON.stringify({...results,medianRatio:ratio,browser:browser.version(),note:'Paired within-browser raster + readback timings; viewport/software renderer dependent. This is not proof of phone FPS.'}));
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
