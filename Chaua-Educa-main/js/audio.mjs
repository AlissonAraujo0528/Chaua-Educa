import {lightningStrikeAt} from './lightning.mjs';

// Synthesized local ambience: no network audio, timers or autoplay before interaction.
export class ForestAudio {
    constructor(contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)(), scheduleThunderChunk=fn=>{
        if(typeof requestIdleCallback==='function')return requestIdleCallback(fn,{timeout:100});
        return setTimeout(fn,0);
    }) {
        this.contextFactory=contextFactory;this.enabled=false;this.context=null;
        this.liveTones=new Set();this.volume=.7;this.voices=0;this.nextFilter=0;this.visible=true;this.active=false;this.lastFlap=-Infinity;
        this.lastThunderStrike=-1;
        this.thunderBuffer=null;
        this.thunderBuild=null;
        this.thunderVoices=new Set();
        this.scheduleThunderChunk=scheduleThunderChunk;
    }
    setVolume(value) {
        this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):.7;
        try {if(this.master)this.master.gain.setTargetAtTime(this.enabled&&this.visible?this.volume:0,this.context.currentTime,.04);} catch {}
    }
    setEnabled(enabled) {
        this.enabled=enabled;
        if(!enabled)this.stopThunder();
        try {if(!enabled && this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.025);} catch {}
    }
    ensure() {
        if(!this.enabled||!this.visible)return false;
        try {
            if(!this.context) {
                const c=this.context=this.contextFactory();
                this.master=c.createGain();this.master.gain.value=this.volume;this.master.connect(c.destination);
                const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);
                let last=0;
                for(let i=0;i<data.length;i++) {
                    last=(last+(Math.random()*2-1)*.035)/1.035;
                    data[i]=last*Math.min(1,i/256,(data.length-1-i)/256);
                }
                this.wind=c.createBufferSource();this.wind.buffer=buffer;this.wind.loop=true;
                this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=900;
                this.ambient=c.createGain();this.ambient.gain.value=0;
                this.wind.connect(this.filter).connect(this.ambient).connect(this.master);
                const thunderFilter = c.createBiquadFilter();
                thunderFilter.type = 'lowpass';
                thunderFilter.frequency.value = 135;
                this.thunder = c.createGain();
                this.thunder.gain.value = 0;
                this.wind.connect(thunderFilter).connect(this.thunder).connect(this.ambient);
                this.wind.start();
            }
            if(['suspended','interrupted'].includes(this.context.state)&&this.visible)this.context.resume().catch(()=>{});
            this.master.gain.setTargetAtTime(this.visible?this.volume:0,this.context.currentTime,.04);
            this.prewarmThunder();
            return true;
        } catch { this.context=null;this.thunderBuffer=null;this.thunderBuild=null;return false; }
    }
    tone(frequency,when,duration=.18,volume=.045,type='sine',end=frequency) {
        if(this.voices>=24)return;
        const c=this.context,o=c.createOscillator(),g=c.createGain();
        this.voices++;
        let released=false;
        const release=()=>{
            if(released)return;released=true;this.voices=Math.max(0,this.voices-1);
            this.liveTones.delete(o);o.disconnect();g.disconnect();
        };
        try {
            this.liveTones.add(o);o.type=type;o.frequency.setValueAtTime(frequency,when);o.frequency.exponentialRampToValueAtTime(Math.max(30,end),when+duration);
            g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(volume,when+.012);g.gain.exponentialRampToValueAtTime(.0001,when+duration);
            o.connect(g).connect(this.master);o.onended=release;o.start(when);o.stop(when+duration+.015);
        } catch {release();}

    }
    play(type) {
        if(!this.enabled||!this.visible)return;
        if(type==='thunder'){if(this.ensure())this.playThunder(1,lightningStrikeAt(0));return;}
        // UI-only events should never initialize an audio device.
        const notes={countdown:[440],'snake-warning':[330,220],'hawk-warning':[740,494],fruit:[660,880],shield:[330,494,660],'shield-break':[220,147],feather:[523,659,784,1046],
            'feather-end':[660,440],pepper:[440,554,659,880,1108],'pepper-end':[880,659,440],'tutorial-step':[523,659],'tutorial-complete':[659,784,1046],correct:[660,880,990],incorrect:[260,196],lose:[392,330,220],win:[523,659,784,1046,1318]};
        if(type!=='flap'&&!notes[type])return;
        if(!this.ensure())return;
        const now=this.context.currentTime;
        try {
            if(type==='flap') {
                if(now-this.lastFlap<.15)return;
                this.lastFlap=now;this.tone(210,now,.09,.15,'triangle',70);this.tone(140,now+.02,.07,.12,'sine',50);return;
            }
            notes[type].forEach((f,i)=>this.tone(f,now+i*.075,.18,['countdown','snake-warning','hawk-warning','feather-end','pepper-end'].includes(type) ? .08 : .18,type==='shield-break'?'triangle':'sine'));
        } catch { /* Audio failure never blocks the game. */ }
    }
    // v1.0.12.1: build a single 24 kHz thunder buffer in bounded idle chunks.
    // Never synthesize tens of thousands of samples inside the flight RAF.
    prewarmThunder() {
        const c=this.context;
        if(!c||this.thunderBuffer||this.thunderBuild||typeof c.createBuffer!=='function')return;
        try {
            const sampleRate=Math.min(24000,Math.max(8000,c.sampleRate||44100));
            const buffer=c.createBuffer(1,Math.floor(sampleRate*2.8),sampleRate);
            const data=buffer.getChannelData(0);
            const leaders=[
                {t:0,amp:.9},{t:.014,amp:.6},{t:.030,amp:1.1},{t:.048,amp:1.45}
            ];
            let index=0,lp1=0,lp2=0,lp3=0,hpIn=0,hpOut=0;
            const build={context:c};this.thunderBuild=build;
            const chunk=()=>{
                if(this.thunderBuild!==build||this.context!==c)return;
                try {
                    const end=Math.min(index+2048,data.length);
                    for(;index<end;index++){
                        const t=index/sampleRate,white=Math.random()*2-1;
                        const hp=.92*(hpOut+white-hpIn);
                        hpIn=white;hpOut=hp;
                        const cutoff=Math.max(50,240*Math.exp(-t*1.3));
                        const alpha=1-Math.exp(-2*Math.PI*cutoff/sampleRate);
                        lp1+=alpha*(white-lp1);lp2+=alpha*(lp1-lp2);lp3+=alpha*(lp2-lp3);
                        const deep=lp3*4.6;
                        let crackle=0;
                        for(const leader of leaders){
                            if(t>=leader.t&&t<leader.t+.09)
                                crackle+=hp*Math.exp(-(t-leader.t)*60)*leader.amp;
                        }
                        let shock=0;
                        if(t>=.048&&t<.75){
                            const dt=t-.048;
                            shock=deep*2.4*Math.pow(dt/.05,.8)*Math.exp(-dt*6.5);
                        }
                        let rumble=0;
                        if(t>=.06){
                            const dt=t-.06;
                            const roll=(.5+.45*Math.sin(dt*6.8))*.45+
                                (.5+.35*Math.cos(dt*11.5+.8))*.35+
                                (.5+.25*Math.sin(dt*3.2+2.1))*.2;
                            rumble=deep*Math.pow(dt/.2,.6)*Math.exp(-dt*1.35)*roll*3.2;
                        }
                        data[index]=Math.tanh((crackle*1.6+shock+rumble)*1.45)*.92;
                    }
                    if(index<data.length)this.scheduleThunderChunk(chunk);
                    else {this.thunderBuffer=buffer;this.thunderBuild=null;}
                } catch {this.thunderBuild=null;}
            };
            this.scheduleThunderChunk(chunk);
        } catch {this.thunderBuild=null;}
    }
    beginFlight() {
        this.stopThunder();
        this.lastThunderStrike=-1;
    }
    stopThunder() {
        const now=this.context?.currentTime??0;
        for(const voice of this.thunderVoices){
            try {
                voice.gain.gain.cancelScheduledValues(now);
                voice.gain.gain.setTargetAtTime(0,now,.012);
                voice.source.stop(now+.08);
            } catch { /* Already finished or interrupted by device */ }
        }
        this.thunderVoices.clear();
        try {this.thunder?.gain.setTargetAtTime(0,now,.025);} catch {}
    }
    playThunder(storm=1,strike=lightningStrikeAt(0)) {
        if(!this.enabled||!this.visible||!this.context||this.context.state!=='running')return;
        try {
            const c=this.context,now=c.currentTime;
            const stormGain=Math.min(1,Math.max(.2,storm));
            if(!this.thunderBuffer){
                this.prewarmThunder();
                // Short, low-frequency ambience remains audible while the first
                // buffer is prepared. Never synthesize synchronously here.
                this.thunder?.gain.setTargetAtTime(.8*stormGain,now,.03);
                return;
            }
            const source=c.createBufferSource(),gain=c.createGain();
            source.buffer=this.thunderBuffer;
            source.playbackRate.setValueAtTime(strike.pitch,now);
            gain.gain.setValueAtTime(.65*stormGain*strike.amplitude,now);
            source.connect(gain).connect(this.master);
            const voice={source,gain};
            this.thunderVoices.add(voice);
            source.onended=()=>{
                this.thunderVoices.delete(voice);
                try {source.disconnect();gain.disconnect();} catch {}
            };
            source.start(now);
            source.stop(now+3.3);
            this.thunder?.gain.setTargetAtTime(.8*stormGain,now,.03);
        } catch { /* Audio failures must not stop gameplay */ }
    }
    update(state,visible,time,stage,rain=0,storm=0,wind=0) {
        if(!this.context || this.context.state==='closed')return;
        try {
        if(this.visible!==visible){
            this.visible=visible;
            if(!visible){
                this.stopThunder();
                for(const oscillator of this.liveTones){try{oscillator.stop();}catch{}}
            }
            this.master.gain.setTargetAtTime(this.enabled&&visible?this.volume:0,this.context.currentTime,.025);
            // Muting a gain node does NOT stop Biquad processing. Suspend the
            // audio graph when hidden and resume it on focus restoration.
            const context=this.context;
            if(!visible&&context.state==='running'){
                context.suspend().then(()=>{
                    // Focus may have returned before suspension completed.
                    if(this.visible&&this.enabled&&context.state==='suspended')
                        return context.resume();
                }).catch(()=>{});
            }else if(visible&&this.enabled&&context.state==='suspended'){
                context.resume().catch(()=>{});
            }
        }
        const active=this.enabled&&visible&&['menu','playing','countdown','arrival'].includes(state);
        const c=this.context;
        if(active!==this.active) {
            this.active=active;this.ambient.gain.setTargetAtTime(active ? .2 : 0,c.currentTime,.25);
            if(!active)this.stopThunder();
        }
        const stormVisible=['playing','arrival'].includes(state);
        if(!stormVisible&&this.thunderVoices.size)this.stopThunder();
        if(!active||c.state!=='running')return;
        const audibleStorm=stormVisible?storm:0;
        if(audibleStorm>.05){
            const strike=lightningStrikeAt(time);
            if(strike.active&&strike.index!==this.lastThunderStrike){
                this.lastThunderStrike=strike.index;
                this.playThunder(audibleStorm,strike);
            }
        }
        if(c.currentTime>=this.nextFilter){
            this.nextFilter=c.currentTime+.1;
            const windFrequency = 750 + Math.sin(time * .6) * 180 + stage * 90 + wind * 350;
            this.filter.frequency.setTargetAtTime(windFrequency + rain * 1450 + storm * 450,c.currentTime,.5);
            const rumble = Math.pow(.5 + .5 * Math.sin(time * 1.55), 4);
            this.thunder.gain.setTargetAtTime(audibleStorm * rumble * .8, c.currentTime, .25);
        }
        } catch { /* Device interruption must not stop the rendering loop. */ }
    }
}
