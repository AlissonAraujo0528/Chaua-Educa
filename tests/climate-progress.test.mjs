import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP,VICTORY_SCORE} from '../Chaua-Educa-main/js/engine.mjs';
import {JOURNEY_LENGTH} from '../Chaua-Educa-main/js/journey.mjs';
import {CLIMATE_FLIGHT_REFERENCE,climateJourneyProgress,climateReferenceSeconds}
 from '../Chaua-Educa-main/js/climate-progress.mjs';

test('climate progress follows active flight seconds, not 1,000-point victory or distance cap',()=>{
 for(const mode of ['aventura','tranquilo']){
  const seed=104,duration=climateReferenceSeconds(mode,seed);
  assert.ok(duration>500 && duration<850,'reference is not based on completed seeded flights');
  assert.equal(climateJourneyProgress({elapsed:0,mode,seed}),0);
  assert.equal(climateJourneyProgress({elapsed:duration,mode,seed}),1);
  assert.equal(climateJourneyProgress({elapsed:duration*4,mode,seed}),1);
  const halfway=climateJourneyProgress({elapsed:duration*.5,mode,seed});
  assert.ok(Math.abs(halfway-.5)<1e-10);
  for(const score of [0,200,560,999,1000,1500]){
   assert.equal(climateJourneyProgress({elapsed:duration*.5,mode,seed,score,distance:JOURNEY_LENGTH}),halfway);
  }
 }
 assert.equal(VICTORY_SCORE,1000,'calibration must not change victory condition');
 assert.equal(JOURNEY_LENGTH,28000,'calibration must not change world geometry');
});

test('climate tempo varies slightly between seeds without jumping backwards during one run',()=>{
 for(const mode of ['aventura','tranquilo']){
  const xs=[104,217,451,999].map(seed=>climateReferenceSeconds(mode,seed));
  const spread=Math.max(...xs)-Math.min(...xs);
  assert.ok(spread>0 && spread<CLIMATE_FLIGHT_REFERENCE[mode]*.09);
  for(const seed of [0,104,217,451]){
   let prev=0;
   for(let t=0;t<=1100;t+=5){
    const p=climateJourneyProgress({elapsed:t,mode,seed});
    assert.ok(p>=prev && p<=1);
    prev=p;
   }
  }
 }
});

test('pauses, quizzes and frozen world distance cannot inadvertently advance the climate',()=>{
 const game=new Game({seed:104});
 game.state='playing';game.distance=JOURNEY_LENGTH;game.elapsed=360;
 const start=climateJourneyProgress(game);
 game.pause();
 for(let i=0;i<100;i++)game.tick(STEP);
 assert.equal(game.elapsed,360);
 assert.equal(climateJourneyProgress(game),start);
 game.state='quiz';
 for(let i=0;i<100;i++)game.tick(STEP);
 assert.equal(climateJourneyProgress(game),start);
 // In normal flying time continues, including after the distance cap.
 game.state='playing';game.nextSpawn=Infinity;
 game.entities=[];game.y=320;
 game.tick(STEP);
 assert.ok(game.elapsed>360);
 assert.ok(climateJourneyProgress(game)>start);
 assert.equal(game.distance,JOURNEY_LENGTH);
});
