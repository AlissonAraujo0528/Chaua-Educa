const fs=require('node:fs'),path=require('node:path');
const root='test-results/offscreen-culling/native';
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name,'long-flight-high.json'),'utf8'));
const full=read('draw-all'),culled=read('culled');
if(!full.drawAllEntities||culled.drawAllEntities)throw Error('Incorrect culling comparison flags');
for(const [k,r]of [['baseline',full],['culled',culled]]){
 if(!r.won||r.stages.length!==4)throw Error(k+' failed to complete the adventure');
}
const stat=r=>({fps:r.fps,p95Ms:r.frameP95Ms,p99Ms:r.frameP99Ms,
 over33:r.framesAbove33Ms,over50:r.framesAbove50Ms,maxMs:r.maxMs,frames:r.frames});
const phases={};
for(let stage=0;stage<4;stage++)for(const type of ['transition','settled']){
 const key='stage-'+stage+'-'+type+'-high';
 const read=s=>{const x=s.phaseSegments?.[key];return x?{fps:x.fps,p95Ms:x.p95Ms,
 p99Ms:x.p99Ms,over33:x.over33,over50:x.over50,frames:x.frames}:null;};
 phases[key]={baseline:read(full),culled:read(culled)};
}
const report={baseline:stat(full),culled:stat(culled),phases,
 note:'Two complete deterministic adventures on the same runner, sequentially; system scheduling still varies.'};
fs.writeFileSync(path.join(root,'comparison.json'),JSON.stringify(report,null,2));
console.log('NATIVE_OFFSCREEN_CULL_AB '+JSON.stringify(report));
