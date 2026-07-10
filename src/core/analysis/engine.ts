import type { Archetype, Champion, Ratings, RawMetrics, Team, TeamAnalysis, Tier } from '../types'

const KEYS: (keyof RawMetrics)[] = ['damage','cc','tank','engage','scaling','earlyGame','poke','disengage','objectiveControl']

function percentile(values: number[]): (v: number) => number {
  const sorted = [...values].sort((a, b) => a - b)
  return (v: number) => {
    let below = 0, equal = 0
    for (const x of sorted) { if (x < v) below++; else if (x === v) equal++ }
    return Math.round(((below + equal / 2) / sorted.length) * 100)
  }
}

export function normalizeRoster(rawList: RawMetrics[]): Ratings[] {
  const sc = Object.fromEntries(KEYS.map(k => [k, percentile(rawList.map(r => r[k]))])) as Record<keyof RawMetrics, (v: number) => number>
  return rawList.map(r => ({ damage: sc.damage(r.damage), cc: sc.cc(r.cc), tank: sc.tank(r.tank), engage: sc.engage(r.engage), lateGame: sc.scaling(r.scaling), earlyGame: sc.earlyGame(r.earlyGame), poke: sc.poke(r.poke), disengage: sc.disengage(r.disengage), objectiveControl: sc.objectiveControl(r.objectiveControl) }))
}

function avg(n: number[]) { return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0 }

const TIER_CUTS: [number, Tier][] = [[88,'S'],[78,'A'],[68,'B'],[56,'C'],[44,'D'],[0,'F']]
export function scoreToTier(s: number): Tier { return TIER_CUTS.find(([c]) => s >= c)![1] }

const ARCHETYPE_DATA: Record<Exclude<Archetype,'random'>, { label: string; desc: string }> = {
  teamfight: { label: 'Teamfight Comp', desc: 'Built to win 5v5 skirmishes with AoE damage and reliable engage.' },
  poke:      { label: 'Poke Comp',      desc: 'Harasses enemies from range, forcing bad fights or Baron/Dragon contests.' },
  dive:      { label: 'Dive Comp',      desc: 'Hard engages with gap closers to assassinate priority targets.' },
  scaling:   { label: 'Scaling Comp',   desc: 'Weak early but reaches late-game power spikes that overwhelm enemies.' },
  siege:     { label: 'Siege Comp',     desc: 'Long-range wave-clear and disengage to safely destroy towers.' },
}

export function deriveArchetypes(r: Ratings, classes: ChampClass[]): Exclude<Archetype,'random'>[] {
  const res: Exclude<Archetype,'random'>[] = []
  const isAssassin = classes.includes('Assassin') || classes.includes('Fighter')
  if (r.engage >= 58 && (isAssassin || classes.includes('Tank'))) res.push('dive')
  if (r.poke >= 55 && r.engage < 52) res.push('poke')
  if (r.cc >= 58 || (classes.includes('Tank') && r.engage >= 50)) res.push('teamfight')
  if (r.lateGame >= 62) res.push('scaling')
  if (r.disengage >= 55 && r.poke >= 45) res.push('siege')
  return res
}

import type { ChampClass } from '../types'

