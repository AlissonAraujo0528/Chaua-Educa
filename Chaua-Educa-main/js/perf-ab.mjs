// Test-only switches, deliberately ignored on ordinary game links.
export const PERF_AB_OPTIONS=Object.freeze([
 'baseline','direct-snow','precomposed-snow','winter-caps-bitmap','snow-mask-off','snow-flakes-off','static-season-bg','legacy-snow-clips','legacy-snow-rebuild'
]);
export function resolvePerfVariant(search='') {
 const params=new URLSearchParams(search);
 // The original-art Test C can be enabled on ordinary game URLs.
 if(params.get('perf-ab')==='precomposed-snow')return 'precomposed-snow';
 if(params.get('perf-test')!=='1')return 'precomposed-snow';
 const requested=params.get('perf-ab')||'precomposed-snow';
 return PERF_AB_OPTIONS.includes(requested)?requested:'precomposed-snow';
}
export const PERF_AB_VARIANT=resolvePerfVariant(typeof location==='undefined'?'':location.search);
