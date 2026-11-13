import {TREE_WIDTH} from './forest-geometry.mjs';
import {FOREST_ART} from './forest-art-data.mjs';
import {images} from './assets.mjs';
import {drawPackedSection} from './weather-art.mjs';
import {winterOverlayStages} from './winter-vfx.mjs';


// Source sprites retain their authored proportions. Only an undecorated bark
// strip extends toward the viewport edge; caps, knots and leaves never stretch.
export function drawLivingTrunk(c, {x, y, upper = false, width = TREE_WIDTH, length = 900, variant = 0, time = 0, snow = 0, rain = 0}) {
 const kind = upper ? 'upper' : 'lower';
 const fullSnow = snow >= 1 - 1e-6;
 const snowImg4 = fullSnow ? images.get(`trees-${kind}-snow-04`) : null;
 const image = snowImg4 || images.get(`trees-${kind}`);
 if (!image) return;

 const f = FOREST_ART[kind][((variant % 4) + 4) % 4], s = width / (f.core[1] - f.core[0]);
 const [sx, sy] = f.rect, [cx, cy, cw, ch] = f.content;
 const px = x + (cx - f.anchor[0]) * s, py = y + (cy - f.anchor[1]) * s;
 const coreLeft = x + (f.core[0] - f.anchor[0]) * s;
 const stripLeft = f.core[0], stripWidth = f.core[1] - f.core[0];
 const splice = upper ? f.spliceY : f.spliceY - 1;
 // Snow icicles may extend past original alpha bounds. Visual clip only.
 const snowyTipEnd=upper&&snow>0?Math.max(f.endY,Math.min(512,f.endY+30)):f.endY;
 const join = y + (splice - f.anchor[1]) * s;
 if (upper) {
  const start = y - length;
  if (join > start) c.drawImage(image, sx + stripLeft, sy + splice, stripWidth, 1, coreLeft, start, width, join - start + .5);
  c.drawImage(image, sx + cx, sy + splice, cw, snowyTipEnd - splice, px, join, cw * s, (snowyTipEnd - splice) * s);
 } else {
  const end = y + length;
  if (end > join) c.drawImage(image, sx + stripLeft, sy + splice, stripWidth, 1, coreLeft, join - .5, width, end - join + .5);
  // Preserve the snow dome above the bare wood's y=20 content bound.
  const capTop=snow>0?0:cy;
  c.drawImage(image,sx+cx,sy+capTop,cw,splice-capTop,
   px,y+(capTop-f.anchor[1])*s,cw*s,(splice-capTop)*s);
 }

 // Restrained wet detail on existing bark, near the visible trunk cap.
 if(rain>0){c.save();c.globalAlpha=rain*.42;
  drawPackedSection(c,'wet',`${kind}-${((variant%4)+4)%4}`,cx,upper?splice:cy,cw,(upper?f.endY:splice)-(upper?splice:cy),px,upper?join:py,cw*s,((upper?f.endY:splice)-(upper?splice:cy))*s);c.restore();}

 // Crossfade between the EXISTING four transparent snowfall WebP layers.
 // Only the visible branch/cap is coated; a suspended tree must never gain
 // snow along the trunk section attached to the ceiling.
 if(snow>0&&!fullSnow){
  const overlay=snowOverlay(kind,snow);
  if(overlay){
   if(upper)c.drawImage(overlay,sx+cx,sy+splice,cw,snowyTipEnd-splice,px,join,cw*s,(snowyTipEnd-splice)*s);
   else c.drawImage(overlay,sx+cx,sy,cw,splice,px,y-f.anchor[1]*s,cw*s,splice*s);
  }
 }

 // Ambient snow flurries shedding gently from upper tree branches in winter
 if (upper && snow > 0.15) {
  const shedFrame = Math.floor((time * 3 + variant * 1.5) % 6);
  c.save();c.globalAlpha=Math.min(1,(snow-.15)*1.25);
  drawPackedSection(c,'fx',`snow-${shedFrame}-${((variant%4)+4)%4}`,cx,splice,cw,f.endY-splice,px,join,cw*s,(f.endY-splice)*s);
  c.restore();
 }
}

// Four transparent 256 px cells. The cap and bark core use the same
// center and scale across variants, regardless of moss or leaf overhang.
const TREE_CELL = 256;
const TREE_CAP_Y = 8;
const TREE_CORE_WIDTH = 128;
const TREE_VARIANTS = ['rot', 'hollow', 'moss', 'vine'];
const TREE_SPLICES = [181, 180, 180, 182];

