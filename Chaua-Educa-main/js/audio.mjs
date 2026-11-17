// Synthesized local ambience: no network audio, timers or autoplay before interaction.
export class ForestAudio {
    constructor(contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()) {
        this.contextFactory=contextFactory;this.enabled=false;this.context=null;
        this.liveTones=new Set();this.volume=.7;this.voices=0;this.nextFilter=0;this.visible=true;this.active=false;this.lastFlap=-Infinity;
        this.lastThunderStrike=-1;
        this.thunderBuffer=null;
    }
    setVolume(value) {
        this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):.7;
        try {if(this.master)this.master.gain.setTargetAtTime(this.enabled&&this.visible?this.volume:0,this.context.currentTime,.04);} catch {}
    }
    setEnabled(enabled) {
        this.enabled=enabled;
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
            return true;
        } catch { this.context=null;return false; }
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
        if(type==='thunder'){this.ensure();this.playThunder(1);return;}
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
    createThunderBuffer(c) {
        try {
            if(!c.createBuffer) return null;
            const sampleRate = c.sampleRate || 44100;
            const duration = 2.8;
            let totalSamples = Math.floor(sampleRate * duration);
            const buffer = c.createBuffer(1, totalSamples, sampleRate);
            const data = buffer.getChannelData(0);
            totalSamples = Math.min(totalSamples, data.length);

            let lp1 = 0, lp2 = 0, lp3 = 0, hpIn = 0, hpOut = 0;
            const leaders = [
                { t: 0.000, amp: 0.9 },
                { t: 0.014, amp: 0.6 },
                { t: 0.030, amp: 1.1 },
                { t: 0.048, amp: 1.45 }
            ];

            for (let i = 0; i < totalSamples; i++) {
                const t = i / sampleRate;
                const white = Math.random() * 2 - 1;

                // Highpass filter for electric ionization crackle / arc tear
                const hp = 0.92 * (hpOut + white - hpIn);
                hpIn = white; hpOut = hp;

                // 3-pole dynamic lowpass filter for deep resonant thunder roar
                const cutoffHz = Math.max(50, 240 * Math.exp(-t * 1.3));
                const alpha = 1 - Math.exp(-2 * Math.PI * cutoffHz / sampleRate);
                lp1 += alpha * (white - lp1);
                lp2 += alpha * (lp1 - lp2);
                lp3 += alpha * (lp2 - lp3);
                const deepNoise = lp3 * 4.6;

                // 1. Sharp electric arc tear & jagged leader micro-strikes
                let crackle = 0;
                for (let j = 0; j < leaders.length; j++) {
                    const l = leaders[j];
                    if (t >= l.t && t < l.t + 0.09) {
                        const dt = t - l.t;
                        crackle += hp * Math.exp(-dt * 60) * l.amp;
                    }
                }

                // 2. Heavy explosive shockwave blast
                let shockwave = 0;
                if (t >= 0.048 && t < 0.75) {
                    const dt = t - 0.048;
                    const shockEnv = Math.pow(dt / 0.05, 0.8) * Math.exp(-dt * 6.5);
                    shockwave = deepNoise * 2.4 * shockEnv;
                }

                // 3. Rolling thunder reverberation with turbulent acoustic swell
                let rumble = 0;
                if (t >= 0.06) {
                    const dt = t - 0.06;
                    const roll = (0.5 + 0.45 * Math.sin(dt * 6.8)) * 0.45 +
                                 (0.5 + 0.35 * Math.cos(dt * 11.5 + 0.8)) * 0.35 +
                                 (0.5 + 0.25 * Math.sin(dt * 3.2 + 2.1)) * 0.2;
                    const decay = Math.pow(dt / 0.2, 0.6) * Math.exp(-dt * 1.35);
                    rumble = deepNoise * decay * roll * 3.2;
                }

                // Acoustic soft-clipping saturation (tanh) gives authentic shockwave weight
                const total = crackle * 1.6 + shockwave + rumble;
                data[i] = Math.tanh(total * 1.45) * 0.92;
            }
            return buffer;
        } catch { return null; }
    }
    playThunder(storm=1) {
        if(!this.enabled||!this.visible||!this.context)return;
        const c=this.context;
        if(c.state!=='running')return;
        try {
            const now=c.currentTime;
            const stormGain=Math.min(1,Math.max(0.2,storm));

            if(!this.thunderBuffer) {
                this.thunderBuffer = this.createThunderBuffer(c);
            }

            if(this.thunderBuffer) {
                const src = c.createBufferSource();
                src.buffer = this.thunderBuffer;
                if(src.playbackRate?.setValueAtTime) {
                    src.playbackRate.setValueAtTime(0.92 + Math.random() * 0.16, now);
                }
                const gain = c.createGain();
                if(gain.gain?.setValueAtTime) {
                    gain.gain.setValueAtTime(0.85 * stormGain, now);
                }
                src.connect(gain).connect(this.master);
                src.start(now);
                if(src.stop) src.stop(now + 3.0);
            }

            // Surge ambient storm thunder bed during flash
            if(this.thunder?.gain?.setTargetAtTime){
                this.thunder.gain.setTargetAtTime(0.85*stormGain,now,.03);
            }
        } catch { /* Procedural audio failure must not affect gameplay */ }
    }
    update(state,visible,time,stage,rain=0,storm=0,wind=0) {
        if(!this.context || this.context.state==='closed')return;
        try {
        if(this.visible!==visible){
            this.visible=visible;
            if(!visible){for(const oscillator of this.liveTones){try{oscillator.stop();}catch{}}}
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
        }
        if(!active||c.state!=='running')return;
        if(storm > 0.05) {
            const strikeIndex = Math.floor(time * 0.31 + 0.15);
            const cycle = (time * 0.31 + 0.15) % 1;
            if(cycle < 0.09 && this.lastThunderStrike !== strikeIndex) {
                this.lastThunderStrike = strikeIndex;
                this.playThunder(storm);
            }
        }
        if(c.currentTime>=this.nextFilter){
            this.nextFilter=c.currentTime+.1;
            const windFrequency = 750 + Math.sin(time * .6) * 180 + stage * 90 + wind * 350;
            this.filter.frequency.setTargetAtTime(windFrequency + rain * 1450 + storm * 450,c.currentTime,.5);
            const rumble = Math.pow(.5 + .5 * Math.sin(time * 1.55), 4);
            this.thunder.gain.setTargetAtTime(storm * rumble * .8, c.currentTime, .25);
        }
        } catch { /* Device interruption must not stop the rendering loop. */ }
    }
}
