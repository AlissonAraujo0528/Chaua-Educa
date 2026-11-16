// Compare the newly optimized Game against the exact engine at the parent
// commit. The workflow generates engine-before-audit.mjs from Git history.
const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
(async()=>{
 const {Game:NewGame,STEP}=await import('../Chaua-Educa-main/js/engine.mjs');
 const {Game:OldGame}=await import('../Chaua-Educa-main/js/engine-before-audit.mjs');
 const normalize=(value)=>JSON.stringify(value,(key,v)=>v instanceof Map?[...v]:typeof v==='function'?undefined:v);
 const setup=(Game,scenario,seed,events)=>{
   const g=new Game({seed,onEvent:e=>events.push({...e})});
   g.start('aventura',[],seed);g.state='playing';g.y=320;g.vy=0;g.nextSpawn=999;
   if(scenario==='shielded-wood'){
     g.shield=true;g.entities=[
       {id:10,kind:'wood',x:240,top:350,bottom:455,variant:'branch',scored:false},
       {id:11,kind:'wood',x:280,top:180,bottom:310,variant:'plain',scored:false},
       {id:12,kind:'fruit',x:263,y:400,variety:0,route:2}];
   }else if(scenario==='hawk-pickups'){
     g.shield=true;g.entities=[
       {id:10,kind:'hawk',x:335,y:320,startX:335,startY:320,targetX:160,targetY:320,warning:0,phase:'crossing',age:0,dive:false},
       {id:11,kind:'fruit',x:270,y:320,variety:0,route:1},
       {id:12,kind:'fruit',x:390,y:320,variety:1,route:1},
       {id:13,kind:'wood',x:510,top:120,bottom:510,variant:'branch',scored:false}];
   }else if(scenario==='many-entities'){
     g.shield=true;g.invincible=5000;
     g.entities=Array.from({length:20},(_,i)=>
       i%4===0?{id:100+i,kind:'wood',x:350+i*65,top:180,bottom:490,variant:i%8?'plain':'branch',scored:false}:
       i%4===1?{id:100+i,kind:'hawk',x:550+i*65,y:330,startX:550+i*65,startY:330,targetX:160,targetY:330,warning:1,phase:'warning',age:0,dive:false}:
       {id:100+i,kind:'fruit',x:400+i*65,y:320,variety:i%5,route:i});
   }else if(scenario==='clean-invalid'){
     g.invincible=5000;g.entities=[{id:10,kind:'fruit',x:NaN,y:320},{id:11,kind:'fruit',x:500,y:320}];
     g.particles=[{life:NaN,x:0,y:0,vx:0,vy:0},{life:1,x:0,y:0,vx:0,vy:0}];
   }
   return g;
 };
 for(const scenario of ['shielded-wood','hawk-pickups','many-entities','clean-invalid','empty']){
  for(const seed of [104,2026]){
   const oldEvents=[],newEvents=[],old=setup(OldGame,scenario,seed,oldEvents),
     current=setup(NewGame,scenario,seed,newEvents);
   for(let tick=0;tick<460;tick++){
     if(tick%35===0){old.press();current.press();}
     if(tick%35===3){old.release();current.release();}
     old.tick(STEP);current.tick(STEP);
     assert.equal(normalize(current),normalize(old),
       'Different game state '+scenario+' seed '+seed+' tick '+tick);
     assert.equal(normalize(newEvents),normalize(oldEvents),
       'Different events '+scenario+' seed '+seed+' tick '+tick);
   }
   console.log('ENGINE_EQUIVALENCE '+JSON.stringify({scenario,seed,ticks:460,identical:true,events:newEvents.length}));
  }
 }
 // Microbenchmark only: not a claim about full-game FPS. Alternating order
 // guards some environment drift, with identical identical deterministic runs.
 function measure(Game,count,seed){
  const e=[];
  const game=setup(Game,'many-entities',seed,e);
  game.entities.length=count;game.nextSpawn=999;game.invincible=9000;
  for(let i=0;i<100;i++)game.tick(STEP);
  const t=performance.now();
  for(let i=0;i<4000;i++)game.tick(STEP);
  return (performance.now()-t)/4000;
 }
 const measures=[];
 for(const count of [5,10,20]){
  for(let round=0;round<4;round++){
   for(const [kind,Game] of round%2?[['new',NewGame],['old',OldGame]]:[['old',OldGame],['new',NewGame]]){
    measures.push({count,round,kind,msPerTick:measure(Game,count,104+round)});
   }
  }
 }
 console.log('ENGINE_TICK_AB '+JSON.stringify(measures));
})().catch(e=>{console.error(e);process.exitCode=1;});
