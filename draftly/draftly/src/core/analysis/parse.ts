// ── Spell-text analysis ──────────────────────────────────────────────
// Every signal here is read from REAL Data Dragon spell + passive text.
// Nothing is hand-assigned per champion; the same parser runs on all.

export interface AbilityText {
  name?: string
  description?: string
  tooltip?: string
}

/**
 * Crowd-control vocabulary, weighted by severity. Hard, lockdown CC counts
 * for more than soft slows. Weights are constants applied uniformly to
 * every champion's real ability text — not per-champion tuning.
 */
const CC_TERMS: { re: RegExp; weight: number }[] = [
  { re: /\bsuppress(es|ion|ed)?\b/i, weight: 5 },
  { re: /\bstasis\b/i, weight: 4 },
  { re: /\bairborne|knock(s|ed)?[\s-]?(up|back|aside|away)|knockup\b/i, weight: 4 },
  { re: /\bstun(s|ned|ning)?\b/i, weight: 4 },
  { re: /\bcharm(s|ed|ing)?\b/i, weight: 4 },
  { re: /\btaunt(s|ed|ing)?\b/i, weight: 4 },
  { re: /\bfear(s|ed|ing)?|flee(s|ing)?|terrify\b/i, weight: 4 },
  { re: /\bsleep(s|ing)?|drowsy\b/i, weight: 4 },
  { re: /\bpolymorph(s|ed)?\b/i, weight: 4 },
  { re: /\broot(s|ed|ing)?|snare(s|d)?|immobiliz(e|es|ed)|ensnare\b/i, weight: 3.5 },
  { re: /\bbind(s|ing)?|tether(s|ed)?\b/i, weight: 2.5 },
  { re: /\bground(s|ed)?\b/i, weight: 2 },
  { re: /\bsilence(s|d)?\b/i, weight: 2 },
  { re: /\bdisarm(s|ed)?\b/i, weight: 2 },
  { re: /\bslow(s|ed|ing)?\b/i, weight: 1 },
  { re: /\bcrippl(e|es|ed)\b/i, weight: 1 },
]

/** Engage / initiation vocabulary (mobility + gap-close + lockdown reach). */
const ENGAGE_TERMS: { re: RegExp; weight: number }[] = [
  { re: /\b(hook|pull(s|ed)?|grab(s|bed)?|drag(s|ged)?)\b/i, weight: 4 },
  { re: /\b(dash(es|ed)?|leap(s|ed)?|lunge(s|d)?|charge(s|d)?)\b/i, weight: 3 },
  { re: /\b(blink(s|ed)?|teleport(s|ed)?|flash(es|ed)?)\b/i, weight: 2.5 },
  { re: /\b(jump(s|ed)?|vault(s|ed)?|pounce(s|d)?)\b/i, weight: 2 },
  { re: /\bgap[\s-]?clos(e|er|ing)\b/i, weight: 2 },
]

function scoreTerms(
  text: string,
  terms: { re: RegExp; weight: number }[],
  perAbilityCap: number,
): number {
  let score = 0
  for (const { re, weight } of terms) {
    if (re.test(text)) score += weight
  }
  return Math.min(score, perAbilityCap)
}

function clean(a: AbilityText): string {
  return `${a.name ?? ''} ${a.description ?? ''} ${a.tooltip ?? ''}`
}

/** Sum CC severity across a champion's passive + spells (capped per ability). */
export function ccScoreFromAbilities(abilities: AbilityText[]): number {
  return abilities.reduce(
    (sum, a) => sum + scoreTerms(clean(a), CC_TERMS, 5),
    0,
  )
}

/** Sum engage potential across abilities; hard CC at range adds initiation. */
export function engageScoreFromAbilities(abilities: AbilityText[]): number {
  let mobility = abilities.reduce(
    (sum, a) => sum + scoreTerms(clean(a), ENGAGE_TERMS, 4),
    0,
  )
  // A long-range hook/knock-up is engage even without a dash.
  const full = abilities.map(clean).join(' ')
  if (/\b(hook|knock|airborne|stun)\b/i.test(full)) mobility += 1.5
  return mobility
}
