import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSET_PATHS,images,loadAssets} from '../Chaua-Educa-main/js/assets.mjs';
import {preloadSnakeA2,isSnakeA2Ready} from '../Chaua-Educa-main/js/snake-a2.mjs';

test('all required textures finish asynchronous decoding before the game is ready',async()=>{
 const old=globalThis.Image;let count=0;
 class Img{
  naturalWidth=1;naturalHeight=1;
  set src(url){this.url=url;queueMicrotask(()=>this.onload?.());}
  async decode(){count++;}
 }
 globalThis.Image=Img;
 try{
  await loadAssets();
  assert.equal(count,Object.keys(ASSET_PATHS).length);
  assert.equal(images.size,count);
  for(let i=0;i<6;i++)assert.ok(images.has(`trees-upper-shedding-0${i}`));
 }finally{globalThis.Image=old;}
});

test('all three A2 textures finish decoding before the renderer reports ready',async()=>{
 const old=globalThis.Image;let count=0;
 class Img{
  naturalWidth=1536;naturalHeight=768;
  set src(url){this.url=url;queueMicrotask(()=>this.onload?.());}
  async decode(){count++;}
 }
 globalThis.Image=Img;
 try{
  await preloadSnakeA2();
  assert.equal(count,3);
  assert.equal(isSnakeA2Ready(),true);
 }finally{globalThis.Image=old;}
});