export function analyzeTeam(team: Team, requestedArchetype: Archetype): TeamAnalysis {
  const champs = Object.values(team).filter((c): c is Champion => c !== null)
  if (!champs.length) return emptyAnalysis(requestedArchetype)

  const r: Ratings = {
    damage: Math.round(avg(champs.map(c => c.ratings.damage))),
    cc: Math.round(avg(champs.map(c => c.ratings.cc))),
    tank: Math.round(avg(champs.map(c => c.ratings.tank))),
    engage: Math.round(avg(champs.map(c => c.ratings.engage))),
    lateGame: Math.round(avg(champs.map(c => c.ratings.lateGame))),
    earlyGame: Math.round(avg(champs.map(c => c.ratings.earlyGame))),
    poke: Math.round(avg(champs.map(c => c.ratings.poke))),
    disengage: Math.round(avg(champs.map(c => c.ratings.disengage))),
    objectiveControl: Math.round(avg(champs.map(c => c.ratings.objectiveControl))),
  }

  const vals = Object.values(r)
  const mean = avg(vals)
  const spread = Math.max(...vals) - Math.min(...vals)
  const balanceBonus = Math.max(0, 14 - spread / 6)
  const classes = new Set(champs.flatMap(c => c.classes))
  const hasFront = champs.some(c => c.classes.includes('Tank') || c.classes.includes('Fighter'))
  const hasCarry = champs.some(c => c.classes.includes('Marksman') || c.classes.includes('Mage'))
  const diversityBonus = Math.min(classes.size, 5) * 0.9 + (hasFront && hasCarry ? 3 : 0)

  // Synergy: how many champions fit the requested archetype
  const arcFit = requestedArchetype === 'random' ? champs.length
    : champs.filter(c => c.archetypes.includes(requestedArchetype as Exclude<Archetype,'random'>)).length
  const synergyRaw = arcFit / champs.length
  const synergy = Math.round(synergyRaw * 100)
  const archetypeBonus = synergyRaw * 8

  let overall = mean * 0.76 + balanceBonus + diversityBonus + archetypeBonus

  // meta blend
  const metaChamps = champs.filter(c => c.meta)
  const metaConnected = metaChamps.length > 0
  let avgWinRate: number | undefined; let source: string | undefined
  if (metaConnected) {
    const wr = metaChamps.map(c => c.meta!.winRate).filter((x): x is number => x != null)
    if (wr.length) { avgWinRate = +avg(wr).toFixed(1); overall = overall * 0.82 + (50 + (avgWinRate - 50) * 2.2) * 0.18 }
    source = metaChamps[0].meta!.source
  }

  overall = Math.max(0, Math.min(100, Math.round(overall)))

  // Dominant archetype for this comp
  const domArch = detectDominantArchetype(r)

  // Strengths & weaknesses
  const strengths: string[] = [], weaknesses: string[] = [], suggestions: string[] = []
  const LABELS: Record<keyof Ratings, [string, string]> = {
    damage:          ['Burst damage output','Low damage — enemies will free-fight'],
    cc:              ['Excellent crowd control', 'Thin CC — hard to lock down targets'],
    tank:            ['Durable frontline','Squishy frontline — vulnerable to dive'],
    engage:          ['Reliable engage tools','Weak engage — struggles to start fights'],
    lateGame:        ['Dominant late-game scaling','Falls off hard — need early leads'],
    earlyGame:       ['Strong early-game skirmishing','Slow early game — avoid forcing early fights'],
    poke:            ['Strong poke and harassment','No poke — all-in or nothing'],
    disengage:       ['Good peel and disengage','No disengage — weak against engage comps'],
    objectiveControl:['Great objective control','Limited objective presence'],
  }
  const sorted = (Object.entries(r) as [keyof Ratings, number][]).sort((a, b) => b[1] - a[1])
  sorted.slice(0,2).forEach(([k,v]) => { if(v >= 55) strengths.push(LABELS[k][0]) })
  sorted.slice(-2).forEach(([k,v]) => { if(v < 44) { weaknesses.push(LABELS[k][1]); suggestions.push(SUGGEST[k]) } })
  if (!hasFront && champs.length >= 4) weaknesses.push('No frontline — prone to getting poked out')
  if (!hasCarry && champs.length >= 4) weaknesses.push('Limited carry threat in late game')

  const synergyLabel = synergy >= 80 ? 'Excellent' : synergy >= 60 ? 'Good' : synergy >= 40 ? 'Decent' : 'Mismatched'
  const draftStats = {
    ap: champs.filter(champion => champion.damageType === 'AP').length,
    ad: champs.filter(champion => champion.damageType === 'AD').length,
    mixed: champs.filter(champion => champion.damageType === 'Mixed').length,
    melee: champs.filter(champion => champion.rangeType === 'melee').length,
    ranged: champs.filter(champion => champion.rangeType === 'ranged').length,
    frontline: champs.filter(champion => champion.classes.includes('Tank') || champion.classes.includes('Fighter')).length,
  }

  return {
    ratings: r, overall, tier: scoreToTier(overall),
    archetype: domArch, archetypeLabel: ARCHETYPE_DATA[domArch].label, archetypeDesc: ARCHETYPE_DATA[domArch].desc,
    synergy, synergyLabel,
    strengths, weaknesses, suggestions,
    notes: [ARCHETYPE_DATA[domArch].desc],
    basis: metaConnected ? 'Rated from Riot attributes + live win rate.' : 'Rated from Riot champion attributes (stats, class, spell text).',
    meta: { connected: metaConnected, avgWinRate, source },
    draftStats,
    counterSignals: counterSignalsFor(r),
    counterRecommendations: counterRecommendationsFor(champs, r, draftStats),
  }
}

function counterSignalsFor(r: Ratings) {
  return [
    signal('Dive compositions', avg([r.cc, r.tank, r.disengage]), 'Peel, crowd control, and frontline help stop all-ins.'),
    signal('Poke compositions', avg([r.engage, r.disengage, r.lateGame]), 'Reach and stability help close the gap without losing control.'),
    signal('Frontline compositions', avg([r.damage, r.objectiveControl, r.lateGame]), 'Damage and objective threat help work through durable targets.'),
  ]
}

function signal(opponent: string, value: number, detail: string) {
  const score = Math.round(value)
  const label = score >= 70 ? 'Strong answer' : score >= 52 ? 'Usable answer' : 'Needs support'
  return { opponent, score, label, detail }
}

