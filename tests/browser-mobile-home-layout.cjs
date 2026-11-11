// Guard the actual menu against cramped mobile and wide virtual viewports.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const out='test-results/mobile-home';
fs.mkdirSync(out,{recursive:true});

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try {
  for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[980,1500]]) {
   const context=await browser.newContext({
    viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce',
    userAgent:'Mozilla/5.0 (Linux; Android 16; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Mobile Safari/537.36'
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'domcontentloaded'});
   const data=await page.evaluate(()=>{
    const rect=selector=>{const b=document.querySelector(selector).getBoundingClientRect();
     return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
    const sizes=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    return {
     width:innerWidth,height:innerHeight,mobileClass:document.querySelector('#app').classList.contains('mobile-device'),
     pageWidth:document.documentElement.scrollWidth,
     main:rect('#app'),copy:rect('.home-copy'),card:rect('.start-card'),
     links:rect('.home-links'),caption:rect('.scene-caption'),footer:rect('.home-footer'),
     button:rect('#btnStart'),titleFont:sizes('.home h1'),inputFont:sizes('#inputPlayer'),
     introFont:sizes('.intro'),modeFont:sizes('.mode-picker small'),
     scrollable:getComputedStyle(document.documentElement).overflowY
    };
   });
   assert.equal(data.mobileClass,true,'Mobile device not recognized at '+width);
   assert.ok(data.pageWidth<=width+2,'Horizontal overflow at '+width+': '+JSON.stringify(data));
   assert.ok(data.copy.width>=width*(width>700?.60:.78),'Menu too narrow at '+width);
   assert.ok(data.card.width>=data.copy.width-1,'Form not filling menu at '+width);
   assert.ok(data.titleFont>=40&&data.introFont>=14&&data.inputFont>=16&&data.modeFont>=10,
    'Text unreadably small at '+width+': '+JSON.stringify(data));
   assert.ok(data.button.height>=44,'Play button too small at '+width);
   assert.ok(data.links.bottom<=data.caption.top+1,'Description overlaps links at '+width);
   assert.ok(data.caption.bottom<=data.footer.top+1,'Description overlaps footer at '+width);
   assert.equal(data.scrollable,'auto','Portrait page cannot scroll on '+width);
   assert.deepEqual(errors,[],'JavaScript errors at '+width);
   await page.screenshot({path:path.join(out,width+'x'+height+'.png'),fullPage:true});
   console.log('PASS MOBILE HOME '+JSON.stringify({width,height,cardWidth:data.card.width,copyWidth:data.copy.width,titleFont:data.titleFont,
    scrollable:data.scrollable}));
   await context.close();
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
