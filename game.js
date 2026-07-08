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

  const api = { resetState, mergeSave, stageContribution, getPerTap, getPerSec };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.GAME = api;
})(typeof window !== 'undefined' ? window : globalThis);
