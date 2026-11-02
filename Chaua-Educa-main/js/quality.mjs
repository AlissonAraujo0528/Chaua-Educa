export const QUALITY_MODES=['auto','high','low'];
export function canvasResolution(width,height,deviceRatio=1,quality='high'){
 const w=Math.max(1,Number.isFinite(width)?width:1),h=Math.max(1,Number.isFinite(height)?height:1);
 const ratio=Number.isFinite(deviceRatio)&&deviceRatio>0?deviceRatio:1;
 const dpr=Math.min(ratio,quality==='low'?1:2,Math.sqrt(4_000_000/(w*h)));
 return {dpr,width:Math.max(1,Math.floor(w*dpr)),height:Math.max(1,Math.floor(h*dpr))};
}
const SAMPLE_WINDOW=2, SLOW_FRAME=1/42, SLOW_SHARE=.35, EPSILON=1e-9;
// A bounded rolling window counts time spent in slow frames, including active
// stalls. Fast frames cannot erase recurring slowdown; one stall is insufficient.
export class VisualQuality {
 constructor(mode='auto'){
  this.samples=new Float64Array(1024);this.slowSamples=new Uint8Array(1024);
  this.setMode(mode);
 }
 setMode(mode){this.mode=QUALITY_MODES.includes(mode)?mode:'auto';this.level=this.mode==='low'?'low':'high';this.resetSamples();}
 // Low-cost frames cannot establish that the high-cost profile is sustainable.
 // Reassess only at a new flight or an explicit setting change, never mid-flight.
 beginFlight(){const previous=this.level;this.setMode(this.mode);return this.level!==previous;}
 resetSamples(){this.head=0;this.count=0;this.windowSeconds=0;this.slowSeconds=0;}
 record(seconds){
  if(this.count===this.samples.length){
   const oldest=this.samples[this.head];
   this.windowSeconds-=oldest;this.slowSeconds-=oldest*this.slowSamples[this.head];
   this.head=(this.head+1)%this.samples.length;this.count--;
  }
  const index=(this.head+this.count)%this.samples.length,slow=Number(seconds>SLOW_FRAME);
  this.samples[index]=seconds;this.slowSamples[index]=slow;this.count++;
  this.windowSeconds+=seconds;this.slowSeconds+=seconds*slow;
  while(this.windowSeconds>SAMPLE_WINDOW&&this.count){
   const removed=Math.min(this.samples[this.head],this.windowSeconds-SAMPLE_WINDOW);
   this.windowSeconds-=removed;this.slowSeconds-=removed*this.slowSamples[this.head];
   this.samples[this.head]-=removed;
   if(this.samples[this.head]<=EPSILON){this.head=(this.head+1)%this.samples.length;this.count--;}
  }
 }
 sample(seconds,active=true){
  if(!active || !Number.isFinite(seconds) || seconds<=0){this.resetSamples();return false;}
  if(this.mode!=='auto')return false;
  // Match the flight clock's cap, so a single suspended frame cannot dominate.
  seconds=Math.min(seconds,.25);
  if(this.level==='high'){
   this.record(seconds);
   if(this.windowSeconds>=SAMPLE_WINDOW-EPSILON&&this.slowSeconds>=SAMPLE_WINDOW*SLOW_SHARE){
    this.level='low';this.resetSamples();return true;
   }
  }
  return false;
 }
}
