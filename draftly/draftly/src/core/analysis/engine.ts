// ── Analysis engine ──────────────────────────────────────────────────
// Normalises raw metrics to percentile ratings across the loaded roster,
// then scores a team. When meta stats are connected, real win rate is
// folded in; otherwise the score is purely attribute-derived (and the
// UI says so). No value here is random or hand-assigned.

import type {
  Archetype,
  Champion,
  RawMetrics,
  Ratings,
  Team,
  TeamAnalysis,
  Tier,
} from '../types'

const METRIC_KEYS: (keyof RawMetrics)[] = [
  'damage',
  'cc',
  'tank',
  'engage',
  'scaling',
]

/** Build a percentile function for one metric over the whole roster. */
function percentileScaler(values: number[]): (v: number) => number {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  return (v: number) => {
    if (n <= 1) return 50
    // fraction of roster strictly below + ties counted as half
    let below = 0
    let equal = 0
    for (const x of sorted) {
      if (x < v) below++
      else if (x === v) equal++
    }
    return Math.round(((below + equal / 2) / n) * 100)
  }
}

/**
 * Convert each champion's raw metrics into 0–100 percentile ratings,
 * relative to every other champion in the dataset.
 */
export function normalizeRoster(rawList: RawMetrics[]): Ratings[] {
  const scalers = Object.fromEntries(
    METRIC_KEYS.map((k) => [k, percentileScaler(rawList.map((r) => r[k]))]),
  ) as Record<keyof RawMetrics, (v: number) => number>

  return rawList.map((r) => ({
    damage: scalers.damage(r.damage),
    cc: scalers.cc(r.cc),
    tank: scalers.tank(r.tank),
    engage: scalers.engage(r.engage),
    lateGame: scalers.scaling(r.scaling),
  }))
}

// ── Team scoring ─────────────────────────────────────────────────────

const TIER_CUTS: [number, Tier][] = [
  [88, 'S'],
  [78, 'A'],
  [68, 'B'],
  [56, 'C'],
  [44, 'D'],
  [0, 'F'],
]

function scoreToTier(score: number): Tier {
  return TIER_CUTS.find(([cut]) => score >= cut)![1]
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

export function analyzeTeam(team: Team, archetype: Archetype): TeamAnalysis {
  const champs = Object.values(team).filter((c): c is Champion => c !== null)

  const ratings: Ratings = {
    damage: Math.round(avg(champs.map((c) => c.ratings.damage))),
    cc: Math.round(avg(champs.map((c) => c.ratings.cc))),
    tank: Math.round(avg(champs.map((c) => c.ratings.tank))),
    engage: Math.round(avg(champs.map((c) => c.ratings.engage))),
    lateGame: Math.round(avg(champs.map((c) => c.ratings.lateGame))),
  }

  const values = Object.values(ratings)
  const mean = avg(values)
  const spread = values.length ? Math.max(...values) - Math.min(...values) : 0
  const balanceBonus = Math.max(0, 12 - spread / 6)

  // Synergy: real meta synergy if available, else class diversity (real tags).
  const synergyBonus = champs.length
    ? archetypeSynergy(champs, archetype) + classDiversity(champs)
    : 0

  let overall = mean * 0.78 + balanceBonus + synergyBonus

  // ── Real meta integration ──
  const metaChamps = champs.filter((c) => c.meta)
  const metaConnected = metaChamps.length > 0
  let avgWinRate: number | undefined
  let avgPickRate: number | undefined
  let avgBanRate: number | undefined
  let source: string | undefined
  let patch: string | undefined

  if (metaConnected) {
    const wr = metaChamps.map((c) => c.meta!.winRate).filter((x): x is number => x != null)
    const pr = metaChamps.map((c) => c.meta!.pickRate).filter((x): x is number => x != null)
    const br = metaChamps.map((c) => c.meta!.banRate).filter((x): x is number => x != null)
    if (wr.length) avgWinRate = +avg(wr).toFixed(1)
    if (pr.length) avgPickRate = +avg(pr).toFixed(1)
    if (br.length) avgBanRate = +avg(br).toFixed(1)
    source = metaChamps[0].meta!.source
    patch = metaChamps[0].meta!.patch
    // Blend attribute score with real win rate (50% WR maps to neutral).
    if (avgWinRate != null) {
      const wrSignal = (avgWinRate - 50) * 2.2 // ±0.5% WR ≈ ±1.1 pts
      overall = overall * 0.82 + (50 + wrSignal) * 0.18
    }
  }

  overall = Math.max(0, Math.min(100, Math.round(overall)))

  return {
    ratings,
    overall,
    tier: scoreToTier(overall),
    notes: buildNotes(ratings, metaConnected, avgWinRate),
    basis: metaConnected
      ? 'Derived from Riot champion attributes + live meta win rate.'
      : 'Derived from Riot champion attributes (base stats, class, spell text).',
    meta: { connected: metaConnected, source, patch, avgWinRate, avgPickRate, avgBanRate },
  }
}

/** Share of the team that fits the chosen archetype (real derived tags). */
function archetypeSynergy(champs: Champion[], archetype: Archetype): number {
  if (archetype === 'random') return 4
  const fit = champs.filter((c) => c.archetypes.includes(archetype as never)).length
  return (fit / champs.length) * 12
}

/** Reward covering multiple real champion classes (frontline + carry mix). */
function classDiversity(champs: Champion[]): number {
  const classes = new Set<string>()
  champs.forEach((c) => c.classes.forEach((cl) => classes.add(cl)))
  const hasFront = champs.some(
    (c) => c.classes.includes('Tank') || c.classes.includes('Fighter'),
  )
  const hasCarry = champs.some(
    (c) => c.classes.includes('Marksman') || c.classes.includes('Mage'),
  )
  return Math.min(classes.size, 5) * 0.8 + (hasFront && hasCarry ? 3 : 0)
}

function buildNotes(
  r: Ratings,
  metaConnected: boolean,
  avgWinRate?: number,
): string[] {
  const labels: Record<keyof Ratings, string> = {
    damage: 'heavy damage output',
    cc: 'strong crowd control',
    tank: 'a durable frontline',
    engage: 'reliable engage',
    lateGame: 'powerful scaling',
  }
  const weakLabels: Record<keyof Ratings, string> = {
    damage: 'low damage',
    cc: 'thin crowd control',
    tank: 'a squishy frontline',
    engage: 'weak engage',
    lateGame: 'a fragile late game',
  }
  const ordered = (Object.entries(r) as [keyof Ratings, number][]).sort(
    (a, b) => b[1] - a[1],
  )
  const notes = [`Built around ${labels[ordered[0][0]]}.`]
  const weakest = ordered[ordered.length - 1]
  if (weakest[1] < 42) notes.push(`Watch out — ${weakLabels[weakest[0]]}.`)
  if (metaConnected && avgWinRate != null) {
    notes.push(
      avgWinRate >= 50
        ? `Above-average live win rate (${avgWinRate}%).`
        : `Below-average live win rate (${avgWinRate}%).`,
    )
  }
  return notes
}

export { scoreToTier }
