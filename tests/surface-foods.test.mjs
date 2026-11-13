import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Game} from '../Chaua-Educa-main/js/engine.mjs';
import {FOODS} from '../Chaua-Educa-main/js/foods.mjs';
import {createSurfaceWeather,advanceSurfaceWeather,surfaceSnow} from '../Chaua-Educa-main/js/surface-weather.mjs';
import {setWeatherMode} from '../Chaua-Educa-main/js/weather.mjs';
import {climateReferenceSeconds} from '../Chaua-Educa-main/js/climate-progress.mjs';
import {RUNTIME_ART} from '../Chaua-Educa-main/js/runtime-art-data.mjs';
import {TreeDrips} from '../Chaua-Educa-main/js/weather-art.mjs';
import DB from '../Chaua-Educa-main/js/database.js';
import {normalizeProgress,completedMissions} from '../Chaua-Educa-main/js/missions.mjs';

const advance=(g,seconds)=>{for(let i=0;i<Math.round(seconds*120);i++){g.elapsed+=1/120;advanceSurfaceWeather(g,1/120);}};
test('manual winter starts bare and reaches full cover only after 98 flight seconds',()=>{
 setWeatherMode('winter');const g={elapsed:0,mode:'aventura',seed:104,surfaceWeather:createSurfaceWeather()};
 assert.equal(surfaceSnow(g),0);advance(g,8);assert.ok(g.surfaceWeather.snow<1e-12);
 advance(g,22);assert.ok(g.surfaceWeather.snow>.14&&g.surfaceWeather.snow<.16);
 advance(g,30);assert.ok(g.surfaceWeather.snow>.60&&g.surfaceWeather.snow<.63);
 advance(g,38);assert.ok(g.surfaceWeather.snow>1-1e-9);setWeatherMode('auto');
});
test('automatic snowfall and deposited cover use separate curves without moving seasons',()=>{
 setWeatherMode('auto');const onset=.65*climateReferenceSeconds('aventura',694180000);
 const g={elapsed:onset,mode:'aventura',seed:694180000,surfaceWeather:createSurfaceWeather()};
 advance(g,59);assert.ok(g.surfaceWeather.cold===1&&g.surfaceWeather.snow>.55&&g.surfaceWeather.snow<.65);
 advance(g,39);assert.ok(g.surfaceWeather.snow>1-1e-9);
});
test('paused and quiz games freeze cover/wetness, and a fresh flight resets them',()=>{
 setWeatherMode('rain');const g=new Game({seed:104});g.state='paused';
 const before=JSON.stringify(g.surfaceWeather);for(let i=0;i<240;i++)g.tick(1/120);
 assert.equal(JSON.stringify(g.surfaceWeather),before);
 g.state='quiz';for(let i=0;i<240;i++)g.tick(1/120);assert.equal(JSON.stringify(g.surfaceWeather),before);
 const fake={elapsed:0,mode:'aventura',seed:104,surfaceWeather:createSurfaceWeather()};advance(fake,9);
 assert.ok(fake.surfaceWeather.wet>.8);setWeatherMode('summer');advance(fake,14);
 assert.ok(fake.surfaceWeather.wet>.2&&fake.surfaceWeather.wet<.5);advance(fake,20);assert.equal(fake.surfaceWeather.wet,0);
 g.surfaceWeather.snow=1;g.surfaceWeather.wet=1;g.start();assert.equal(g.surfaceWeather.snow,0);assert.equal(g.surfaceWeather.wet,0);setWeatherMode('auto');
});
test('all twelve foods survive reload, and retired credit never grants a new food',()=>{
 const stored=new Map([['chaua-floresta-collection','["Goiaba","Milho","Coquinho"]']]);
 globalThis.localStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)};DB.memory=new Map();DB.storageAvailable=true;
 assert.deepEqual(DB.unlocked(),['Goiaba']);assert.equal(JSON.parse(stored.get('chaua-food-catalog-version')),2);
 for(const f of FOODS)DB.unlock(f.id);DB.memory=new Map();assert.equal(DB.unlocked().length,12);
 assert.ok(JSON.parse(stored.get('chaua-floresta-collection')).includes('Milho'));
 const p=normalizeProgress({varieties:['Goiaba','Manga','Milho']});assert.ok(completedMissions(p).some(m=>m.id==='variety'));
 delete globalThis.localStorage;DB.memory=new Map();
});
test('cropped runtime pages have canonical hashes, bounds and six distinct snow times',()=>{
 const root=new URL('../Chaua-Educa-main/js/',import.meta.url);
 for(const family of Object.values(RUNTIME_ART))for(const page of family.pages){
  const data=fs.readFileSync(new URL(page.path,root));assert.equal(createHash('sha256').update(data).digest('hex'),page.sha256);
  assert.ok(page.width<=1024&&page.height<=1024);
 }
 assert.equal(FOODS.length,12);assert.equal(new Set(FOODS.map(x=>x.id)).size,12);
 for(const frames of RUNTIME_ART.foods.frames)assert.equal(frames.length,4);
 for(let t=0;t<6;t++)assert.ok(Object.keys(RUNTIME_ART.fx.frames).some(k=>k.startsWith(`snow-${t}-`)));
 for(const group of ['wet','fx'])for(const frame of Object.values(RUNTIME_ART[group].frames)){
  const [x,y,w,h]=frame.rect,page=RUNTIME_ART[group].pages[frame.page];
  assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=page.width&&y+h<=page.height);
 }
});
test('upper tree droplets fall in world coordinates and respect the Low cap',()=>{
 const pool=new TreeDrips(),game={speed:0,entities:[{kind:'wood',id:1,x:200,top:160,bottom:400}]};
 const c={save(){},restore(){},drawImage(){}};const bounds={left:0,right:960,bottom:640};
 for(let i=0;i<130;i++)pool.draw(c,game,i/60,1,0,true,false,bounds);
 const drop=pool.items.find(p=>p.active&&p.age>.4);
 assert.ok(drop);const y=drop.y;pool.draw(c,game,130/60,1,0,true,false,bounds);assert.ok(drop.y>y);
 assert.ok(pool.items.filter(p=>p.active).length<=8);
 pool.draw(c,game,130/60,1,0,true,true,bounds);assert.ok(pool.items.every(p=>!p.active));
});
