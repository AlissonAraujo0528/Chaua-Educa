// Browser regression: a denied orientation lock must never strand the player.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({
   viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 16; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Mobile Safari/537.36'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   window.orientationTrace=[];
   let fullscreen=null;
   Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>fullscreen});
   Element.prototype.requestFullscreen=function(){
    window.orientationTrace.push('fullscreen');
    fullscreen=this;
    return Promise.resolve();
   };
   document.exitFullscreen=()=>{
    window.orientationTrace.push('exit');fullscreen=null;return Promise.resolve();
   };
   Object.defineProperty(screen,'orientation',{configurable:true,value:{
    lock:async orientation=>{
     window.orientationTrace.push('lock:'+orientation);
     throw Error('simulated unsupported orientation lock');
    },
    unlock:()=>window.orientationTrace.push('unlock')
   }});
  });
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
  await page.locator('#inputPlayer').fill('Voo Mobile');
  await page.locator('#btnStart').click();
  await page.waitForFunction(()=>document.querySelector('#app').classList.contains('in-flight'));
  const flight=await page.evaluate(()=>({
   trace:window.orientationTrace,
   toast:document.querySelector('#toast').textContent,
   hint:document.querySelector('.orientation-hint').textContent
  }));
  assert.deepEqual(flight.trace,['fullscreen','lock:landscape']);
  assert.match(flight.toast,/rota[cç][aã]o autom[aá]tica/);
  assert.ok(flight.hint.includes('virar o celular'));
  // Simulate the home action even though the top bar is hidden in flight.
  await page.evaluate(()=>document.querySelector('.brand').click());
  await page.waitForFunction(()=>!document.querySelector('#app').classList.contains('in-flight'));
  const trace=await page.evaluate(()=>window.orientationTrace);
  assert.deepEqual(trace,['fullscreen','lock:landscape','unlock','exit']);
  assert.deepEqual(errors,[]);
  console.log('PASS mobile landscape attempt, denied-lock fallback and exit from fullscreen');
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
