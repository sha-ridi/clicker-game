const test = require('node:test');
const assert = require('node:assert');
const G = require('../game.js');

test('game module loads', () => {
  assert.strictEqual(typeof G, 'object');
});

test('BALANCE has 6 stages named correctly, stage 0 is free', () => {
  const B = require('../balance.js');
  assert.strictEqual(B.stages.length, 6);
  assert.deepStrictEqual(B.stages.map(s => s.name), [
    'Мёртвый камень', 'Океаны', 'Луга', 'Леса', 'Жизнь', 'Атмосфера',
  ]);
  assert.strictEqual(B.stages[0].unlockCost, 0);
  assert.strictEqual(B.globalMult, 1);
  assert.strictEqual(B.saveKey, 'terraform-save');
});

test('resetState default shape', () => {
  const s = G.resetState(1000);
  assert.strictEqual(s.energy, 0);
  assert.deepStrictEqual(s.tap, { powerLevel: 0, metaLevel: 0 });
  assert.strictEqual(s.stages.length, 6);
  assert.strictEqual(s.stages[0].unlocked, true);
  assert.strictEqual(s.stages[1].unlocked, false);
  assert.strictEqual(s.lastTick, 1000);
  assert.strictEqual(s.meta.rebirths, 0);
});

test('mergeSave layers saved fields over defaults', () => {
  const saved = { energy: 42, tap: { powerLevel: 3 }, stages: [{}, { unlocked: true, level: 2 }] };
  const s = G.mergeSave(saved, 5000);
  assert.strictEqual(s.energy, 42);
  assert.strictEqual(s.tap.powerLevel, 3);
  assert.strictEqual(s.tap.metaLevel, 0);        // missing → default
  assert.strictEqual(s.stages[1].unlocked, true);
  assert.strictEqual(s.stages[1].level, 2);
  assert.strictEqual(s.stages[2].unlocked, false); // beyond saved array → default
  assert.strictEqual(s.lastTick, 5000);            // missing lastTick → now
});

test('mergeSave tolerates garbage input', () => {
  assert.strictEqual(G.mergeSave(null, 7).energy, 0);
  assert.strictEqual(G.mergeSave('nope', 7).energy, 0);
});

test('getPerTap base and upgrades (retroactive meta)', () => {
  const s = G.resetState(0);
  assert.strictEqual(G.getPerTap(s), 1);          // starting only
  s.tap.powerLevel = 2;                            // +1 each → 1 + 1*2 = 3
  assert.strictEqual(G.getPerTap(s), 3);
  s.tap.metaLevel = 1;                             // delta doubles: 1 + (1*2)*2 = 5
  assert.strictEqual(G.getPerTap(s), 5);
});

test('getPerSec sums unlocked stages only', () => {
  const s = G.resetState(0);
  assert.strictEqual(G.getPerSec(s), 0);          // only dead rock unlocked
  s.stages[1].unlocked = true; s.stages[1].level = 3; // 3 * 0.2 = 0.6
  s.stages[2].unlocked = true; s.stages[2].level = 2; // 2 * 1 = 2
  assert.ok(Math.abs(G.getPerSec(s) - 2.6) < 1e-9);
});

test('globalMult scales both getters', () => {
  const s = G.resetState(0);
  s.tap.powerLevel = 1;
  assert.strictEqual(G.getPerTap(s, 3), 6);       // (1 + 1) * 3
});

test('cost growth is monotonic', () => {
  assert.ok(G.tapPowerCost(1) > G.tapPowerCost(0));
  assert.ok(G.stageLevelCost(1, 2) > G.stageLevelCost(1, 1));
  assert.strictEqual(G.stageUnlockCost(1), 50);
});

test('buyTapPower respects affordability', () => {
  const s = G.resetState(0);
  assert.strictEqual(G.buyTapPower(s), false);   // 0 energy
  s.energy = 1000;
  assert.strictEqual(G.buyTapPower(s), true);
  assert.strictEqual(s.tap.powerLevel, 1);
  assert.strictEqual(s.energy, 1000 - G.tapPowerCost(0));
});

