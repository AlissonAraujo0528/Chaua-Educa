import test from 'node:test';
import assert from 'node:assert/strict';
import {getWeatherMode,setWeatherMode} from '../Chaua-Educa-main/js/weather.mjs';
import {journeySeason,drawSeasonParticles} from '../Chaua-Educa-main/js/seasons.mjs';
import {CLIMATE_FLIGHT_REFERENCE} from '../Chaua-Educa-main/js/climate-progress.mjs';

test('rain and storm change particles, never the season clock or recorded flight duration',t=>{
 const old=getWeatherMode();
 t.after(()=>setWeatherMode(old));
 const game={elapsed:0,mode:'aventura',seed:104,tutorial:false,distance:0};
 const calls=[];
 const c={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(...args){calls.push(args)},globalAlpha:1};
 const atlas={naturalWidth:1024,naturalHeight:1024};
 setWeatherMode('auto');
 const standard=journeySeason(game);
 drawSeasonParticles(c,atlas,1000,600,2,game,false,false,0);
 assert.ok(calls.length>0,'spring displays petals in fair weather');
 const originalReference={...CLIMATE_FLIGHT_REFERENCE};
 for(const weather of ['rain','storm']){
  calls.length=0;setWeatherMode(weather);
  assert.deepEqual(journeySeason(game),standard,`${weather} must not silently change season`);
  drawSeasonParticles(c,atlas,1000,600,2,game,false,false,0);
  assert.equal(calls.length,0,`${weather} should suppress falling petals`);
 }
 assert.deepEqual({...CLIMATE_FLIGHT_REFERENCE},originalReference);
});
