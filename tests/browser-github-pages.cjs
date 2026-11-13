const assert = require('node:assert/strict');
const {chromium} = require('playwright');

// Reproduce the exact project-site URL hierarchy used by GitHub Pages.
// No development server, Node process or prompt is needed by the visitor.
const url = process.env.PAGES_PREVIEW_URL ||
  'http://127.0.0.1:5502/Chaua-Educa/Chaua-Educa-main/';

(async () => {
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[],badResponses=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
   if(response.status()>=400)badResponses.push(response.status()+' '+response.url());
  });
  await page.goto(url,{waitUntil:'networkidle',timeout:45000});
  assert.equal(new URL(page.url()).pathname,'/Chaua-Educa/Chaua-Educa-main/');
  await page.locator('#btnStart:not([disabled])').waitFor({timeout:25000});
  await page.locator('#start-training:not([disabled])').waitFor({timeout:25000});
  assert.deepEqual(errors,[],'JavaScript error on GitHub Pages subpath');
  assert.deepEqual(badResponses,[],'Missing assets or modules on GitHub Pages subpath');
  const loaded=await page.evaluate(async()=>{
   const {images,loadAssets}=await import('./js/assets.mjs');
   const {hasActionSheet}=await import('./js/action-sheets.mjs');
   await loadAssets();
   return {
    css:!!document.querySelector('link[rel="stylesheet"]')?.sheet,
    images:images.size,
    seasonal:!!images.get('season-backgrounds')?.naturalWidth,
    requiredArt:['parrot-flight','parrot-impact','hawk-flight','hawk-stunned'].every(hasActionSheet),
    orientation:document.documentElement.className,
   };
  });
  assert.ok(loaded.css,'CSS must load from the repository subdirectory');
  assert.ok(loaded.images>15,'Images must load from relative paths');
  assert.equal(loaded.seasonal,true);
  assert.equal(loaded.requiredArt,true,'All four required action atlases must be ready');
  await page.locator('#inputPlayer').fill('Teste Pages');
  await page.locator('#btnStart').click();
  await page.waitForFunction(()=>document.querySelector('#app')?.dataset.state==='playing',{timeout:15000});
  await page.waitForTimeout(1000);
  assert.deepEqual(errors,[],'No errors after starting a flight via GitHub Pages subpath');
  assert.deepEqual(badResponses,[],'No late-loading 404s during flight');
  console.log('PASS GitHub Pages project subpath: CSS, local WebPs, gameplay and modules work without server-side services',loaded);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