test('stage unlock is gated and grants level 1', () => {
  const s = G.resetState(0);
  s.energy = 1e9;
  assert.strictEqual(G.buyStageUnlock(s, 2), false); // stage 1 not unlocked yet
  assert.strictEqual(G.buyStageUnlock(s, 1), true);
  assert.strictEqual(s.stages[1].unlocked, true);
  assert.strictEqual(s.stages[1].level, 1);           // immediate contribution
  assert.strictEqual(G.buyStageUnlock(s, 1), false);  // already unlocked
  assert.strictEqual(G.buyStageUnlock(s, 2), true);   // now allowed
});

test('stage level requires unlock, stage 0 never buyable', () => {
  const s = G.resetState(0);
  s.energy = 1e9;
  assert.strictEqual(G.buyStageLevel(s, 1), false);   // locked
  assert.strictEqual(G.buyStageLevel(s, 0), false);   // dead rock
  G.buyStageUnlock(s, 1);
  assert.strictEqual(G.buyStageLevel(s, 1), true);
  assert.strictEqual(s.stages[1].level, 2);
});

test('clampDt caps and floors', () => {
  assert.strictEqual(G.clampDt(-5), 0);
  assert.strictEqual(G.clampDt(10), 10);
  assert.strictEqual(G.clampDt(1e9), 12 * 3600);   // maxOfflineHours cap
});

test('offlineGain uses clamped dt and perSec', () => {
  const s = G.resetState(0);
  s.stages[1].unlocked = true; s.stages[1].level = 5; // perSec = 1.0
  const { dtSec, gain } = G.offlineGain(s, 10000);    // 10s
  assert.strictEqual(dtSec, 10);
  assert.ok(Math.abs(gain - 10) < 1e-9);
});

test('fmt formatting', () => {
  assert.strictEqual(G.fmt(5), '5');
  assert.strictEqual(G.fmt(5.5), '5.5');
  assert.strictEqual(G.fmt(5.05), '5.05');
  assert.strictEqual(G.fmt(1e6), '1e6');
  assert.strictEqual(G.fmt(1.23e9), '1.23e9');
});

test('fmtCount always two decimals below threshold', () => {
  assert.strictEqual(G.fmtCount(5.5), '5.50');
  assert.strictEqual(G.fmtCount(1), '1.00');
  assert.strictEqual(G.fmtCount(1e6), '1.00e6');
});

test('planetLayers reflects progression', () => {
  const s = G.resetState(0);
  let L = G.planetLayers(s);
  assert.strictEqual(L.highest, 0);
  assert.match(L.land, /#c2c0ba/);        // dead grey
  assert.strictEqual(L.cloudsBg, 'none');

  s.stages[1].unlocked = true; s.stages[1].level = 2;   // oceans
  L = G.planetLayers(s);
  assert.strictEqual(L.highest, 1);
  assert.match(L.land, /#cabfa9/);        // barren tan
  assert.match(L.surfBg, /#8fd0ec/);      // water present

  s.stages[2].unlocked = true; s.stages[2].level = 1;   // meadows
  L = G.planetLayers(s);
  assert.match(L.land, /#a9e0af/);        // mint green

  s.stages[5].unlocked = true; s.stages[5].level = 1;   // atmosphere
  L = G.planetLayers(s);
  assert.strictEqual(L.highest, 5);
  assert.notStrictEqual(L.cloudsBg, 'none');
});

test('planetLayers caps feature counts', () => {
  const s = G.resetState(0);
  s.stages[1].unlocked = true; s.stages[1].level = 9999;
  const L = G.planetLayers(s);
  // water layers are comma-separated; count commas+1, capped at 6
  const count = L.surfBg.split('),').length;
  assert.ok(count <= 6);
});
