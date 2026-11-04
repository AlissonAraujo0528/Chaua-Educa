const fs=require('node:fs');
const path=require('node:path');
const root='test-results/transition-composite/paired';
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name,'long-flight-high.json'),'utf8'));
const original=read('direct'),optimized=read('staged');
if(!original.disableStaging||optimized.disableStaging)throw Error('Compared modes are not the direct and staged paths');
for(const [label,flight] of [['direct',original],['staged',optimized]]){
 if(!flight.won||flight.stages.length!==4)throw Error(label+' flight did not complete all stages');
}
const normalized=(flight,key)=>{
 const x=flight.phaseSegments?.[key];
 return x?{frames:x.frames,fps:+x.fps.toFixed(2),p95Ms:x.p95Ms,p99Ms:x.p99Ms,
  over33:x.over33,over50:x.over50,slow33Per1000:+(x.over33/x.frames*1000).toFixed(1)}:null;
};
const phases={};
for(let stage=0;stage<4;stage++)for(const part of ['transition','settled']){
 const key='stage-'+stage+'-'+part+'-high';
 phases[key]={direct:normalized(original,key),staged:normalized(optimized,key)};
}
const overall=flight=>({fps:+flight.fps.toFixed(2),p95Ms:flight.frameP95Ms,
 p99Ms:flight.frameP99Ms,framesAbove33Ms:flight.framesAbove33Ms,
 framesAbove50Ms:flight.framesAbove50Ms,maxMs:flight.maxMs,
 frames:flight.frames,gameSeconds:flight.gameSeconds});
const report={engine:'native requestAnimationFrame, same runner; sequential AB; seed 104',
 direct:overall(original),staged:overall(optimized),phases};
fs.writeFileSync(path.join(root,'comparison.json'),JSON.stringify(report,null,2));
console.log('PAIRED_TRANSITION_FLIGHT '+JSON.stringify(report));
