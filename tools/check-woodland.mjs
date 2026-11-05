import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../games/woodland-search');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const seasonScript=html.match(/src="(seasons\/[^"?]+)(?:\?[^"\s]*)?"/)[1];
const context={window:{}};vm.createContext(context);
for(const file of [seasonScript,'game-data.js','game-settings.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const season=context.window.WOODLAND_SEARCH_SEASON;
const {characters,scenes}=context.window.WOODLAND_SEARCH_DATA;
const count=context.window.WOODLAND_SEARCH_SETTINGS.roundsPerJourney;
assert.equal(scenes.length,count);assert.equal(characters.length,count);
assert.equal(new Set(scenes.map(s=>s.name)).size,count);
assert.equal(new Set(characters.map(c=>c.name)).size,count);
let assets=0;
function asset(relative){assert.ok(fs.existsSync(path.resolve(root,relative)),`Missing asset: ${relative}`);assets++;}
for(const character of characters)asset('assets/'+character.image);
for(const scene of scenes){
 asset(scene.image);asset('assets/'+scene.secretItem.image);
 assert.ok(season.voice[scene.voiceCue],`Missing narration: ${scene.voiceCue}`);
 for(const group of [scene.spots,scene.seedSpots,scene.secretItem.spots]){
  assert.ok(group.length,'Every target needs hiding places');
  for(const spot of group)assert.ok(spot.x>=0&&spot.x<=100&&spot.y>=0&&spot.y<=100,'Hiding place outside image');
 }
}
for(const cue of ['welcome','beginSearch','hintOne','hintTwo','barnabyFound','heartSeed','allFound','goodbye','friendFound','friendFound2','friendFound3','friendFound4','friendFound5','secretFind1','secretFind2','secretFind3','nextLocation','nextWander1','nextWander2','nextWander3'])assert.ok(season.voice[cue],`Missing shared cue: ${cue}`);
asset(season.hero.image);
for(const index of season.previewScenes)assert.ok(scenes[index]);
for(const device of ['desktop','mobile'])assert.ok(season.music[device].length);
for(const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){
 if(!/^(?:https?:|#)/.test(match[1]))asset(match[1]);
}
console.log(`${season.title}: ${count} scenes, ${count} friends, ${Object.keys(season.voice).length} voice cues; ${assets} local asset references checked.`);
