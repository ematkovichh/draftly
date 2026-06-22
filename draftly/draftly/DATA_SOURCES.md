# Data sources & API integration

This document is the honest map of what Draftly's numbers are made of, what
is **real and live today**, what **requires an external API**, and **exactly
how to wire those APIs in** without touching the rest of the app.

## TL;DR

| Data | Source | Status in Draftly | Needs a backend? |
|---|---|---|---|
| Champion identity, base stats, growth, class tags, resource | Riot **Data Dragon** | ✅ Live | No |
| Riot `info` ratings (attack/defense/magic/difficulty) | Riot **Data Dragon** | ✅ Live | No |
| Spell + passive text (→ CC / engage detection) | Riot **Data Dragon** | ✅ Live | No |
| Splash / loading / square art | Riot **Data Dragon** | ✅ Live | No |
| Lane / role assignment | *no official source* | Maintained reference, pluggable | Optional |
| Win rate / pick rate / ban rate | aggregation or 3rd-party | 🔌 Provider interface ready | **Yes** |
| Counters / synergies | aggregation or 3rd-party | 🔌 Provider interface ready | **Yes** |

**Nothing is fabricated.** Every draft rating is derived from the live Data
Dragon attributes (see "How ratings are derived" below). The meta fields
(win/pick/ban/counters/synergies) are shown as *"not connected"* until you
attach a provider — Draftly never invents them.

## 1. Riot Data Dragon — champion data & art (live, no key, CORS-ok)

The official static CDN. Draftly fetches, in two requests:

```
GET https://ddragon.leagueoflegends.com/api/versions.json          → latest patch
GET https://ddragon.leagueoflegends.com/cdn/<ver>/data/en_US/championFull.json
```

`championFull.json` contains, for every champion: `stats` (base + per-level),
`info` (Riot's 0–10 attack/defense/magic/difficulty), `tags` (Fighter, Tank,
Mage, Assassin, Marksman, Support), `partype`, and full `passive` + `spells`
text. Art:

```
https://ddragon.leagueoflegends.com/cdn/img/champion/splash/<id>_0.jpg
https://ddragon.leagueoflegends.com/cdn/img/champion/loading/<id>_0.jpg
https://ddragon.leagueoflegends.com/cdn/<ver>/img/champion/<id>.png
```

Implemented in `src/data/providers/dataDragon.ts`.

> Optional upgrade: **Meraki Analytics** (`cdn.merakianalytics.com`, CORS-ok)
> publishes enriched ability data with exact CC durations and damage values.
> Adding a `MerakiProvider` would sharpen CC/engage scoring. It still does
> **not** provide win/pick/ban.

## 2. The data that is NOT freely available in a browser

**Win rate, pick rate, ban rate, counters, synergies, and live role splits do
not exist in any official, free, CORS-enabled endpoint.** There are exactly
two real ways to get them, and both require a server you control:

### Option A — Official: aggregate Riot **MATCH-V5** yourself

- Riot API (`developer.riotgames.com`) gives raw match data, **not** rates.
- You need a **production API key** (apply; the free dev key is rate-limited).
- A backend ingests `MATCH-V5` matches continuously and computes per-champion,
  per-role win/pick/ban and matchup tables.
- Pros: fully official, ToS-clean, your own data. Cons: real engineering and
  ongoing match ingestion.

### Option B — Third-party stats (U.GG / OP.GG / Lolalytics / Blitz)

- These sites expose **unofficial** JSON endpoints (e.g. U.GG's stats CDN).
- They are **CORS-blocked** from a static site and may break or have ToS
  limits, so you put a **small serverless proxy** (Vercel / Netlify /
  Cloudflare Worker) in front that fetches, caches, normalises, and re-serves
  with CORS headers.
- Pros: minimal code, instant real numbers. Cons: unofficial and fragile.

### Why a backend at all?

A static GitHub Pages site can't legally hold a Riot key or bypass another
site's CORS. In **both** options the browser calls **one endpoint you own**,
which returns JSON in Draftly's normalised shape.

## 3. How to plug a meta provider in (zero refactor)

Draftly already abstracts this. The browser side is done; you only stand up
the endpoint.

1. Deploy a backend/serverless function (Option A or B) that returns:

```jsonc
{
  "source": "U.GG (proxied)",
  "patch": "15.12",
  "byChampion": {
    "Aatrox": {
      "winRate": 50.3, "pickRate": 8.1, "banRate": 3.2,
      "counters":  [{ "championId": "Fiora", "winRateAgainst": 46.0 }],
      "synergies": []
    }
  },
  "rolesByChampion": { "Aatrox": ["top"] }   // optional: overrides reference roles
}
```

2. Point Draftly at it:

```bash
# .env
VITE_META_API_URL=https://your-proxy.example.com/api/meta
```

That's it. On next load:
- `HttpMetaProvider` (`src/data/providers/meta/httpMeta.ts`) fetches it,
- the DataBar flips **Meta → connected**,
- the analysis folds **real win rate** into the team score
  (`engine.ts`, `analyzeTeam`), and the win/pick/ban panel fills in,
- if `rolesByChampion` is present, **live role data replaces** the maintained
  reference roles.

To add a different source, implement `MetaStatsProvider` and register it in
`src/data/providers/registry.ts`. Nothing else changes.

## 4. How ratings are derived (all from real attributes)

Implemented in `src/core/analysis/`:

- **Damage** — Riot's `info.attack`/`info.magic` (real) + computed
  auto-attack DPS from base AD × attack speed at the in-game growth curve.
- **Crowd Control** — parsed from real spell/passive text; hard CC (stun,
  root, knock-up, charm, taunt, suppress…) weighted above slows (`parse.ts`).
- **Tankiness** — effective HP from base HP × (armor+MR mitigation) using
  Riot's real per-level growth formula, + `info.defense`, + Tank class.
- **Engage** — parsed mobility/initiation (dash, hook, blink, knock-up reach).
- **Late game** — ratio of level-18 to level-3 combat power from real growth
  stats, + carry class.

Each champion's raw metric is then **percentile-ranked across the whole loaded
roster**, so a 0–100 rating means "relative to every champion this patch."
Team ratings average the five picks; the tier blends category balance,
archetype synergy (from derived tags), class diversity, and — when connected —
real win rate. No random numbers, no hand-assigned per-champion scores.

## 5. The one maintained list, and why

Riot publishes **no** canonical lane/role mapping, and "yordle" is lore, not a
data field. So `src/data/reference/championReference.json` holds factual
categorisations (which lanes a champion is played in, which champions are
yordles, an off-meta reference set). These are **categories, not scores**, and
any of them is overridden at runtime when a meta provider supplies live data
(`rolesByChampion`, real pick rate). New champions need one line here until a
role-aware meta provider is connected.
