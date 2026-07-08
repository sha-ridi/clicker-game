# Planet Terraform Clicker — Design (v1)

**Date:** 2026-07-08
**Status:** Approved for planning
**Scope:** Full rebuild. The existing terminal-aesthetic clicker is replaced from scratch. This spec covers **iteration 1 (core loop on one planet)**. Prestige/meta-progression is a separate later iteration, but v1 architecture must not block it.

---

## 1. Concept

A pastel, cartoonish, pseudo-3D incremental clicker. The player taps a dead grey planet to collect **energy**, then spends energy on **terraform stages** that visibly bring the planet to life — from dead rock to a lush, cloud-wrapped mint world.

The core pleasure is **visible transformation**: every purchase changes how the planet looks.

## 2. Platform & stack (unchanged from old project)

- Vanilla HTML + CSS + JS. No frameworks, no build step. Open `index.html` → it runs.
- Hosting: GitHub Pages, repo `sha-ridi/clicker-game`, live at https://sha-ridi.github.io/clicker-game/.
- **All asset paths relative** (`./balance.js`), never absolute — GH Pages serves under `/clicker-game/`.
- Deploy = push to `main`.

## 3. Aesthetic / design system (NEW — replaces the old terminal system)

The old dark-terminal system (Geist Mono, sharp corners, muted amber, lowercase brackets, no scale/bounce) is **fully retired**. New system:

- **Mood:** soft, rounded, pastel, cartoon, friendly. Playful but calm.
- **Planet render technique:** rotating CSS sphere ("Variant A"). A `radial-gradient` gives spherical shading (light from top-left); wide repeating layers (`surf`, `clouds`) translate horizontally on a loop to fake rotation, clipped by `overflow:hidden` on the circle; an inset box-shadow is the terminator; an outer box-shadow is the atmospheric glow. Pure CSS, cheap, always animating.
- **Palette — "Mint Meadow"** (approximate, tune in `balance.js`/CSS later):
  - Land (alive): `#dcf5d3 → #a9e0af → #79c89f → #4f9d8a` (radial, light→dark)
  - Water: `#8fd0ec`
  - Forest specks: `#3f8f6a`
  - Life specks: `#ffd1e3` (blossom pink), `#ffe9a8` (pollen yellow)
  - Clouds: `#ffffff`
  - Dead rock (stage 0): greys `#c2c0ba → #9a978f → #6f6c66`
  - Atmosphere glow: `rgba(170,235,215,·)`
  - Sky/background: soft pastel gradient (`#eaf6ff → #d5e7fb`)
- **Typography:** Quicksand (Google Fonts), rounded and friendly. Fallback chain to `ui-rounded, system-ui, sans-serif`. Offline fallback matters (SW skips cross-origin fonts → system rounded fonts).
- **Shapes:** rounded corners on cards/buttons, soft shadows, gentle motion allowed.
- **Feedback:** tapping the planet triggers a brief **squash/bounce** (~80–120ms) and a floating `+N` at the tap point. Bounce is now on-brand (it was banned only under the old terminal aesthetic).

`CLAUDE.md` will be rewritten as part of implementation to describe this new project (concept, new design system, new architecture). It stays gitignored.

## 4. Core loop

1. **Tap the planet** (hit target = the sphere itself, generous radius; not the whole screen) → `+getPerTap()` energy, floating `+N` at the pointer, planet squash animation.
2. **Passive income**: `getPerSec()` energy accrues via a 100 ms `dt`-based tick.
3. **Spend energy** on two upgrade axes (below).
4. Planet's appearance is re-derived from state on every `render()`.

Single currency: **energy**.

### 4.1 Tap axis

- **Tap power** (`tap.powerLevel`): each purchase adds a flat delta to per-tap energy.
- **Tap multiplier** (`tap.metaLevel`): each purchase multiplies the tap delta (retroactive), mirroring the old `T++` meta-upgrade. Formula centralized in `getPerTap()`.

### 4.2 Terraform stages (hybrid ladder)

Six stages, cumulative and gated. Stage 0 is the starting state (no purchase). Stages 1–5 each have:

- **Unlock** — one-time purchase; gates the next stage; adds its visual layer and begins contributing passive energy.
- **Levels** — repeatable purchases after unlock; increase this stage's passive contribution and its visual density (more water / denser forest / more life / thicker clouds).

