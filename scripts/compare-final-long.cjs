// Pre-merge A/B. Compare complete native-RAF flights (same code, fixed seed,
// same quality/DPR), switching only the measured optimizations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='test-results/final-premerge';
const baseline=JSON.parse(fs.readFileSync(path.join(root,'baseline','long-flight-high.json'),'utf8'));
const candidate=JSON.parse(fs.readFileSync(path.join(root,'candidate','long-flight-high.json'),'utf8'));
assert.ok(baseline.won&&candidate.won,'Both complete runs must reach the refuge');
assert.deepEqual(baseline.stages,[0,1,2,3]);
assert.deepEqual(candidate.stages,[0,1,2,3]);
assert.ok(baseline.disableStripeSync&&baseline.keepOpaqueSky&&baseline.keepOpaqueLightKey,
 'The baseline must disable exactly the three optimizations');
assert.ok(!candidate.disableStripeSync&&!candidate.keepOpaqueSky&&!candidate.keepOpaqueLightKey,
 'The candidate must have all three optimizations enabled');
assert.equal(baseline.canvasWidth,candidate.canvasWidth);
assert.equal(baseline.canvasHeight,candidate.canvasHeight);
assert.equal(baseline.requestedMode,candidate.requestedMode);
const normalized=(r)=>({fps:r.fps,frames:r.frames,gameSeconds:r.gameSeconds,
 p95:r.frameP95Ms,p99:r.frameP99Ms,max:r.maxMs,
 above33:r.framesAbove33Ms,above50:r.framesAbove50Ms,above100:r.framesAbove100Ms});
const segment=(flight,stage,kind)=>{
 const x=flight.phaseSegments['stage-'+stage+'-'+kind+'-high'];
 return x?{frames:x.frames,fps:x.fps,p95:x.p95Ms,p99:x.p99Ms,above33:x.over33,above50:x.over50}:null;
};
const stages={};
for(let stage=0;stage<4;stage++)for(const part of ['transition','settled'])
 stages[stage+'-'+part]={baseline:segment(baseline,stage,part),candidate:segment(candidate,stage,part)};
const report={test:'Full native RAF flight, Chromium/SwiftShader; one sequential A/B pair; seed 104; High fidelity',
 baseline:normalized(baseline),candidate:normalized(candidate),stages,
 limitation:'Runner load and display scheduling vary: do not infer device 60 FPS or deterministic speedups from one pair.'};
fs.writeFileSync(path.join(root,'comparison.json'),JSON.stringify(report,null,2));
console.log('PREMERGE_LONG_PAIRED '+JSON.stringify(report));
