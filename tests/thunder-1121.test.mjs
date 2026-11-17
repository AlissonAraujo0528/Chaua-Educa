import test from 'node:test';
import assert from 'node:assert/strict';
import {ForestAudio} from '../Chaua-Educa-main/js/audio.mjs';
import {lightningStrikeAt,LIGHTNING_CYCLE_SECONDS} from '../Chaua-Educa-main/js/lightning.mjs';
import {drawLightning} from '../Chaua-Educa-main/js/weather.mjs';

function fakeAudioContext(){
    const context={sampleRate:48000,currentTime:0,state:'running',events:[],bufferCalls:[]};
    const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},cancelScheduledValues(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}});
    const node=()=>{const n={gain:param(),frequency:param(),playbackRate:param(),connect(){return n;},disconnect(){}};return n;};
    context.destination=node();
    context.createGain=node;
    context.createBiquadFilter=node;
    context.createBuffer=(channels,length,rate)=>{
        context.bufferCalls.push({channels,length,rate});
        const data=new Float32Array(length);
        return {getChannelData:()=>data};
    };
    context.createBufferSource=()=>{
        const n=node();
        n.start=()=>{if(!n.loop)context.events.push({kind:'thunder',source:n});};
        n.stop=when=>{n.stoppedAt=when;};
        return n;
    };
    return context;
}
function harness(){
    const ctx=fakeAudioContext(),tasks=[];
    const audio=new ForestAudio(()=>ctx,fn=>tasks.push(fn));
    audio.setEnabled(true);audio.ensure();
    const flush=()=>{let count=0;while(tasks.length){tasks.shift()();if(++count>1000)throw Error('prewarm never finished');}return count;};
    return {ctx,tasks,audio,flush};
}
const strikeTime=index=>{
    for(let t=index*LIGHTNING_CYCLE_SECONDS;t<(index+1)*LIGHTNING_CYCLE_SECONDS;t+=.001){
        const strike=lightningStrikeAt(t);
        if(strike.active&&strike.phase>.12)return t;
    }
    throw Error('missing strike');
};
test('thunder prewarms in bounded chunks outside the game frame',()=>{
    const {ctx,tasks,audio,flush}=harness();
    assert.equal(audio.thunderBuffer,null);
    assert.ok(tasks.length>0);
    assert.equal(ctx.bufferCalls.length,2);
    assert.equal(ctx.bufferCalls[1].rate,24000);
    assert.ok(flush()>1);
    assert.ok(audio.thunderBuffer);
    assert.equal(audio.thunderBuild,null);
});
test('restart resets strike identity without rebuilding the noise buffer',()=>{
    const {ctx,audio,flush}=harness();flush();
    const t=strikeTime(0);
    audio.beginFlight();audio.update('playing',true,t,0,1,1,1);
    assert.equal(ctx.events.length,1);
    const firstBuffer=audio.thunderBuffer;
    audio.beginFlight();audio.update('playing',true,t,0,1,1,1);
    assert.equal(ctx.events.length,2);
    assert.equal(audio.thunderBuffer,firstBuffer);
});
test('menu and countdown never play storm strikes while scene has no lightning',()=>{
    const {ctx,audio,flush}=harness();flush();
    const t=strikeTime(0);
    audio.update('menu',true,t,0,1,1,1);
    audio.update('countdown',true,t,0,1,1,1);
    assert.equal(ctx.events.length,0);
    audio.update('playing',true,t,0,1,1,1);
    assert.equal(ctx.events.length,1);
});
test('pause, quiz and mute stop the active thunder voices',()=>{
    const {ctx,audio,flush}=harness();flush();
    audio.update('playing',true,strikeTime(0),0,1,1,1);
    const first=ctx.events[0].source;
    assert.equal(audio.thunderVoices.size,1);
    audio.update('quiz',true,strikeTime(0),0,1,1,1);
    assert.equal(audio.thunderVoices.size,0);
    assert.ok(first.stoppedAt<=ctx.currentTime+.1);
    audio.update('playing',true,strikeTime(1),0,1,1,1);
    const second=ctx.events[1].source;
    audio.setEnabled(false);
    assert.equal(audio.thunderVoices.size,0);
    assert.ok(second.stoppedAt<=ctx.currentTime+.1);
});
test('visual lightning and audio share one deterministic nonuniform cycle',()=>{
    const a=lightningStrikeAt(strikeTime(0)),b=lightningStrikeAt(strikeTime(1));
    assert.equal(a.index,0);assert.equal(b.index,1);
    assert.notEqual(a.startsAt+4,b.startsAt);
    assert.notEqual(a.pitch,b.pitch);
    const calls=[];
    const c=new Proxy({},{get:(target,key)=>key in target?target[key]:(...args)=>{calls.push([key,...args]);},set:(target,key,value)=>(target[key]=value,true)});
    drawLightning(c,960,640,strikeTime(0),1,false);
    assert.ok(calls.some(call=>call[0]==='fillRect'),'expected visible flash during audio strike');
    calls.length=0;
    drawLightning(c,960,640,strikeTime(0)+.5,1,false);
    assert.ok(!calls.some(call=>call[0]==='fillRect'),'no flash between strike windows');
});
