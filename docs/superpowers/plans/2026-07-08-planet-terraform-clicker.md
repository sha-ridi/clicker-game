# Planet Terraform Clicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the clicker from scratch as a pastel, cartoonish, pseudo-3D terraforming game: tap a dead grey planet to earn energy, spend it on terraform stages that visibly bring a rotating CSS planet to life.

**Architecture:** Vanilla HTML/CSS/JS, no build step. Pure game logic (formulas, costs, progression, save-merge, planet-layer descriptors) lives in `game.js` as a dual-mode module (browser global `GAME` / Node `module.exports`) so it is unit-testable with Node's built-in test runner. `balance.js` holds all tunable numbers (also dual-mode). `index.html` holds markup, styles, and all DOM/event/render code. `render(state)` is the single place state maps to DOM, including the planet's appearance.

**Tech Stack:** HTML, CSS, JavaScript (ES2020). Node 24 built-in test runner (`node --test`) for logic tests — dev-time only, ships nothing. Quicksand via Google Fonts. GitHub Pages hosting.

## Global Constraints

- **No frameworks, no bundler, no transpiler.** Open `index.html` → it runs.
- **No runtime dependencies.** Node is used only to run tests at dev time; the shipped game loads no npm packages. No `package.json` `dependencies`.
- **All asset paths relative** (`./game.js`, `./icon.svg`) — never absolute. GH Pages serves under `/clicker-game/`.
- **Single currency:** energy.
- **Palette "Mint Meadow"** (exact values live in CSS / `balance.js`): land alive `#dcf5d3 → #a9e0af → #79c89f → #4f9d8a`; water `#8fd0ec`; forest `#3f8f6a`; life `#ffd1e3` / `#ffe9a8`; clouds `#ffffff`; dead rock `#c2c0ba → #9a978f → #6f6c66`; barren land `#cabfa9 → #a89a83 → #7c705d`; glow `rgba(170,235,215,·)`; sky `#eaf6ff → #d5e7fb`.
- **Font:** Quicksand, fallback `ui-rounded, system-ui, sans-serif`.
- **UI language:** Russian. Stage names exactly: `Мёртвый камень`, `Океаны`, `Луга`, `Леса`, `Жизнь`, `Атмосфера`.
- **Tap target = the planet sphere**, not the whole screen.
- **Prestige-ready:** a `globalMult` factor threads through `getPerTap`/`getPerSec` (=1 in v1); `resetState()` is the sole state-shaping entry point; a `meta` state slot is reserved and unused.
- **`render()` is the only place that writes game state to the DOM.** Handlers mutate state, then call `render()` + `save()`.
- **Commit after every task.** Git user is Dina; work on `main` (personal repo, user's flow).

## File Structure

- `game.js` (**new**) — pure logic, dual-mode. Owns: `resetState`, `mergeSave`, `getPerTap`, `getPerSec`, `stageContribution`, `tapPowerCost`, `tapMetaCost`, `stageUnlockCost`, `stageLevelCost`, `buyTapPower`, `buyTapMeta`, `buyStageUnlock`, `buyStageLevel`, `clampDt`, `offlineGain`, `fmt`, `fmtCount`, `planetLayers`. No DOM references.
- `balance.js` (**rewrite**) — all tunable numbers, dual-mode export of `BALANCE`.
- `index.html` (**rewrite**) — markup + inline `<style>` + inline bootstrap: DOM refs, `render(state)`, event handlers, tick loop, save/load, modals.
- `service-worker.js` (**rewrite**) — cache-first app shell.
- `manifest.webmanifest` (**rewrite**) — PWA metadata.
- `icon.svg` (**rewrite**) — pastel planet icon.
- `tests/logic.test.js` (**new**) — Node tests over `game.js`.
- `README.md` (**rewrite**), `CLAUDE.md` (**rewrite**, gitignored) — new project context.

Old `index.html`, `balance.js`, `icon.svg`, `service-worker.js`, `manifest.webmanifest` are replaced wholesale.

**Verification note:** Logic tasks use Node TDD (`node --test`). DOM/visual tasks use **manual browser verification** — this is deliberate: headless DOM testing would require dependencies, which the stack forbids. Each such task lists exactly what to serve and observe. To serve locally with SW support use any static server on `localhost` (e.g. the Claude Preview server, or `node` one-liner in the task).

---

### Task 1: Project reset & scaffold

**Files:**
- Delete/empty: `index.html`, `balance.js`, `icon.svg`, `service-worker.js`, `manifest.webmanifest`
- Create: `game.js`, `tests/logic.test.js`
- Create: `package.json` (test script only, **no dependencies**)

**Interfaces:**
- Consumes: nothing.
- Produces: empty `game.js` module skeleton exporting `GAME` / `module.exports`; a `npm test` script that runs `node --test`.

- [ ] **Step 1: Replace `index.html` with a blank shell**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no">
  <title>Terraform</title>
</head>
<body>
  <script src="./balance.js"></script>
  <script src="./game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `balance.js` minimal dual-mode stub**

```js
;(function (global) {
  const BALANCE = {};
  if (typeof module !== 'undefined' && module.exports) module.exports = BALANCE;
  else global.BALANCE = BALANCE;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 3: Create `game.js` dual-mode skeleton**

```js
;(function (global) {
  const BALANCE = (typeof module !== 'undefined' && module.exports)
    ? require('./balance.js')
    : global.BALANCE;

  const api = {};

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.GAME = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Create `package.json` (no deps, test script only)**

```json
{
  "name": "clicker-game",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 5: Create `tests/logic.test.js` with a smoke test**

```js
const test = require('node:test');
const assert = require('node:assert');
const G = require('../game.js');

test('game module loads', () => {
  assert.strictEqual(typeof G, 'object');
});
```

- [ ] **Step 6: Run the smoke test**

Run: `node --test`
Expected: 1 test passing.

- [ ] **Step 7: Blank the old asset files** (they get real content in later tasks; leave them empty for now so nothing references stale code)

Empty `icon.svg`, `service-worker.js`, `manifest.webmanifest` (0 bytes).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: reset app, scaffold dual-mode game.js + node test harness"
```

---

### Task 2: balance.js — all numbers

**Files:**
- Modify: `balance.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Produces: global `BALANCE` with keys `startingPerTap`, `tap` (`powerDelta`, `powerCostBase`, `powerCostGrowth`, `metaFactor`, `metaCostBase`, `metaCostGrowth`), `stages` (array of 6 `{name, unlockCost, levelCostBase, levelCostGrowth, perSecPerLevel}`), `globalMult`, `maxOfflineHours`, `offlineModalMinSec`, `saveThrottleMs`, `tickMs`, `holdTickMs`, `scientificThreshold`, `saveKey`.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `B.stages` is undefined.

- [ ] **Step 3: Fill in `balance.js`**

```js
;(function (global) {
  const BALANCE = {
    startingPerTap: 1,

    tap: {
      powerDelta: 1,        // flat per-tap added per power level (before meta)
      powerCostBase: 15,
      powerCostGrowth: 1.15,
      metaFactor: 2,        // each meta level doubles the power delta (retroactive)
      metaCostBase: 500,
      metaCostGrowth: 3,
    },

    // index 0 = dead rock (start, not purchasable, no passive)
    stages: [
      { name: 'Мёртвый камень', unlockCost: 0,      levelCostBase: 0,     levelCostGrowth: 1,    perSecPerLevel: 0 },
      { name: 'Океаны',         unlockCost: 50,      levelCostBase: 20,    levelCostGrowth: 1.15, perSecPerLevel: 0.2 },
      { name: 'Луга',           unlockCost: 500,     levelCostBase: 150,   levelCostGrowth: 1.15, perSecPerLevel: 1 },
      { name: 'Леса',           unlockCost: 5000,    levelCostBase: 1200,  levelCostGrowth: 1.15, perSecPerLevel: 5 },
      { name: 'Жизнь',          unlockCost: 50000,   levelCostBase: 10000, levelCostGrowth: 1.15, perSecPerLevel: 25 },
      { name: 'Атмосфера',      unlockCost: 500000,  levelCostBase: 80000, levelCostGrowth: 1.15, perSecPerLevel: 120 },
    ],

    globalMult: 1,           // prestige hook, neutral in v1

    maxOfflineHours: 12,
    offlineModalMinSec: 30,
    saveThrottleMs: 1000,
    tickMs: 100,
    holdTickMs: 200,
    scientificThreshold: 1e6,
    saveKey: 'terraform-save',
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = BALANCE;
  else global.BALANCE = BALANCE;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add balance.js tests/logic.test.js
git commit -m "feat: balance.js with tap params and 6 terraform stages"
```

---

### Task 3: game.js — resetState + mergeSave

**Files:**
- Modify: `game.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: `BALANCE`.
- Produces:
  - `resetState(now = Date.now())` → `{ energy:0, tap:{powerLevel:0, metaLevel:0}, stages:[{unlocked,level}×6] (index 0 unlocked:true level:0, rest unlocked:false level:0], lastTick:now, meta:{rebirths:0} }`
  - `mergeSave(saved, now = Date.now())` → a fresh state with valid saved fields layered over defaults (forward-compatible; stages merged element-wise).

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `G.resetState is not a function`.

- [ ] **Step 3: Implement in `game.js`** (add inside the IIFE, before `const api`)

```js
  function resetState(now = Date.now()) {
    return {
      energy: 0,
      tap: { powerLevel: 0, metaLevel: 0 },
      stages: BALANCE.stages.map((_, i) => ({ unlocked: i === 0, level: 0 })),
      lastTick: now,
      meta: { rebirths: 0 },   // reserved for iteration 2 (prestige); unused in v1
    };
  }

  function mergeSave(saved, now = Date.now()) {
    const state = resetState(now);
    if (!saved || typeof saved !== 'object') return state;
    if (typeof saved.energy === 'number') state.energy = saved.energy;
    if (saved.tap && typeof saved.tap === 'object') {
      if (typeof saved.tap.powerLevel === 'number') state.tap.powerLevel = saved.tap.powerLevel;
      if (typeof saved.tap.metaLevel === 'number') state.tap.metaLevel = saved.tap.metaLevel;
    }
    if (Array.isArray(saved.stages)) {
      saved.stages.forEach((st, i) => {
        if (i < state.stages.length && st && typeof st === 'object') {
          if (typeof st.unlocked === 'boolean') state.stages[i].unlocked = st.unlocked;
          if (typeof st.level === 'number') state.stages[i].level = st.level;
        }
      });
    }
    if (typeof saved.lastTick === 'number') state.lastTick = saved.lastTick;
    if (saved.meta && typeof saved.meta.rebirths === 'number') state.meta.rebirths = saved.meta.rebirths;
    return state;
  }
```

Then extend the `api` object:

```js
  const api = { resetState, mergeSave };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game.js tests/logic.test.js
git commit -m "feat: resetState + forward-compatible mergeSave"
```

---

### Task 4: game.js — derived getters

**Files:**
- Modify: `game.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: `BALANCE`, `resetState`.
- Produces:
  - `stageContribution(i, level)` → `level * BALANCE.stages[i].perSecPerLevel`
  - `getPerTap(state, mult = BALANCE.globalMult)` → `(startingPerTap + powerDelta*metaFactor^metaLevel * powerLevel) * mult`
  - `getPerSec(state, mult = BALANCE.globalMult)` → sum of `stageContribution` over unlocked stages, `* mult`

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `G.getPerTap is not a function`.

- [ ] **Step 3: Implement in `game.js`**

```js
  function stageContribution(i, level) {
    return level * BALANCE.stages[i].perSecPerLevel;
  }

  function getPerTap(state, mult = BALANCE.globalMult) {
    const { powerLevel, metaLevel } = state.tap;
    const delta = BALANCE.tap.powerDelta * Math.pow(BALANCE.tap.metaFactor, metaLevel);
    return (BALANCE.startingPerTap + delta * powerLevel) * mult;
  }

  function getPerSec(state, mult = BALANCE.globalMult) {
    let sum = 0;
    for (let i = 0; i < state.stages.length; i++) {
      if (state.stages[i].unlocked) sum += stageContribution(i, state.stages[i].level);
    }
    return sum * mult;
  }
```

Extend `api`:

```js
  const api = { resetState, mergeSave, stageContribution, getPerTap, getPerSec };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game.js tests/logic.test.js
git commit -m "feat: getPerTap/getPerSec derived getters with prestige mult hook"
```

---

### Task 5: game.js — costs + purchase reducers

**Files:**
- Modify: `game.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: `BALANCE`.
- Produces (all cost fns return integer energy; all buy fns mutate `state` and return `true` on success, `false` if unaffordable / illegal):
  - `tapPowerCost(level)`, `tapMetaCost(level)`, `stageUnlockCost(i)`, `stageLevelCost(i, level)`
  - `buyTapPower(state)`, `buyTapMeta(state)`, `buyStageUnlock(state, i)`, `buyStageLevel(state, i)`
- Gating rules: stage `i` can be unlocked only if `stages[i-1].unlocked`; unlocking sets `level = 1`; stage 0 is never purchasable/levelable.

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `G.tapPowerCost is not a function`.

- [ ] **Step 3: Implement in `game.js`**

```js
  function tapPowerCost(level) {
    return Math.floor(BALANCE.tap.powerCostBase * Math.pow(BALANCE.tap.powerCostGrowth, level));
  }
  function tapMetaCost(level) {
    return Math.floor(BALANCE.tap.metaCostBase * Math.pow(BALANCE.tap.metaCostGrowth, level));
  }
  function stageUnlockCost(i) {
    return BALANCE.stages[i].unlockCost;
  }
  function stageLevelCost(i, level) {
    const st = BALANCE.stages[i];
    return Math.floor(st.levelCostBase * Math.pow(st.levelCostGrowth, level));
  }

  function buyTapPower(state) {
    const cost = tapPowerCost(state.tap.powerLevel);
    if (state.energy < cost) return false;
    state.energy -= cost;
    state.tap.powerLevel++;
    return true;
  }
  function buyTapMeta(state) {
    const cost = tapMetaCost(state.tap.metaLevel);
    if (state.energy < cost) return false;
    state.energy -= cost;
    state.tap.metaLevel++;
    return true;
  }
  function buyStageUnlock(state, i) {
    if (i <= 0 || i >= state.stages.length) return false;
    if (state.stages[i].unlocked) return false;
    if (!state.stages[i - 1].unlocked) return false;    // gating
    const cost = stageUnlockCost(i);
    if (state.energy < cost) return false;
    state.energy -= cost;
    state.stages[i].unlocked = true;
    state.stages[i].level = 1;
    return true;
  }
  function buyStageLevel(state, i) {
    if (i <= 0 || i >= state.stages.length) return false;
    if (!state.stages[i].unlocked) return false;
    const cost = stageLevelCost(i, state.stages[i].level);
    if (state.energy < cost) return false;
    state.energy -= cost;
    state.stages[i].level++;
    return true;
  }
```

Extend `api`:

```js
  const api = {
    resetState, mergeSave, stageContribution, getPerTap, getPerSec,
    tapPowerCost, tapMetaCost, stageUnlockCost, stageLevelCost,
    buyTapPower, buyTapMeta, buyStageUnlock, buyStageLevel,
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game.js tests/logic.test.js
git commit -m "feat: cost curves and gated purchase reducers"
```

---

### Task 6: game.js — clampDt, offlineGain, formatters

**Files:**
- Modify: `game.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: `BALANCE`, `getPerSec`.
- Produces:
  - `clampDt(dtSec)` → `0` if negative, else `min(dtSec, maxOfflineHours*3600)`
  - `offlineGain(state, now)` → `{ dtSec, gain }` using clamped dt and `getPerSec(state)`
  - `fmt(n)` → compact string; integers without decimals, ≤2 fraction digits, scientific (trailing zeros stripped) at/above `scientificThreshold`
  - `fmtCount(n)` → always 2 fraction digits below threshold; scientific with 2 digits above

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `G.clampDt is not a function`.

- [ ] **Step 3: Implement in `game.js`**

```js
  function clampDt(dtSec) {
    if (dtSec < 0) return 0;
    return Math.min(dtSec, BALANCE.maxOfflineHours * 3600);
  }

  function offlineGain(state, now) {
    const dtSec = clampDt((now - state.lastTick) / 1000);
    return { dtSec, gain: getPerSec(state) * dtSec };
  }

  function fmt(n) {
    if (Math.abs(n) >= BALANCE.scientificThreshold) {
      return n.toExponential(2).replace(/\.?0+e/, 'e').replace('e+', 'e');
    }
    const r = Math.round(n * 100) / 100;
    return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, '');
  }

  function fmtCount(n) {
    if (Math.abs(n) >= BALANCE.scientificThreshold) {
      return n.toExponential(2).replace('e+', 'e');
    }
    return n.toFixed(2);
  }
```

Extend `api` with `clampDt, offlineGain, fmt, fmtCount`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game.js tests/logic.test.js
git commit -m "feat: clampDt, offlineGain, and number formatters"
```

---

### Task 7: game.js — planetLayers (pure visual descriptor)

**Files:**
- Modify: `game.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: `state`.
- Produces: `planetLayers(state)` → `{ highest, land, surfBg, cloudsBg, glow }` where:
  - `highest` = index of highest unlocked stage
  - `land` = a CSS `radial-gradient(...)` string: dead grey (no water), barren tan (water unlocked, meadows not), mint green (meadows unlocked)
  - `surfBg` = comma-joined CSS `background-image` layers for water blobs (stage 1 level, cap 6), forest specks (stage 3 level, cap 12), life specks (stage 4 level, cap 10) — placed at fixed pseudo-random positions
  - `cloudsBg` = cloud layer `background-image` string when stage 5 unlocked, else `'none'`
  - `glow` = CSS box-shadow glow string; intensity grows with stage 5 level
- Counts are **capped** so large levels don't explode the DOM/CSS; the cap is a visual ceiling only (passive income keeps scaling).

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `G.planetLayers is not a function`.

- [ ] **Step 3: Implement in `game.js`**

```js
  // fixed scatter positions (deterministic — no Math.random, so render is stable)
  const WATER_POS  = [[16,52],[40,62],[30,34],[54,58],[22,72],[46,44]];
  const FOREST_POS = [[34,40],[44,55],[26,66],[50,44],[38,58],[30,48],[48,64],[22,54],[42,36],[56,52],[28,40],[52,68]];
  const LIFE_POS   = [[35,42],[46,50],[27,60],[51,46],[39,64],[31,50],[49,58],[23,48],[43,38],[55,56]];

  function scatter(positions, count, size, color) {
    const layers = [];
    const n = Math.min(count, positions.length);
    for (let k = 0; k < n; k++) {
      const [x, y] = positions[k];
      layers.push(`radial-gradient(circle ${size}px at ${x}% ${y}%, ${color} 0 60%, transparent 62%)`);
    }
    return layers;
  }

  function planetLayers(state) {
    const st = state.stages;
    let highest = 0;
    for (let i = 0; i < st.length; i++) if (st[i].unlocked) highest = i;

    const meadows = st[2].unlocked;
    const water = st[1].unlocked;
    const land = meadows
      ? 'radial-gradient(circle at 33% 27%, #dcf5d3, #a9e0af 46%, #79c89f 74%, #4f9d8a 100%)'
      : water
        ? 'radial-gradient(circle at 34% 28%, #cabfa9, #a89a83 55%, #7c705d 100%)'
        : 'radial-gradient(circle at 34% 28%, #c2c0ba, #9a978f 55%, #6f6c66 100%)';

    let surf = [];
    if (st[1].unlocked) {
      // water blobs are larger; approximate ellipse via big circle
      surf = surf.concat(scatter(WATER_POS, st[1].level, 15, '#8fd0ec'));
    }
    if (st[3].unlocked) surf = surf.concat(scatter(FOREST_POS, st[3].level, 5, '#3f8f6a'));
    if (st[4].unlocked) {
      const half = Math.ceil(st[4].level / 2);
      surf = surf.concat(scatter(LIFE_POS, half, 3, '#ffd1e3'));
      surf = surf.concat(scatter(LIFE_POS.slice().reverse(), st[4].level - half, 2, '#ffe9a8'));
    }
    const surfBg = surf.length ? surf.join(',') : 'none';

    const cloudsBg = st[5].unlocked
      ? 'radial-gradient(ellipse 30px 12px at 20% 32%, #fff 0 55%, transparent 60%),radial-gradient(ellipse 24px 10px at 46% 64%, #fff 0 55%, transparent 60%),radial-gradient(ellipse 18px 8px at 66% 46%, #fbffff 0 55%, transparent 60%)'
      : 'none';

    const glowLevel = st[5].unlocked ? st[5].level : (meadows ? 1 : 0);
    const glowAlpha = Math.min(0.35 + glowLevel * 0.05, 0.8);
    const glowSize = Math.min(30 + glowLevel * 3, 60);
    const glow = `0 0 ${glowSize}px rgba(170,235,215,${glowAlpha.toFixed(2)})`;

    return { highest, land, surfBg, cloudsBg, glow };
  }
```

Extend `api` with `planetLayers`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game.js tests/logic.test.js
git commit -m "feat: planetLayers pure descriptor for state-driven planet render"
```

---

### Task 8: index.html — static shell (markup + styles)

**Files:**
- Modify: `index.html`
- Verify: browser (manual)

**Interfaces:**
- Consumes: nothing yet (no JS behavior).
- Produces: DOM element IDs later tasks bind to: `#energy`, `#per-tap`, `#per-sec`, `#planet`, `#surf`, `#clouds`, `#tap-power-btn`, `#tap-meta-btn`, `#stages` (container), `#reset-btn`, `#reset-modal`, `#offline-modal`, and their inner text nodes. A rotating mint planet renders in a mid-terraform look via placeholder inline styles.

- [ ] **Step 1: Replace `index.html` with the full shell** (structure + CSS; scripts loaded, no bootstrap logic yet)

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="theme-color" content="#eaf6ff">
  <title>Terraform</title>
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="apple-touch-icon" href="./icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --sky-top:#eaf6ff; --sky-bot:#d5e7fb;
      --ink:#4a4560; --ink-soft:#6b6685; --card:#ffffffcc; --card-line:#00000012;
      --accent:#79c89f; --accent-ink:#2f6f5c;
    }
    *{box-sizing:border-box}
    html,body{margin:0;height:100%}
    body{
      font-family:'Quicksand',ui-rounded,system-ui,sans-serif;
      color:var(--ink);
      background:linear-gradient(165deg,var(--sky-top),var(--sky-bot));
      -webkit-tap-highlight-color:transparent;
      -webkit-touch-callout:none; user-select:none;
      touch-action:manipulation;
      display:flex; flex-direction:column; align-items:center;
      min-height:100%; padding:env(safe-area-inset-top) 16px 24px;
    }
    /* counter */
    .counter{margin-top:18px;text-align:center}
    .counter .val{font-size:clamp(40px,11vw,72px);font-weight:700;line-height:1;letter-spacing:-.02em}
    .counter .unit{font-size:14px;font-weight:600;color:var(--ink-soft);margin-top:4px;text-transform:lowercase}
    .rates{font-size:13px;color:var(--ink-soft);margin-top:6px}
    .rates b{color:var(--accent-ink);font-weight:600}

    /* planet */
    .planet-wrap{margin:20px 0 24px;display:flex;align-items:center;justify-content:center}
    .planet{
      width:min(56vw,220px);height:min(56vw,220px);border-radius:50%;
      position:relative;overflow:hidden;cursor:pointer;
      box-shadow:inset -16px -22px 42px rgba(20,55,60,.42),0 0 40px rgba(170,235,215,.45);
      transition:transform 90ms ease-out;
      background:radial-gradient(circle at 33% 27%,#dcf5d3,#a9e0af 46%,#79c89f 74%,#4f9d8a 100%);
    }
    .planet.tapped{transform:scale(.94)}
    .planet .surf,.planet .clouds{position:absolute;top:0;left:0;height:100%;width:200%;background-repeat:repeat-x}
    .planet .surf{animation:spin 16s linear infinite}
    .planet .clouds{animation:spin 10s linear infinite;opacity:.85}
    .planet .shade{position:absolute;inset:0;border-radius:50%;box-shadow:inset -14px -18px 34px rgba(20,50,55,.42);pointer-events:none}
    @keyframes spin{from{transform:translateX(0)}to{transform:translateX(-50%)}}

    /* floats */
    .float{position:fixed;pointer-events:none;font-weight:700;color:var(--accent-ink);
      font-size:20px;animation:floatUp 900ms ease-out forwards;z-index:5}
    @keyframes floatUp{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-46px)}}

    /* panel */
    .panel{width:100%;max-width:440px;display:flex;flex-direction:column;gap:10px}
    .card{background:var(--card);border:1px solid var(--card-line);border-radius:16px;padding:12px 14px;
      backdrop-filter:blur(6px)}
    .card h3{margin:0 0 8px;font-size:13px;font-weight:700;color:var(--ink-soft);text-transform:lowercase;letter-spacing:.04em}
    .buy{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;
      border:none;border-radius:12px;padding:11px 14px;margin-top:8px;
      font-family:inherit;font-size:15px;font-weight:600;color:var(--ink);
      background:#ffffff;box-shadow:0 1px 0 #00000010;cursor:pointer;transition:transform 80ms,filter 80ms}
    .buy:first-of-type{margin-top:0}
    .buy:active{transform:translateY(1px)}
    .buy:disabled{opacity:.45;cursor:default}
    .buy .cost{font-size:13px;font-weight:600;color:var(--accent-ink)}
    .buy .meta{font-size:12px;color:var(--ink-soft);font-weight:500}
    .stage-row.locked{opacity:.5}
    .stage-row .name{display:flex;align-items:center;gap:8px}
    .stage-row .lv{font-size:12px;color:var(--ink-soft);font-weight:600}

    .reset{margin-top:16px;background:none;border:none;color:var(--ink-soft);font-family:inherit;
      font-size:13px;text-decoration:underline;cursor:pointer}

    /* modals */
    .modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(40,50,70,.5);z-index:20;padding:24px}
    .modal[hidden]{display:none}
    .modal-content{background:#fff;border-radius:20px;padding:22px 20px;max-width:320px;width:100%;text-align:center;
      box-shadow:0 20px 60px rgba(30,40,60,.3)}
    .modal-content h2{margin:0 0 8px;font-size:18px}
    .modal-content p{margin:0 0 16px;color:var(--ink-soft);font-size:14px;line-height:1.4}
    .modal-actions{display:flex;gap:10px}
    .modal-actions button{flex:1;border:none;border-radius:12px;padding:11px;font-family:inherit;
      font-size:15px;font-weight:600;cursor:pointer}
    .btn-primary{background:var(--accent);color:#fff}
    .btn-ghost{background:#eef1f5;color:var(--ink)}
  </style>
</head>
<body>
  <div class="counter">
    <div class="val" id="energy">0.00</div>
    <div class="unit">энергия</div>
    <div class="rates">за тап <b id="per-tap">1</b> · в сек <b id="per-sec">0</b></div>
  </div>

  <div class="planet-wrap">
    <div class="planet" id="planet">
      <div class="surf" id="surf"></div>
      <div class="clouds" id="clouds"></div>
      <div class="shade"></div>
    </div>
  </div>

  <div class="panel">
    <div class="card">
      <h3>тап</h3>
      <button class="buy" id="tap-power-btn">
        <span>сила тапа</span>
        <span class="cost" id="tap-power-cost">15</span>
      </button>
      <button class="buy" id="tap-meta-btn">
        <span>множитель тапа</span>
        <span class="cost" id="tap-meta-cost">500</span>
      </button>
    </div>

    <div class="card">
      <h3>терраформинг</h3>
      <div id="stages"></div>
    </div>

    <button class="reset" id="reset-btn">сбросить прогресс</button>
  </div>

  <!-- reset confirmation -->
  <div class="modal" id="reset-modal" hidden>
    <div class="modal-content">
      <h2>Сбросить прогресс?</h2>
      <p>Планета вернётся к мёртвому камню. Это нельзя отменить.</p>
      <div class="modal-actions">
        <button class="btn-ghost" id="reset-no">нет</button>
        <button class="btn-primary" id="reset-yes">да</button>
      </div>
    </div>
  </div>

  <!-- offline gain -->
  <div class="modal" id="offline-modal" hidden>
    <div class="modal-content">
      <h2>С возвращением!</h2>
      <p id="offline-text">Пока тебя не было, планета накопила энергию.</p>
      <div class="modal-actions">
        <button class="btn-primary" id="offline-ok">забрать</button>
      </div>
    </div>
  </div>

  <script src="./balance.js"></script>
  <script src="./game.js"></script>
  <!-- bootstrap script added in Task 9 -->
</body>
</html>
```

- [ ] **Step 2: Serve and verify visually**

Serve the folder on localhost (any static server), open it. If using the Claude Preview MCP, add a `.claude/launch.json` server that runs `node --eval` static serve, or run a one-off:
`node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((q,s)=>{let u=q.url==='/'?'/index.html':q.url.split('?')[0];f.readFile('.'+u,(e,d)=>{if(e){s.statusCode=404;return s.end()}const t={'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[p.extname(u)]||'text/plain';s.setHeader('content-type',t);s.end(d)})}).listen(8000,()=>console.log('http://localhost:8000'))"`

Observe:
- A rotating mint-green planet with a soft glow and terminator shading.
- Counter reads `0.00`, rates line present.
- Two tap buttons and an (empty) terraform card, reset link.
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: static pastel shell — rotating planet, counter, panel, modals"
```

---

### Task 9: index.html — render(state) wiring + boot

**Files:**
- Modify: `index.html` (add bootstrap `<script>` at end of body)
- Verify: browser (manual)

**Interfaces:**
- Consumes: `GAME` (all pure fns), `BALANCE`.
- Produces: global `state`, `render()` that writes counter, rates, tap buttons, stage rows, and planet layers from `state`. Boot initializes `state = GAME.resetState()` and calls `render()`.

- [ ] **Step 1: Add the bootstrap script** (replace the `<!-- bootstrap script added in Task 9 -->` comment)

```html
  <script>
  (function () {
    const G = window.GAME, B = window.BALANCE;
    const $ = (id) => document.getElementById(id);
    const el = {
      energy: $('energy'), perTap: $('per-tap'), perSec: $('per-sec'),
      planet: $('planet'), surf: $('surf'), clouds: $('clouds'),
      tapPowerBtn: $('tap-power-btn'), tapPowerCost: $('tap-power-cost'),
      tapMetaBtn: $('tap-meta-btn'), tapMetaCost: $('tap-meta-cost'),
      stages: $('stages'),
    };

    let state = G.resetState();

    // build the 5 purchasable stage rows once (indices 1..5)
    const stageEls = [];
    for (let i = 1; i < B.stages.length; i++) {
      const row = document.createElement('button');
      row.className = 'buy stage-row';
      row.dataset.i = i;
      row.innerHTML =
        `<span class="name">${B.stages[i].name} <span class="lv"></span></span>` +
        `<span class="cost"></span>`;
      el.stages.appendChild(row);
      stageEls[i] = { row, lv: row.querySelector('.lv'), cost: row.querySelector('.cost') };
    }

    function renderPlanet() {
      const L = G.planetLayers(state);
      el.planet.style.background = L.land;
      el.planet.style.boxShadow = 'inset -16px -22px 42px rgba(20,55,60,.42),' + L.glow;
      el.surf.style.backgroundImage = L.surfBg;
      el.clouds.style.backgroundImage = L.cloudsBg;
    }

    function render() {
      el.energy.textContent = G.fmtCount(state.energy);
      el.perTap.textContent = G.fmt(G.getPerTap(state));
      el.perSec.textContent = G.fmt(G.getPerSec(state));

      const tpCost = G.tapPowerCost(state.tap.powerLevel);
      el.tapPowerCost.textContent = G.fmt(tpCost);
      el.tapPowerBtn.disabled = state.energy < tpCost;

      const tmCost = G.tapMetaCost(state.tap.metaLevel);
      el.tapMetaCost.textContent = G.fmt(tmCost);
      el.tapMetaBtn.disabled = state.energy < tmCost;

      for (let i = 1; i < B.stages.length; i++) {
        const s = state.stages[i], ui = stageEls[i];
        const prevUnlocked = state.stages[i - 1].unlocked;
        if (!s.unlocked) {
          ui.row.classList.toggle('locked', !prevUnlocked);
          ui.lv.textContent = '';
          const cost = G.stageUnlockCost(i);
          ui.cost.textContent = 'открыть · ' + G.fmt(cost);
          ui.row.disabled = !prevUnlocked || state.energy < cost;
        } else {
          ui.row.classList.remove('locked');
          ui.lv.textContent = 'ур. ' + s.level;
          const cost = G.stageLevelCost(i, s.level);
          ui.cost.textContent = G.fmt(cost);
          ui.row.disabled = state.energy < cost;
        }
      }

      renderPlanet();
    }

    // expose for later tasks (handlers, tick, save)
    window.__game = { get state() { return state; }, set state(v) { state = v; }, render };

    render();
  })();
  </script>
```

- [ ] **Step 2: Serve and verify**

Serve as in Task 8. Observe:
- Counter `0.00`; per-tap `1`; per-sec `0`.
- Tap card: both buttons show costs (`15`, `500`) and are disabled (0 energy).
- Terraform card: 5 rows; `Океаны` shows `открыть · 50`; the rest are dimmed (`locked`).
- Planet renders grey (dead) — because `resetState` has only stage 0. (If it looks mint, that's a bug in `planetLayers` gating.)
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: render(state) — counter, rates, tap/stage rows, planet layers"
```

---

### Task 10: index.html — tap & purchase interaction

**Files:**
- Modify: `index.html` (extend bootstrap script)
- Verify: browser (manual)

**Interfaces:**
- Consumes: `window.__game` (`state`, `render`), `GAME` buy fns, `getPerTap`.
- Produces: `doTap(x,y)`, `spawnFloat(text,x,y)`, planet pointer handler, tap/meta/stage-row click handlers, `save()` stub calling nothing yet (real save in Task 11). To avoid rework, define `save()` here as a no-op placeholder that Task 11 replaces.

- [ ] **Step 1: Add interaction code** (inside the same IIFE, before `render();`)

```js
    function spawnFloat(text, x, y) {
      const f = document.createElement('div');
      f.className = 'float';
      f.textContent = text;
      f.style.left = x + 'px';
      f.style.top = y + 'px';
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 900);
    }

    let save = function () {};  // replaced in Task 11

    function doTap(x, y) {
      const gain = G.getPerTap(state);
      state.energy += gain;
      spawnFloat('+' + G.fmt(gain), x, y);
      el.planet.classList.add('tapped');
      setTimeout(() => el.planet.classList.remove('tapped'), 90);
      render();
      save();
    }

    el.planet.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      doTap(e.clientX, e.clientY);
    });

    el.tapPowerBtn.addEventListener('click', () => { if (G.buyTapPower(state)) { render(); save(); } });
    el.tapMetaBtn.addEventListener('click', () => { if (G.buyTapMeta(state)) { render(); save(); } });

    el.stages.addEventListener('click', (e) => {
      const row = e.target.closest('.stage-row');
      if (!row) return;
      const i = Number(row.dataset.i);
      const ok = state.stages[i].unlocked ? G.buyStageLevel(state, i) : G.buyStageUnlock(state, i);
      if (ok) { render(); save(); }
    });
```

Also update the exposed object to share `save`:

```js
    window.__game = {
      get state() { return state; }, set state(v) { state = v; },
      render, setSave(fn) { save = fn; },
    };
```

- [ ] **Step 2: Serve and verify (the fun part)**

Serve, open, and:
- Tap the planet repeatedly → counter rises, `+N` floats appear at the tap point, planet squashes briefly.
- Buy `сила тапа` when affordable → per-tap increases, cost rises.
- Buy `Океаны` (open at 50) → row switches to `ур. 1`, per-sec becomes `0.2`, **planet gains blue water patches**.
- Keep leveling / unlocking `Луга` → **land turns mint green**; `Атмосфера` → **clouds + brighter glow**.
- Locked stages stay dimmed until the previous one is unlocked.
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: tapping, floating +N, squash, and purchase handlers"
```

---

### Task 11: index.html — tick loop, save/load, offline & reset modals

**Files:**
- Modify: `index.html` (extend bootstrap script)
- Verify: browser (manual)

**Interfaces:**
- Consumes: `window.__game`, `GAME` (`getPerSec`, `clampDt`, `offlineGain`, `mergeSave`, `resetState`, `fmt`), `BALANCE`.
- Produces: real `save()` / `saveThrottled()`, `load()`, `tick()` on `setInterval(BALANCE.tickMs)`, offline deferred-claim modal, reset confirm modal.

- [ ] **Step 1: Add save/load + tick + modal logic** (inside the IIFE; place the save/load definitions **before** the tap handlers use `save`, or keep `save` as the mutable closure variable and assign here)

```js
    // ---- save / load ----
    let lastSaveTime = 0;
    function realSave() {
      try { localStorage.setItem(B.saveKey, JSON.stringify(state)); } catch (e) {}
      lastSaveTime = Date.now();
    }
    function saveThrottled() {
      if (Date.now() - lastSaveTime >= B.saveThrottleMs) realSave();
    }
    save = realSave;                 // replace the placeholder from Task 10

    // ---- offline claim (deferred) ----
    let pendingOfflineGain = 0;
    const offlineModal = document.getElementById('offline-modal');
    const offlineText = document.getElementById('offline-text');
    function claimOffline() {
      const g = pendingOfflineGain;
      pendingOfflineGain = 0;        // zero BEFORE mutating (double-credit guard)
      if (g > 0) {
        state.energy += g;
        const r = el.planet.getBoundingClientRect();
        spawnFloat('+' + G.fmt(g), r.left + r.width / 2, r.top + r.height / 2);
      }
      offlineModal.hidden = true;
      render(); realSave();
    }
    document.getElementById('offline-ok').addEventListener('click', claimOffline);
    offlineModal.addEventListener('pointerdown', (e) => {
      if (e.target === offlineModal) claimOffline();
    });

    function load() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(B.saveKey)); } catch (e) {}
      const now = Date.now();
      state = G.mergeSave(saved, now);
      window.__game.state = state;

      if (saved) {
        const { dtSec, gain } = G.offlineGain(state, now);
        if (dtSec > B.offlineModalMinSec && gain > 0) {
          pendingOfflineGain = gain;
          const mins = Math.floor(dtSec / 60);
          offlineText.textContent =
            `Пока тебя не было (${mins} мин), планета накопила +${G.fmt(gain)} энергии.`;
          offlineModal.hidden = false;
        } else if (gain > 0) {
          state.energy += gain;      // tiny gap → silent
        }
      }
      state.lastTick = now;
    }

    // ---- tick ----
    function tick() {
      const now = Date.now();
      const dt = G.clampDt((now - state.lastTick) / 1000);
      state.lastTick = now;
      if (dt > 0) state.energy += G.getPerSec(state) * dt;
      render();
      saveThrottled();
    }

    // ---- reset ----
    const resetModal = document.getElementById('reset-modal');
    document.getElementById('reset-btn').addEventListener('click', () => { resetModal.hidden = false; });
    document.getElementById('reset-no').addEventListener('click', () => { resetModal.hidden = true; });
    document.getElementById('reset-yes').addEventListener('click', () => {
      state = G.resetState();
      window.__game.state = state;
      resetModal.hidden = true;
      render(); realSave();
    });
    resetModal.addEventListener('pointerdown', (e) => { if (e.target === resetModal) resetModal.hidden = true; });

    load();                          // load replaces resetState boot
    setInterval(tick, B.tickMs);
```

**Note:** `load()` runs after the initial `render()` at the end of Task 9's block; keep the final `render()` — `load()` calls it again after setting state. Ensure `load()` and `setInterval` are the last statements in the IIFE.

- [ ] **Step 2: Serve and verify**

- Unlock `Океаны`, watch per-sec accrue into the counter every tick (~10/sec visually smooth).
- Reload the page → progress persists (localStorage).
- Simulate offline: in devtools console set `localStorage['terraform-save']` `lastTick` back by ~10 min (or edit and reload); on load the offline modal shows the gain; clicking `забрать` credits it with a float from the planet center. Dismissing via overlay also credits (once — no double credit).
- `сбросить прогресс` → confirm modal; `да` returns planet to dead grey and zeroes everything; `нет`/overlay cancels.
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: tick loop, throttled save/load, offline deferred-claim + reset modals"
```

---

### Task 12: index.html — hold-to-autotap (multitouch)

**Files:**
- Modify: `index.html` (extend bootstrap script)
- Verify: browser (manual)

**Interfaces:**
- Consumes: `doTap`, `BALANCE.holdTickMs`.
- Produces: per-`pointerId` autotap timers held in a `Map`, started on `pointerdown` over the planet, cleared on `pointerup`/`pointercancel`/`pointerleave`.

- [ ] **Step 1: Replace the planet `pointerdown` handler with hold-aware logic**

```js
    const holdTimers = new Map();
    function startHold(e) {
      e.preventDefault();
      doTap(e.clientX, e.clientY);   // immediate tap
      const id = e.pointerId;
      const timer = setInterval(() => {
        const r = el.planet.getBoundingClientRect();
        doTap(r.left + r.width / 2, r.top + r.height / 2);
      }, B.holdTickMs);
      holdTimers.set(id, timer);
    }
    function endHold(e) {
      const t = holdTimers.get(e.pointerId);
      if (t) { clearInterval(t); holdTimers.delete(e.pointerId); }
    }
    // remove the simple pointerdown listener from Task 10 and use these:
    el.planet.addEventListener('pointerdown', startHold);
    el.planet.addEventListener('pointerup', endHold);
    el.planet.addEventListener('pointercancel', endHold);
    el.planet.addEventListener('pointerleave', endHold);
```

(Delete the earlier `el.planet.addEventListener('pointerdown', ...)` block from Task 10.)

- [ ] **Step 2: Serve and verify**

- Press and hold on the planet → energy keeps rising at ~1 tap / `holdTickMs`.
- Release → stops.
- On a touch device (or devtools touch emulation with multiple points), two fingers held each contribute.
- Single quick tap still works (immediate `doTap`).
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: hold-to-autotap with per-pointer multitouch timers"
```

---

### Task 13: PWA — manifest, service worker, icon

**Files:**
- Modify: `manifest.webmanifest`, `service-worker.js`, `icon.svg`, `index.html` (register SW)
- Verify: browser (manual)

**Interfaces:**
- Consumes: nothing.
- Produces: installable PWA; SW cache-first over app shell (`./`, `index.html`, `balance.js`, `game.js`, `manifest.webmanifest`, `icon.svg`); `CACHE_NAME = 'terraform-v1'`.

- [ ] **Step 1: Write `manifest.webmanifest`**

```json
{
  "name": "Terraform",
  "short_name": "Terraform",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#eaf6ff",
  "theme_color": "#eaf6ff",
  "icons": [
    { "src": "./icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

- [ ] **Step 2: Write `icon.svg`** (pastel mint planet)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="#eaf6ff"/>
  <circle cx="90" cy="90" r="58" fill="#a9e0af"/>
  <circle cx="90" cy="90" r="58" fill="url(#g)"/>
  <ellipse cx="70" cy="104" rx="22" ry="12" fill="#8fd0ec"/>
  <ellipse cx="112" cy="74" rx="14" ry="8" fill="#8fd0ec"/>
  <circle cx="76" cy="72" r="4" fill="#3f8f6a"/>
  <circle cx="100" cy="98" r="4" fill="#3f8f6a"/>
  <defs>
    <radialGradient id="g" cx="36%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#dcf5d3"/>
      <stop offset="70%" stop-color="#79c89f" stop-opacity="0"/>
      <stop offset="100%" stop-color="#4f9d8a" stop-opacity=".6"/>
    </radialGradient>
  </defs>
</svg>
```

- [ ] **Step 3: Write `service-worker.js`**

```js
const CACHE_NAME = 'terraform-v1';
const SHELL = ['./', './index.html', './balance.js', './game.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;          // let cross-origin (fonts) hit network
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
```

- [ ] **Step 4: Register the SW in `index.html`** (add just before the closing `</script>` of the bootstrap IIFE, or a small separate script after it)

```html
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
    }
  </script>
```

- [ ] **Step 5: Serve over localhost and verify**

- DevTools → Application → Service Workers: `terraform-v1` activated.
- Application → Manifest: name `Terraform`, icon renders, installable.
- Go offline (DevTools Network → Offline), reload → game still loads and runs.
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add manifest.webmanifest service-worker.js icon.svg index.html
git commit -m "feat: PWA — manifest, cache-first service worker, pastel planet icon"
```

---

### Task 14: Project docs — README + CLAUDE.md rewrite

**Files:**
- Modify: `README.md`, `CLAUDE.md` (gitignored)

**Interfaces:**
- Consumes: nothing.
- Produces: `README.md` describing the new game; `CLAUDE.md` rewritten as the new project context (concept, pastel design system, `game.js`/`balance.js`/`index.html` architecture, testing via `node --test`, SW versioning workflow, prestige-ready notes, iteration-2 roadmap).

- [ ] **Step 1: Rewrite `README.md`**

```markdown
# Terraform — clicker

Пастельный мультяшный кликер: тапай мёртвую планету, копи энергию, терраформируй её от голого камня до цветущего мира.

Играть: https://sha-ridi.github.io/clicker-game/

- Vanilla HTML/CSS/JS, без билда и зависимостей.
- Логика — `game.js` (тестируется через `node --test`), числа — `balance.js`, DOM — `index.html`.
- PWA: ставится на домашний экран, работает офлайн.
```

- [ ] **Step 2: Rewrite `CLAUDE.md`** to describe the new project

Write a fresh `CLAUDE.md` covering: concept (terraforming clicker); stack (vanilla, no-build, GH Pages, relative paths); new file structure (`index.html` DOM-only, `game.js` pure dual-mode logic + `node --test`, `balance.js` numbers, PWA files); the **new pastel/cartoon design system** (Mint Meadow palette, Quicksand, rounded soft shapes, rotating CSS sphere, squash/bounce feedback — explicitly replacing the retired terminal system); architecture principles (single `state`, `resetState()` sole entry, derived-via-functions, `render()` sole DOM writer including the planet, tick via `dt`, `clampDt`, throttled save, deferred-claim offline, pointer events + multitouch Map); SW `CACHE_NAME` bump workflow; prestige-ready hooks (`globalMult`, reserved `meta`); and the **iteration-2 roadmap** (prestige/rebirth, 1-of-3 meta-upgrades, planet variants, second currency, sound/haptics).

- [ ] **Step 3: Commit** (README only; `CLAUDE.md` is gitignored)

```bash
git add README.md
git commit -m "docs: rewrite README for terraform clicker"
```

---

## Self-Review

**Spec coverage:**
- §1 concept → Tasks 8–12 (playable loop). ✓
- §3 aesthetic (rotating sphere, Mint Meadow, Quicksand, squash) → Tasks 7 (planetLayers), 8 (CSS/font), 10 (squash). ✓
- §4 core loop (tap on sphere, per-sec tick, two axes) → Tasks 4–5 (logic), 10 (tap), 11 (tick). ✓
- §4.1 tap axis (power + meta) → Tasks 4, 5, 9, 10. ✓
- §4.2 stages (hybrid, gated, level-1-on-unlock) → Tasks 2, 5, 7, 9, 10. ✓
- §5 state model (shape, deep-merge) → Task 3. ✓
- §6 derived getters → Tasks 4, 6. ✓
- §7 planet render from state → Tasks 7, 9. ✓
- §8 save / offline / PWA → Tasks 11, 13. ✓
- §9 file structure → Task 1 + all. ✓
- §10 prestige-ready (globalMult, resetState, meta slot) → Tasks 2, 3, 4. ✓
- §11 out of scope → not built (correct). ✓

**Placeholder scan:** Task 14 Step 2 (`CLAUDE.md`) is described rather than shown verbatim — acceptable because it is prose documentation, not code, and the required contents are enumerated. The `save` no-op in Task 10 is intentional and replaced in Task 11 (called out). No other placeholders.

**Type consistency:** `GAME` api names used in `index.html` (`resetState`, `mergeSave`, `getPerTap`, `getPerSec`, `tapPowerCost`, `tapMetaCost`, `stageUnlockCost`, `stageLevelCost`, `buyTapPower`, `buyTapMeta`, `buyStageUnlock`, `buyStageLevel`, `clampDt`, `offlineGain`, `fmt`, `fmtCount`, `planetLayers`) all match the definitions in Tasks 3–7. `planetLayers` return keys (`land`, `surfBg`, `cloudsBg`, `glow`) match their use in `renderPlanet()`. Stage indices consistently 0-based with index 0 = dead rock across all tasks.