function counterRecommendationsFor(champs: Champion[], r: Ratings, stats: TeamAnalysis['draftStats']) {
  const recommendations: { score: number; comp: string; champions: string[]; targets: string[]; why: string }[] = []
  const names = (filter: (champion: Champion) => boolean) => champs.filter(filter).map(champion => champion.name)
  const rangedTargets = names(champion => champion.rangeType === 'ranged')

  if (stats.ap >= 3) recommendations.push({
    score: stats.ap * 30, comp: 'Anti-magic frontline', champions: ['Galio', 'Dr. Mundo', 'Maokai'],
    targets: names(champion => champion.damageType === 'AP'),
    why: 'Magic resistance, sustain, and anti-burst tools reduce an AP-heavy team’s primary damage pattern.',
  })
  if (stats.ad >= 3) recommendations.push({
    score: stats.ad * 30, comp: 'Armor-stack front line', champions: ['Malphite', 'Rammus', 'Taric'],
    targets: names(champion => champion.damageType === 'AD'),
    why: 'High armor and point-and-click disruption are efficient into an AD-heavy damage profile.',
  })
  if (r.disengage < 52) recommendations.push({
    score: 100 - r.disengage, comp: 'Hard-engage dive', champions: ['Nocturne', 'Vi', 'Galio'],
    targets: rangedTargets.length ? rangedTargets : champs.map(champion => champion.name),
    why: 'Low peel and disengage make committed engages difficult to reset once the back line is reached.',
  })
  if (r.engage < 52) recommendations.push({
    score: 100 - r.engage, comp: 'Long-range poke / siege', champions: ['Jayce', 'Xerath', 'Ziggs', 'Janna'],
    targets: champs.map(champion => champion.name),
    why: 'Limited engage gives a poke comp more room to control space and chip health before objectives.',
  })
  if (r.tank < 48) recommendations.push({
    score: 100 - r.tank, comp: 'Front-to-back teamfight', champions: ['Ornn', 'Sejuani', 'Jinx', 'Lulu'],
    targets: rangedTargets.length ? rangedTargets : champs.map(champion => champion.name),
    why: 'A thin frontline can struggle to contest a protected hypercarry behind reliable engage and peel.',
  })
  if (!recommendations.length) recommendations.push({
    score: 1, comp: 'Balanced front-to-back', champions: ['Ornn', 'Azir', 'Jinx', 'Lulu'], targets: champs.map(champion => champion.name),
    why: 'This is a stable answer pattern when the draft has no single, obvious composition weakness.',
  })
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 3).map(recommendation => ({
    comp: recommendation.comp,
    champions: recommendation.champions,
    targets: recommendation.targets,
    why: recommendation.why,
  }))
}

function detectDominantArchetype(r: Ratings): Exclude<Archetype,'random'> {
  const scores: Record<Exclude<Archetype,'random'>, number> = {
    teamfight: r.cc * 0.4 + r.engage * 0.3 + r.tank * 0.3,
    poke:      r.poke * 0.5 + r.disengage * 0.3 + r.damage * 0.2,
    dive:      r.engage * 0.45 + r.damage * 0.35 + r.lateGame * 0.2,
    scaling:   r.lateGame * 0.5 + r.damage * 0.3 + r.disengage * 0.2,
    siege:     r.poke * 0.35 + r.disengage * 0.35 + r.objectiveControl * 0.3,
  }
  return (Object.entries(scores) as [Exclude<Archetype,'random'>, number][]).sort((a, b) => b[1] - a[1])[0][0]
}

const SUGGEST: Record<keyof Ratings, string> = {
  damage: 'Add an AP or AD carry for more burst',
  cc: 'Pick a champion with hard CC (stun, root, knock-up)',
  tank: 'Add a tank or bruiser to anchor the front',
  engage: 'Include an engage champion (hook, dash, charge)',
  lateGame: 'Consider a hyper-carry for late-game power',
  earlyGame: 'Add lane priority or an early skirmisher',
  poke: 'Add a ranged poker for lane pressure',
  disengage: 'Pick a champion with peel or disengage',
  objectiveControl: 'Add a champion with global presence or execute',
}

function emptyAnalysis(archetype: Archetype): TeamAnalysis {
  const r: Ratings = { damage:0,cc:0,tank:0,engage:0,lateGame:0,earlyGame:0,poke:0,disengage:0,objectiveControl:0 }
  const a: Exclude<Archetype,'random'> = archetype === 'random' ? 'teamfight' : archetype
  return {
    ratings:r, overall:0, tier:'F', archetype:a, archetypeLabel:ARCHETYPE_DATA[a].label,
    archetypeDesc:ARCHETYPE_DATA[a].desc, synergy:0, synergyLabel:'—', strengths:[], weaknesses:[],
    suggestions:[], notes:[], basis:'', meta:{connected:false},
    draftStats: { ap:0, ad:0, mixed:0, melee:0, ranged:0, frontline:0 },
    counterSignals: counterSignalsFor(r),
    counterRecommendations: [],
  }
}
