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
