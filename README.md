# Draftly — League of Legends Team Composition Forge

Generate role-accurate 5-player team comps and get a draft analysis that is
**derived entirely from real Riot champion data** — no random or hand-assigned
scores.

https://ematkovichh.github.io/draftly/

## What's real

- **Champion data & art:** live from Riot **Data Dragon** (latest patch, no API
  key). Base stats, per-level growth, Riot `info` ratings, class tags, and full
  spell/passive text.
- **Draft ratings (Damage / CC / Tankiness / Engage / Late Game):** derived
  from those real attributes — effective HP from real growth formulas, CC and
  engage parsed from real spell text, then percentile-ranked across the whole
  roster. See `DATA_SOURCES.md` §4.
- **Meta stats (win / pick / ban / counters / synergies):** **not** available
  from any free, browser-callable API. Draftly ships a provider interface for
  them and shows *"not connected"* until you attach a backend — it never fakes
  the numbers. Integration steps in `DATA_SOURCES.md` §2–3.

## Features

- Role-accurate generation (Top / Jungle / Mid / Bot / Support) + per-role reroll
- Archetypes (Dive / Poke / Teamfight / Scaling) derived from real ratings
- Challenge modes: Off-Meta, Old School (real release order), Full AP, Full AD,
  Yordle
- Team analysis with F–S tier, rating bars, and transparent data-basis note
- Share-via-URL and copy-to-clipboard
- Hextech / League-client aesthetic

## Architecture

```
src/
  core/
    types.ts                 domain types (provider-agnostic)
    draft.ts                 role pools, archetype/challenge filtering
    analysis/
      parse.ts               CC/engage from real spell text
      derive.ts              metrics from real base stats (growth formula)
      engine.ts              roster percentile normalisation + team scoring
      archetype.ts           archetype derivation from ratings
  data/
    providers/
      types.ts               ChampionDataProvider / MetaStatsProvider contracts
      dataDragon.ts          REAL champion data (live)
      meta/nullMeta.ts       honest default (no data)
      meta/httpMeta.ts       skeleton for a real meta backend/proxy
      registry.ts            single place to choose/add providers
    reference/championReference.json   factual role/yordle map (pluggable)
    art.ts
  services/championService.ts orchestrates providers → normalised roster
  hooks/                     useChampions (load), useTeam (draft state)
  components/                UI
```

**Adding a new API takes no refactor:** implement `MetaStatsProvider` (or
`ChampionDataProvider`) and register it in `registry.ts`. Everything else
depends only on the interfaces.

## Run

```bash
npm install
npm run dev      # local dev
npm run build    # production build → dist/
```

### Optional: connect live meta stats

```bash
cp .env.example .env
# set VITE_META_API_URL to your backend/proxy endpoint
```

When set, the win/pick/ban panel fills in, real win rate folds into the score,
and live role data overrides the reference map. See `DATA_SOURCES.md`.

## Deploy to GitHub Pages

`vite.config.ts` uses `base: './'`, and `.github/workflows/deploy.yml` builds
and publishes `dist/` via GitHub Actions on push to `main`. Or run
`npm run deploy` (gh-pages).

## Disclaimer

Unofficial fan project. League of Legends and all champion assets are property
of Riot Games. Not endorsed by Riot.
