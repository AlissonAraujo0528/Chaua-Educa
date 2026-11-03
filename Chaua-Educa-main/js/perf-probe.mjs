// Opt-in physical-device diagnostics: only loaded with ?perf-test=1.
// No uploads, storage or changes to the game's rendering/physics.
const MAX_FRAMES=45_000;
const percentile=(values,p)=>{
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 return Math.round(sorted[Math.floor((sorted.length-1)*p)]*10)/10;
};
const summarize=samples=>{
 const dt=samples.map(s=>s.dt);
 const total=dt.reduce((a,b)=>a+b,0);
 return {
  frames:dt.length,
  fps:total?Math.round(1000*dt.length/total*100)/100:null,
  frameP50Ms:percentile(dt,.5),
  frameP95Ms:percentile(dt,.95),
  frameP99Ms:percentile(dt,.99),
  maxFrameMs:dt.length?Math.round(Math.max(...dt)*10)/10:null,
  framesOver33Ms:dt.filter(x=>x>33.33).length,
  framesOver50Ms:dt.filter(x=>x>50).length,
  framesOver100Ms:dt.filter(x=>x>100).length
 };
};
export function mountPerformanceProbe({game,quality,renderer}){
 if(document.querySelector('#chaua-qa-panel'))return;
 const panel=document.createElement('div');
 panel.id='chaua-qa-panel';
 panel.style.cssText='position:fixed;z-index:99999;bottom:8px;left:8px;max-width:calc(100vw - 16px);padding:8px;border-radius:9px;background:#122d24e8;color:#fff;font:12px/1.4 system-ui;box-shadow:0 4px 14px #0006;display:flex;align-items:center;gap:6px;flex-wrap:wrap;';
 const label=document.createElement('span');
 label.textContent='Diagnóstico local · inativo';
 const start=document.createElement('button');
 start.type='button';start.textContent='Iniciar';
 const stop=document.createElement('button');
 stop.type='button';stop.textContent='Baixar relatório';stop.disabled=true;
 for(const button of [start,stop]){
  button.style.cssText='font:inherit;border:1px solid #b6dec7;border-radius:5px;background:#ecfff2;color:#173a2b;padding:5px 8px;cursor:pointer;';
 }
 panel.append(label,start,stop);
 document.body.append(panel);
 let active=false,startTime=0,previous=0,lastUI=0;
 let samples=[],changes=[],lastProfile='';
 const profile=()=>quality.mode+'/'+quality.level+'/'+renderer.resolution+'/'+renderer.decoration;
 const download=payload=>{
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='chaua-perf-dispositivo-'+Date.now()+'.json';
  document.body.append(a);a.click();a.remove();
  // Revocation is deferred until a later explicit user gesture, to avoid a
  // download being cancelled by browsers that delay the navigation.
  window.addEventListener('pagehide',()=>URL.revokeObjectURL(url),{once:true});
 };
 function tick(now){
  if(!active)return;
  const current=profile();
  if(current!==lastProfile){
   changes.push({atSeconds:+((now-startTime)/1000).toFixed(2),gameSeconds:+game.elapsed.toFixed(2),stage:game.stage,profile:current,canvas:[renderer.canvas.width,renderer.canvas.height]});
   lastProfile=current;
  }
  const eligible=document.visibilityState==='visible'&&document.hasFocus()&&game.state==='playing';
  if(eligible&&previous>0&&samples.length<MAX_FRAMES){
   const dt=now-previous;
   if(dt>0&&Number.isFinite(dt))samples.push({dt,at:now-startTime,stage:game.stage,profile:current});
  }
  previous=eligible?now:0;
  if(now-lastUI>1000){
   label.textContent='Gravando · '+Math.floor((now-startTime)/1000)+'s · '+samples.length+' quadros';
   lastUI=now;
  }
  requestAnimationFrame(tick);
 }
 start.addEventListener('click',()=>{
  active=true;startTime=performance.now();previous=0;lastUI=0;samples=[];changes=[];lastProfile='';
  start.disabled=true;stop.disabled=false;
  requestAnimationFrame(tick);
 });
 stop.addEventListener('click',()=>{
  if(!active)return;
  active=false;start.disabled=false;stop.disabled=true;
  const stages={};
  const profiles={};
  const windows={};
  for(const sample of samples){
   (stages[sample.stage]??=[]).push(sample);
   (profiles[sample.profile]??=[]).push(sample);
   const key=Math.floor(sample.at/10_000)*10;
   (windows[key]??=[]).push(sample);
  }
  const report={
   schemaVersion:1,
   source:'Chaua Educa / opt-in local performance probe',
   collectedAt:new Date().toISOString(),
   device:{userAgent:navigator.userAgent,deviceMemoryGiB:navigator.deviceMemory??null,logicalCores:navigator.hardwareConcurrency??null,
    screen:[screen.width,screen.height],viewport:[innerWidth,innerHeight],devicePixelRatio:devicePixelRatio},
   mode:quality.mode,
   wallSeconds:+((performance.now()-startTime)/1000).toFixed(1),
   capped:samples.length===MAX_FRAMES,
   samplesIncludeOnlyVisibleFocusedPlayingFrames:true,
   summary:summarize(samples),
   byStage:Object.fromEntries(Object.entries(stages).map(([key,x])=>[key,summarize(x)])),
   byProfile:Object.fromEntries(Object.entries(profiles).map(([key,x])=>[key,summarize(x)])),
   byTenSecondWindow:Object.fromEntries(Object.entries(windows).map(([key,x])=>[key,summarize(x)])),
   profileChanges:changes
  };
  download(report);
  label.textContent='Concluído · '+(report.summary.fps??'—')+' FPS · relatório salvo';
 });
}
