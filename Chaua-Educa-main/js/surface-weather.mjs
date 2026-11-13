import {getWeatherMode,journeyRain} from './weather.mjs';
import {climateReferenceSeconds} from './climate-progress.mjs';
import {winterAmount} from './living-motion.mjs';

export const SURFACE_TIMING=Object.freeze({snowDelay:8,snowRamp:90,wetSeconds:9,drySeconds:28});
const unit=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=unit(x);return t*t*(3-2*t);};
export function createSurfaceWeather(){return {mode:getWeatherMode(),winterStart:0,snow:0,wet:0,drip:0,cold:0};}
// Flight state owns this small record: no renderer integration, RAF dependency,
// random draws, layout reads, or advancement while paused/answering a quiz.
export function advanceSurfaceWeather(game,dt){
 const s=game.surfaceWeather??(game.surfaceWeather=createSurfaceWeather());
 const mode=getWeatherMode();
 if(s.mode!==mode){s.mode=mode;s.winterStart=game.elapsed;}
 const cold=game.tutorial?0:winterAmount(game);
 const onset=mode==='auto'?.65*climateReferenceSeconds(game.mode,game.seed):s.winterStart;
 const target=cold>0?smooth((game.elapsed-onset-SURFACE_TIMING.snowDelay)/SURFACE_TIMING.snowRamp):0;
 // AUTO's onset is deterministic; leaving winter releases cover smoothly.
 s.snow+=Math.max(-dt/12,Math.min(dt/8,target-s.snow));
 const rain=game.tutorial?0:journeyRain(game,game.tutorial);
 const wetTarget=rain*(1-s.snow*.9);
 const step=dt/(wetTarget>s.wet?SURFACE_TIMING.wetSeconds:SURFACE_TIMING.drySeconds);
 s.wet+=Math.max(-step,Math.min(step,wetTarget-s.wet));
 s.drip=unit((s.wet-.18)/.6)*(1-s.snow)*(1-cold*.8);
 s.cold=cold;
 return s;
}
// Pure fallback supports static render fixtures/seeking without mutating a game.
export function surfaceSnow(game){
 if(game.surfaceWeather)return game.surfaceWeather.snow;
 if(game.tutorial)return 0;
 const onset=getWeatherMode()==='auto'?.65*climateReferenceSeconds(game.mode,game.seed):0;
 return winterAmount(game)>0?smooth(((game.elapsed||0)-onset-8)/90):0;
}