export function drawTreeVariant(c, x, y, upper, kind, breakAge, snow = 0, rain = 0, time = 0, visibleReach = 1000) {
 const image = images.get('tree-variants');
 const index = TREE_VARIANTS.indexOf(kind);
 if (!image || index < 0) return;
 const sx = (index % 2) * TREE_CELL;
 const sy = Math.floor(index / 2) * TREE_CELL;
 const scale = TREE_WIDTH / TREE_CORE_WIDTH;
 const splice = TREE_SPLICES[index];
 const join = (splice - TREE_CAP_Y) * scale;
 const left = -TREE_CELL * scale / 2;

 c.save();
 c.translate(x, y);
 if (upper) c.scale(1, -1);
 if (breakAge === undefined || breakAge < .055) {
  // Repeat a reflected bark band at native scale. Stretching a scanline
  // turned grooves and moss into long vertical stripes on portrait screens.
  const bandHeight = 96, tileHeight = bandHeight * scale;
  // Culling is presentation-only: include a margin for fractional camera
  // transforms and wood sway. When called without the flight camera,
  // preserve the complete source drawing for screenshots/tests.
  const reach=Math.max(join,Math.min(1000,Number.isFinite(visibleReach)?visibleReach:1000));
  for (let pos = join - .5, tile = 0; pos < reach; pos += tileHeight, tile++) {
   c.save();
   c.translate(0, pos + (tile % 2 === 0 ? tileHeight : 0));
   if (tile % 2 === 0) c.scale(1, -1);
   c.drawImage(image, sx + (TREE_CELL - TREE_CORE_WIDTH) / 2, sy + splice - bandHeight,
    TREE_CORE_WIDTH, bandHeight, -TREE_WIDTH / 2, 0, TREE_WIDTH, tileHeight + .5);
   c.restore();
  }
  c.drawImage(image, sx, sy + TREE_CAP_Y, TREE_CELL, splice - TREE_CAP_Y,
   left, 0, TREE_CELL * scale, join);

  // Material highlight remains local to the cap; the WebP silhouette stays intact.
  if(rain>0&&breakAge===undefined)
   {c.save();c.globalAlpha=rain*.42;drawPackedSection(c,'wet',`variants-${index}`,0,TREE_CAP_Y,TREE_CELL,splice-TREE_CAP_Y,left,0,TREE_CELL*scale,join);c.restore();}

  // Snow variant transition
  if (snow > 0 && breakAge === undefined) {
   const snowImage = images.get('tree-variants-snow');
   if (snowImage) {
    c.save();
    c.globalAlpha = Math.min(1, snow);
    // Keep the original snowy cut face, but do not tile the snowy bark
    // strip all the way to the ceiling: repeating it made vertical stripes.
    // Upper trunks are turned upside down. Mirroring this white cut-face
    // onto their underside would make snow adhere against gravity, so
    // falling crystals are handled separately by drawSnowContact().
    if (!upper) {
     // Include the first 8px of cap snow while keeping the original wood anchor.
     c.drawImage(snowImage,sx,sy,TREE_CELL,splice,
      left,-TREE_CAP_Y*scale,TREE_CELL*scale,splice*scale);
    }
    c.restore();
   }
  }

  if (breakAge !== undefined) {
   // Primary fracture fissure
   c.beginPath();
   c.moveTo(-9, 6);
   c.lineTo(2, 23);
   c.lineTo(-5, 39);
   c.lineTo(11, 57);
   c.lineTo(2, 83);
   c.strokeStyle = '#2b180e';
   c.lineWidth = 3.5;
   c.stroke();

   // Branching structural cracks radiating along wood grain
   c.beginPath();
   c.moveTo(2, 23);
   c.lineTo(-14, 30);
   c.lineTo(-22, 38);
   c.moveTo(-5, 39);
   c.lineTo(12, 44);
   c.lineTo(21, 56);
   c.moveTo(11, 57);
   c.lineTo(-3, 69);
   c.strokeStyle = '#3e2723';
   c.lineWidth = 1.8;
   c.stroke();

   // Inner highlighted split lip for 3D wood relief
   c.beginPath();
   c.moveTo(-8, 8);
   c.lineTo(3, 24);
   c.lineTo(-4, 40);
   c.lineTo(12, 58);
   c.strokeStyle = '#8d6e63';
   c.lineWidth = 1;
   c.stroke();
  }
 } else {
  const elapsed = breakAge - .055;
  c.globalAlpha *= Math.max(0, 1 - elapsed / .26);
  // Shared jagged edges preserve the whole painted cap at the start of
  // the break. Each piece rotates about its own center, with world gravity.
  const edges = [-TREE_CELL * scale / 2, -19, 19, TREE_CELL * scale / 2];
  for (let i = 0; i < 3; i++) {
   const direction = i - 1;
   const l = edges[i], r = edges[i + 1], center = (l + r) / 2;
   const fall = elapsed * 100 + 700 * elapsed * elapsed;
   c.save();
   c.translate(center + direction * elapsed * 115, join / 2 + (upper ? -fall : fall));
   c.rotate(direction * elapsed * 2);
   c.translate(-center, -join / 2);
   c.beginPath();
   c.moveTo(l, 0); c.lineTo(r, 0);
   c.lineTo(r + (i < 2 ? 6 : 0), join * .3);
   c.lineTo(r - (i < 2 ? 4 : 0), join * .65); c.lineTo(r, join);
   c.lineTo(l, join); c.lineTo(l - (i > 0 ? 4 : 0), join * .65);
   c.lineTo(l + (i > 0 ? 6 : 0), join * .3); c.closePath(); c.clip();
   c.drawImage(image, sx, sy + TREE_CAP_Y, TREE_CELL, splice - TREE_CAP_Y,
    left, 0, TREE_CELL * scale, join);
   c.restore();
  }

  // Estilhacos de madeira e farpas voadoras (wood splinters & flying debris)
  const isRot = kind === 'rot';
  const colors = isRot
   ? ['#2a180e', '#452b1a', '#6d4c33', '#3d522f', '#1f130b']
   : ['#3e2723', '#5d4037', '#8d6e63', '#a1887f', '#d7ccc8'];

  // Soft wood dust / decay smoke puff at impact epicenter
  if (elapsed < 0.16) {
   const dustAlpha = (1 - elapsed / 0.16) * 0.30;
   c.save();
   c.globalAlpha *= dustAlpha;
   c.fillStyle = isRot ? '#4a3b30' : '#8d7b68';
   for (let d = 0; d < 3; d++) {
    const dr = 6 + d * 5 + elapsed * 50;
    const dx = (-8 + d * 8) * (1 + elapsed * 1.5);
    const dy = (upper ? -1 : 1) * (28 + d * 9 + elapsed * 18);
    c.beginPath();
    c.arc(dx, dy, dr, 0, Math.PI * 2);
    c.fill();
   }
   c.restore();
  }

  // Shower of dynamic sharp wooden splinters, slivers and chips
  for (let i = 0; i < 15; i++) {
   const dir = (i % 2 === 0 ? 1 : -1);
   const speedX = 42 + (i * 23) % 78;
   const speedY = -28 + (i * 31) % 82;
   const gravity = 720;
   const sx = dir * speedX * elapsed;
   const sy = (upper ? -1 : 1) * (speedY * elapsed + gravity * elapsed * elapsed);
   const spin = dir * (4.5 + (i % 4) * 2.8) * elapsed;
   const len = 7 + (i % 5) * 3.2;
   const thick = 2.2 + (i % 3) * 1.2;
   const ox = -14 + (i * 13) % 28;
   const oy = 18 + (i * 17) % 52;

   c.save();
   c.translate(ox + sx, oy + sy);
   c.rotate(spin);
   c.fillStyle = colors[i % colors.length];
   c.beginPath();
   c.moveTo(-thick / 2, 0);
   c.lineTo(0, -len / 2);
   c.lineTo(thick / 2, 0);
   c.lineTo(0, len / 2);
   c.closePath();
   c.fill();
   c.restore();
  }
 }
 c.restore();
}

