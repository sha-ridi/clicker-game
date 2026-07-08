;(function (global) {
  const BALANCE = (typeof module !== 'undefined' && module.exports)
    ? require('./balance.js')
    : global.BALANCE;

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

  const api = {
    resetState, mergeSave, stageContribution, getPerTap, getPerSec,
    tapPowerCost, tapMetaCost, stageUnlockCost, stageLevelCost,
    buyTapPower, buyTapMeta, buyStageUnlock, buyStageLevel,
    clampDt, offlineGain, fmt, fmtCount, planetLayers,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.GAME = api;
})(typeof window !== 'undefined' ? window : globalThis);