| # | Name (RU)      | Unlocks visual                          | Passive role |
|---|----------------|-----------------------------------------|--------------|
| 0 | Мёртвый камень | grey cratered rock (start)              | none (tap only) |
| 1 | Океаны         | blue water patches                      | base passive |
| 2 | Луга           | land turns green                        | + |
| 3 | Леса           | forest specks appear, denser green      | + |
| 4 | Жизнь          | blossom/pollen specks (flowers, fauna)  | + |
| 5 | Атмосфера      | drifting cloud layer + brighter glow    | + |

`getPerSec()` = sum of each unlocked stage's contribution (function of its level), times any global multiplier (prestige hook, `1` in v1).

## 5. State model

Single object, all defaults from `resetState()` (the one place init and reset — and future rebirth — flow through):

```
state = {
  energy: Number,
  tap:    { powerLevel: Int, metaLevel: Int },
  stages: [ { unlocked: Bool, level: Int }, ...6 entries (index 0 always unlocked) ],
  lastTick: epoch ms,
  // reserved for iteration 2 (prestige): meta multiplier / rebirth count slot
}
```

- On load, deep-merge saved data over `resetState()` defaults (forward-compat: old saves missing new fields inherit defaults). Stages array merged element-wise.
- Numbers stored as JS `Number` (float64). Display via formatters; scientific notation past a threshold (`fmt` / `fmtCount` pattern carried over conceptually).

## 6. Derived values (functions, never stored)

- `getPerTap()` — from `tap.powerLevel`, `tap.metaLevel`, base.
- `getPerSec()` — sum over unlocked stages of `stageContribution(i, level)`, × global multiplier (1 in v1).
- `stageUnlockCost(i)`, `stageLevelCost(i, level)`, `tapCost(level)`, `tapMetaCost(level)` — all in `balance.js`.
- **All formulas parameterized** so a future prestige multiplier and cost-scaling bonus slot in without rewrites.

## 7. Planet rendering (state → DOM)

`render()` is the single source of DOM truth, **including the planet**. The sphere's layers are derived from the highest unlocked stage and per-stage levels:

- Land gradient: grey (stage 0) → mint (stage ≥ 2).
- Water layer opacity/coverage: from stage 1 level.
- Forest specks count/density: from stage 3 level.
- Life specks: from stage 4 level.
- Cloud layer + glow intensity: from stage 5 level.

Rotation runs continuously via CSS animation regardless of state. No DOM updates scattered in handlers — handlers mutate state and call `render()` + `save()`.

## 8. Carried-over infrastructure

- **Save:** localStorage key (new, e.g. `terraform-save`). User actions save instantly; ticks throttled to ≤1/sec via shared `lastSaveTime`.
- **Offline progression:** on load `dt = now − lastTick`, clamp via `clampDt()` (cap `maxOfflineHours`), `gain = getPerSec() × dt`. If `dt > 30s`, **deferred-claim modal** shows gain + offline duration; energy is credited only on modal close (gain copied to local, pending zeroed before mutation — double-credit guard). If `dt ≤ 30s`, credit silently. Same `clampDt()` applied in tick (sleep guard).
- **PWA:** `manifest.webmanifest` (name, icon, `black` status bar, standalone), `service-worker.js` (cache-first for same-origin app shell; cross-origin fonts pass through to network with system-font fallback offline), new pastel-planet `icon.svg`. `CACHE_NAME` bumped on every app-shell change (documented manual step; automate later).

## 9. File structure

- `index.html` — markup + inline `<style>` + inline game logic.
- `balance.js` — all numbers/formulas; sync `<script src>` before inline logic; exports global `BALANCE`.
- `manifest.webmanifest`, `service-worker.js`, `icon.svg`.
- `README.md`, `CLAUDE.md` (gitignored) — updated to the new project.

Old `index.html`, `balance.js`, `icon.svg` are replaced wholesale.

## 10. Prestige-readiness (do now, so iteration 2 is cheap)

- `resetState()` is the sole state-shaping entry point.
- A global multiplier factor threads through `getPerSec()`/`getPerTap()`/cost functions, hardcoded to neutral (`1`) in v1.
- A reserved state slot for meta-progression, unused in v1.

## 11. Out of scope for v1 (iteration 2+)

Prestige / "fly to next planet" rebirth, 1-of-3 meta-upgrade choice, planet visual variants, second currency, sound, haptics.

## 12. Open questions

None. Resolved during brainstorming: theme = planet; spine = terraforming; loop = hybrid stages+levels; tap axis = yes (with meta multiplier); currency = single; render = rotating CSS sphere; palette = Mint Meadow; 6 stages as named; tap target = the sphere; font = Quicksand; carry over save + offline + PWA.