export function drawRefugeTree(c, r, support, time = 0, width = 215, footX = 7, snow = 0, rain = 0) {
 const f = FOREST_ART.lower[3], s = width / (f.core[1] - f.core[0]);
 const perch = f.perch;
 const rootX = r.x + footX - (perch[0] - f.anchor[0]) * s;
 const top = support - 4 - (perch[1] - f.anchor[1]) * s;
 drawLivingTrunk(c, {x: rootX, y: top, width, length: 900, variant: 3, time, snow, rain});
}

const snowMixBuffers=new Map();
export function prepareTreeWeather(){for(const kind of ['lower','upper'])snowOverlay(kind,0);}
function snowOverlay(kind,amount){
 amount=Math.round(amount*256)/256;
 const level=Math.min(4,Math.max(0,amount*4)),base=Math.floor(level),fraction=level-base;
 const a=base?images.get(`trees-${kind}-overlay-0${base}`):null;
 const b=images.get(`trees-${kind}-overlay-0${Math.min(4,base+1)}`);
 if(!b)return a;
 let buffer=snowMixBuffers.get(kind);
 if(!buffer){
  const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(1024,1024):typeof document!=='undefined'?document.createElement('canvas'):null;
  if(!canvas)return b;
  canvas.width=1024;canvas.height=1024;buffer={canvas,c:canvas.getContext('2d'),amount:-1};snowMixBuffers.set(kind,buffer);
 }
 // The environmental cover advances once per simulation tick; all trunks reuse it.
 if(buffer.amount!==amount){
  const c=buffer.c;c.clearRect(0,0,1024,1024);c.globalCompositeOperation='lighter';
  for(const {stage,alpha} of winterOverlayStages(amount)){
   const image=images.get(`trees-${kind}-overlay-0${stage}`);
   if(image){c.globalAlpha=alpha;c.drawImage(image,0,0);}
  }
  c.globalAlpha=1;c.globalCompositeOperation='source-over';buffer.amount=amount;
 }
 return buffer.canvas;
}
