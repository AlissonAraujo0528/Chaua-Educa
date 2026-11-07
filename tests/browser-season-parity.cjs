const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
for(const viewport of [{width:1366,height:638},{width:390,height:844}]){
const page=await browser.newPage({viewport});await page.route('**/js/script.js',r=>r.fulfill({contentType:'text/javascript',body:''}));await page.goto(process.env.GAME_URL||'http://127.0.0.1:5501/',{waitUntil:'networkidle'});
const result=await page.evaluate(async()=>{const {SeasonalBackdrop}=await import('/js/seasons.mjs');const {images,loadAssets}=await import('/js/assets.mjs');await loadAssets();const atlas=images.get('season-backgrounds');
const create=enabled=>{const canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;const small=document.createElement('canvas');small.width=96;small.height=64;const backdrop=new SeasonalBackdrop();backdrop.prewarmEnabled=enabled;return {canvas,c:canvas.getContext('2d'),small,s:small.getContext('2d',{willReadFrequently:true}),backdrop};};
const a=create(false),b=create(true);let maximum=0,total=0;
for(const start of [6000,9000,14000,20000])for(let i=0;i<=50;i++){
 const distance=start-900+i*60;const pixels=[];
 for(const v of [a,b]){v.backdrop.draw(v.c,atlas,innerWidth,innerHeight,1,42+i/60,distance,false);v.s.drawImage(v.canvas,0,0,96,64);pixels.push(v.s.getImageData(0,0,96,64).data);}
 for(let k=0;k<pixels[0].length;k++){const d=Math.abs(pixels[0][k]-pixels[1][k]);maximum=Math.max(maximum,d);total+=d;}
}return {maximum,total};});assert.ok(result.maximum<=1,JSON.stringify(result));console.log('SEASON PARITY',viewport,result);await page.close();}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
