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
