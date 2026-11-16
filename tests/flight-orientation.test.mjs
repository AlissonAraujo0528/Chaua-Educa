import test from 'node:test';
import assert from 'node:assert/strict';
import {isMobileFlightDevice,requestFlightLandscape,releaseFlightLandscape}
    from '../Chaua-Educa-main/js/flight-orientation.mjs';

test('mobile orientation is enabled only for phones and small touch devices', () => {
    const screen={width:393,height:873};
    assert.equal(isMobileFlightDevice({userAgent:'Mozilla/5.0 (Linux; Android 16)'},screen,false),true);
    assert.equal(isMobileFlightDevice({userAgent:'Mozilla/5.0 (iPhone)'},screen,false),true);
    assert.equal(isMobileFlightDevice({userAgent:'Desktop',maxTouchPoints:5},screen,true),true);
    assert.equal(isMobileFlightDevice({userAgent:'Desktop',maxTouchPoints:0},screen,false),false);
    assert.equal(isMobileFlightDevice({userAgent:'Desktop',maxTouchPoints:5},screen,false),false);
    assert.equal(isMobileFlightDevice({userAgent:'Desktop',maxTouchPoints:5},{width:1920,height:1080},true),false);
});

test('fullscreen precedes landscape lock on supported mobile browsers', async () => {
    const steps=[];
    const element={requestFullscreen:async()=>{steps.push('fullscreen');doc.fullscreenElement=element;}};
    const doc={fullscreenElement:null};
    const screen={orientation:{lock:async(value)=>{steps.push('lock:'+value);}}};
    await requestFlightLandscape(element,doc,screen);
    assert.deepEqual(steps,['fullscreen','lock:landscape']);
    await requestFlightLandscape(element,doc,screen);
    assert.deepEqual(steps,['fullscreen','lock:landscape','lock:landscape']);
});

test('unsupported fullscreen and rejected lock never prevent gameplay', async () => {
    const element={requestFullscreen:async()=>{throw new Error('unsupported');}};
    const doc={fullscreenElement:null};
    const screen={orientation:{lock:async()=>{throw new Error('not allowed');}}};
    await assert.doesNotReject(requestFlightLandscape(element,doc,screen));
    await assert.doesNotReject(requestFlightLandscape({},doc,{}));
});

test('return to menu exits our fullscreen and unlocks where possible', async () => {
    const steps=[],element={};
    const doc={fullscreenElement:element,exitFullscreen:()=>{
        steps.push('exit');doc.fullscreenElement=null;return Promise.resolve();
    }};
    const screen={orientation:{unlock:()=>steps.push('unlock')}};
    releaseFlightLandscape(element,doc,screen);
    assert.deepEqual(steps,['unlock','exit']);
    releaseFlightLandscape(element,doc,screen);
    assert.deepEqual(steps,['unlock','exit']);
});
