// Game balance — edit values and reload the page to tune.
// All numbers and formulas live here. No other file should hardcode game values.

const BALANCE = {
  // Per-tap value with 0 upgrades. Set higher to skip early grind.
  startingPerTap: 1,

  // Per-second passive income with 0 idle upgrades. Usually 0 — buy IB to gain.
  startingPerSec: 0,

  // "+N per tap" upgrade: each purchase adds `delta` to per-tap value.
  //   cost(level) = ceil(base * mult ^ level)
  //   level 0 -> 1: base
  //   level 1 -> 2: base * mult
  //   etc.
  // mult tuning: 1.15 ~ Cookie Clicker pace (very gentle), 1.5 ~ medium,
  // 2.0 ~ each next costs double (steep, easy mental math).
  clickUpgrade: {
    delta: 0.6,
    base:  10,
    mult:  3,
  },

  // Meta-upgrade: multiplies `clickUpgrade.delta` by `factor` per level.
  // Applies retroactively — per-tap recomputes with the new delta everywhere.
  //   effectiveDelta(level) = clickUpgrade.delta * factor ^ level
  //   cost(level)           = ceil(base * mult ^ level)
  clickPowerUpgrade: {
    factor: 1.1,
    base:   50,
    mult:   5,
  },

  // "+N per sec" passive income upgrade ("Idle Boost", IB).
  //   effectiveDelta(idleLevel) = idleUpgrade.delta * idlePowerUpgrade.factor ^ idlePowerLevel
  //   cost(idleLevel) = ceil(base * mult ^ idleLevel)
  idleUpgrade: {
    delta: 0.05,
    base:  10,
    mult:  3,
  },

  // Meta-upgrade: multiplies `idleUpgrade.delta` by `factor` per level ("Idle Boost Multiplier", IBM).
  idlePowerUpgrade: {
    factor: 1.1,
    base:   100,
    mult:   5,
  },

  // Hold-to-autotap: while the screen is held, an extra tap fires every N ms.
  // Smaller = faster auto-tapping. 1000 = once per second.
  holdTickMs: 500,

  // Offline progression cap: time away counts only up to this many hours.
  // Prevents "left for a month, got a billion" scenarios.
  // Applies both to closed-tab reload and to long pauses inside an open tab
  // (e.g. laptop sleep). Set higher for more generous offline, 0 to disable.
  maxOfflineHours: 12,
};
