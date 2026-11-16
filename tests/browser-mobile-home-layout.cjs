// Real touch-device layouts: page cannot scroll, controls stay reachable, keyboard
// uses the visual viewport, and landscape shows the complete flight corridor.
const playwright=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const engine=process.env.MOBILE_BROWSER||'chromium';
const out='test-results/mobile-home';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await playwright[engine].launch({executablePath:engine==='chromium'?process.env.CHROMIUM_PATH||undefined:undefined,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  for(const [width,height] of [[320,480],[320,568],[360,640],[390,844],[430,932],[768,1024],[980,1500],[568,320],[667,375],[844,390],[932,430]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
    isMobile:engine!=='firefox',hasTouch:true,reducedMotion:'reduce',
    userAgent:'Mozilla/5.0 (Linux; Android 16; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Mobile Safari/537.36'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{throw Error('unsupported mobile fullscreen')};});
   await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'domcontentloaded'});
   await page.locator('#start-training:not([disabled])').waitFor();
   await page.evaluate(()=>document.fonts.ready);
   const measure=()=>page.evaluate(()=>{
    const selectors=['#inputPlayer','#btnStart','#start-training','.mode-picker label','#open-ranking','#open-guide','#open-collection','#open-missions','#open-settings','#open-credits'];
    return {w:innerWidth,h:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,
     scrollY,overflow:getComputedStyle(document.documentElement).overflowY,
     controls:selectors.map(s=>{const el=document.querySelector(s),r=el.getBoundingClientRect();return {s,x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}}),
     inputFont:parseFloat(getComputedStyle(document.querySelector('#inputPlayer')).fontSize)};
   });
   let data=await measure();
   assert.ok(data.scrollW<=width+1&&data.scrollH<=height+1,JSON.stringify(data));
   assert.equal(data.overflow,'hidden');assert.ok(data.inputFont>=16);
   for(const r of data.controls){
    assert.ok(r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,'Unreachable menu action '+JSON.stringify({width,height,r}));
    if(r.s!=='#inputPlayer')assert.ok(r.h>=43,'Touch target too short '+JSON.stringify(r));
   }
   // Mobile WebKit does not implement Playwright's mouse wheel. Verify its
   // scroll root programmatically; keep an actual wheel attempt on Chromium/Firefox.
   if(engine==='webkit'){
    await page.evaluate(()=>{window.scrollTo(0,500);document.scrollingElement.scrollTop=500;});
   } else {
    await page.mouse.wheel(0,500);
   }
   assert.equal((await measure()).scrollY,0,'Page scrolled despite viewport lock');
   await page.screenshot({path:path.join(out,`${engine}-${width}x${height}-menu.png`)});
   // Reproduce a visual-viewport-only keyboard resize; no CSS layout resize.
   if(width===390){
    await page.locator('#inputPlayer').fill('Voo Mobile');await page.locator('#inputPlayer').focus();
    await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:300});visualViewport.dispatchEvent(new Event('resize'));});
    await page.waitForFunction(()=>document.querySelector('#app').classList.contains('keyboard-open'));
    const typing=await measure();
    for(const r of typing.controls.filter(r=>['#inputPlayer','#btnStart'].includes(r.s)))assert.ok(r.y>=0&&r.bottom<=300,'Keyboard hides '+r.s);
    await page.screenshot({path:path.join(out,`${engine}-keyboard.png`)});
    await page.evaluate(()=>{document.activeElement.blur();delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
    await page.waitForFunction(()=>!document.querySelector('#app').classList.contains('keyboard-open'));
   }
   await page.locator('#inputPlayer').fill('Voo Mobile');await page.locator('#btnStart').tap();
   await page.waitForFunction(()=>document.querySelector('#app').classList.contains('in-flight'));
   const result=await page.evaluate(async()=>{
    const {game}=await import('/js/script.js');game.state='playing';game.entities=[];game.nextSpawn=Infinity;game.invincible=999;
    const {flightViewport}=await import('/js/viewport.mjs');
    const r=document.querySelector('#forest').getBoundingClientRect(),v=flightViewport(r.width,r.height);
    const b=document.querySelector('#flap-button').getBoundingClientRect();
    return {view:v,canvas:{w:r.width,h:r.height},button:{x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom,right:b.right},
     scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight};
   });
   assert.ok(result.scrollW<=width+1&&result.scrollH<=height+1);
   assert.ok(result.button.w>=44&&result.button.h>=44&&result.button.bottom<=height+1&&result.button.right<=width+1);
   if(width>height)assert.ok(result.view.worldHeight>=639.99);
   // Touch/hold/release exercises the real pointer capture and input path.
   await page.locator('#flap-button').tap();
   await page.screenshot({path:path.join(out,`${engine}-${width}x${height}-flight.png`)});
   await page.locator('#pause-button').tap();await page.locator('#pause-dialog').waitFor({state:'visible'});
   await page.locator('#resume-button').scrollIntoViewIfNeeded();await page.locator('#resume-button').tap();
   assert.equal(await page.evaluate(()=>scrollY),0);
   assert.deepEqual(errors,[]);console.log('PASS MOBILE FIT',engine,width,height,{scale:result.view.scale,worldHeight:result.view.worldHeight});
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
