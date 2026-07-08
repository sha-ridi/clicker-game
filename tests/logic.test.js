const test = require('node:test');
const assert = require('node:assert');
const G = require('../game.js');

test('game module loads', () => {
  assert.strictEqual(typeof G, 'object');
});
