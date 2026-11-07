const {chromium}=require('playwright');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
const results=[];for(const viewport of [{width:1366,height:638},{width:390,height:844}]){
const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/script.js',r=>r.fulfill({contentType:'text/javascript',body:''}));await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
const data=await page.evaluate(async()=>{const {Renderer}=await import('/js/render.mjs');const {Game}=await import('/js/engine.mjs');const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;width:100vw;height:100vh';document.body.replaceChildren(canvas);const r=new Renderer(canvas);await r.ready;r.setQuality('high');const g=new Game();g.state='playing';g.y=320;g.stageAge=5;
g.entities=[{kind:'wood',id:11,x:410,top:160,bottom:490,variant:'plain',fragileSide:'top',fragileKind:'rot',decorSide:'bottom',decorKind:'moss'},{kind:'hawk',id:12,x:760,y:260,warning:0,phase:'crossing',dive:false},{kind:'fruit',id:13,x:500,y:320,variety:2}];
const rows=[];for(const start of [6000,9000,14000,20000]){const costs=[],intervals=[];let previous=null;for(let i=0;i<180;i++){
const stamp=await new Promise(requestAnimationFrame);if(previous!==null)intervals.push(stamp-previous);previous=stamp;
g.distance=start-900+i*20;g.stage=Math.min(3,Math.floor(g.distance/7000));g.sceneTime=42+i/60;g.elapsed=g.sceneTime;
const t=performance.now();r.game(g,false);costs.push(performance.now()-t);
const cachedFrames=r.seasonalBackdrop.frames.size;if(cachedFrames>2)throw Error('season cache exceeds two ready frames');
}const pct=(a,q)=>[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*q)];rows.push({start,cpuP50:pct(costs,.5),cpuP95:pct(costs,.95),cpuMax:Math.max(...costs),frameP95:pct(intervals,.95),over33ms:intervals.filter(x=>x>33.34).length,frames:intervals.length});}return rows;});
assert.deepEqual(errors,[]);results.push({viewport,scenes:data});await page.close();}
fs.mkdirSync('test-results/season-performance',{recursive:true});fs.writeFileSync('test-results/season-performance/'+(process.env.PERF_LABEL||'current')+'.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
