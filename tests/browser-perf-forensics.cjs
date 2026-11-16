const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require('playwright');
const root=(process.env.GAME_URL||'http://127.0.0.1:5501/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:720},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#chaua-qa-panel').count(),0,'diagnostics stay absent in regular game');
  await page.goto(root+'?perf-test=1&perf-level=deep',{waitUntil:'networkidle'});
  const panel=page.locator('#chaua-qa-panel');
  await panel.waitFor();
  assert.equal(await panel.locator('select').inputValue(),'deep');
  await panel.locator('button').first().click();
  await page.evaluate(async()=>{
   const {game}=await import('/js/script.js');
   game.start('aventura',[],34788);
   game.state='playing';game.snapshot();
   game.collect({kind:'fruit',x:350,y:260,variety:0,route:-19,collected:false});
  });
  await page.waitForTimeout(1400);
  const pending=page.waitForEvent('download');
  await panel.locator('button').last().click();
  const report=JSON.parse(await fs.readFile(await (await pending).path(),'utf8'));
  assert.equal(report.schemaVersion,1,'retain compatibility with existing JSON');
  assert.equal(report.diagnosticLevel,'deep');
  assert.equal(report.forensics.version,2);
  assert.ok(report.summary.frames>12);
  assert.ok(report.forensics.gameEvents.some(x=>x.name==='fruit:collect'));
  assert.ok(report.forensics.gameEvents.some(x=>x.name==='game:fruit'));
  assert.ok(report.forensics.measuredOperations['engine.visual']?.count>0);
  assert.ok(report.forensics.measuredOperations['render.background']?.count>0);
  assert.ok(report.forensics.measuredOperations['storage.write']?.count>0);
  assert.ok(report.forensics.measuredOperations['vfx.fruitBurst']?.count>0);
  assert.ok(Array.isArray(report.forensics.correlatedStutters));
  assert.ok(Array.isArray(report.forensics.longAnimationFrames));
  assert.ok(report.forensics.limitations.some(x=>x.includes('GPU')));
  assert.deepEqual(errors,[]);
  console.log('PASS forensic performance V2: deep timing, fruit events, storage costs, local JSON and regular game isolation');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});