export interface AbilityText { name?: string; description?: string; tooltip?: string }

const CC: { re: RegExp; w: number }[] = [
  { re: /\bsuppress(es|ion|ed)?\b/i, w: 5 },
  { re: /\bstasis\b/i, w: 4 },
  { re: /\bairborne|knock(s|ed)?[\s-]?(up|back|aside|away)|knockup\b/i, w: 4 },
  { re: /\bstun(s|ned|ning)?\b/i, w: 4 },
  { re: /\bcharm(s|ed|ing)?\b/i, w: 4 },
  { re: /\btaunt(s|ed|ing)?\b/i, w: 4 },
  { re: /\bfear(s|ed|ing)?|flee(s|ing)?|terrify\b/i, w: 4 },
  { re: /\bsleep(s|ing)?|drowsy\b/i, w: 4 },
  { re: /\bpolymorph(s|ed)?\b/i, w: 4 },
  { re: /\broot(s|ed|ing)?|snare(s|d)?|immobiliz(e|es|ed)|ensnare\b/i, w: 3.5 },
  { re: /\bbind(s|ing)?|tether(s|ed)?\b/i, w: 2.5 },
  { re: /\bground(s|ed)?\b/i, w: 2 },
  { re: /\bsilence(s|d)?\b/i, w: 2 },
  { re: /\bdisarm(s|ed)?\b/i, w: 2 },
  { re: /\bslow(s|ed|ing)?\b/i, w: 1 },
]

const ENGAGE: { re: RegExp; w: number }[] = [
  { re: /\b(hook|pull(s|ed)?|grab(s|bed)?|drag(s|ged)?)\b/i, w: 4 },
  { re: /\b(dash(es|ed)?|leap(s|ed)?|lunge(s|d)?|charge(s|d)?)\b/i, w: 3 },
  { re: /\b(blink(s|ed)?|teleport(s|ed)?)\b/i, w: 2.5 },
  { re: /\b(jump(s|ed)?|vault(s|ed)?|pounce(s|d)?)\b/i, w: 2 },
  { re: /\bgap[\s-]?clos(e|er|ing)\b/i, w: 2 },
]

const POKE: { re: RegExp; w: number }[] = [
  { re: /\b(long.?range|far|distant|wide)\b/i, w: 2 },
  { re: /\b(skill.?shot|projectile|missile|orb|bolt|wave)\b/i, w: 1.5 },
  { re: /\b(harass|poke|pressure)\b/i, w: 2 },
]

const DISENGAGE: { re: RegExp; w: number }[] = [
  { re: /\b(shield(s|ed)?|barrier|block(s|ed)?)\b/i, w: 2 },
  { re: /\b(push(es|ed)?|repel(s|led)?|knock.?away|displace)\b/i, w: 3 },
  { re: /\b(cleanse(s|d)?|remove(s|d)? crowd control)\b/i, w: 3 },
  { re: /\b(escape|evade|flee|retreat|stealth|invisible|invisibility)\b/i, w: 2 },
]

const OBJECTIVE: { re: RegExp; w: number }[] = [
  { re: /\b(teleport|global|map-wide)\b/i, w: 3 },
  { re: /\b(smite|dragon|baron|herald|tower|turret)\b/i, w: 2 },
  { re: /\b(execute|true damage|percent.?health)\b/i, w: 1.5 },
]

function score(text: string, terms: { re: RegExp; w: number }[], cap: number): number {
  return Math.min(terms.reduce((s, t) => t.re.test(text) ? s + t.w : s, 0), cap)
}

function clean(a: AbilityText): string {
  return `${a.name ?? ''} ${a.description ?? ''} ${a.tooltip ?? ''}`
}

export function parseAbilities(abilities: AbilityText[]) {
  const full = abilities.map(clean).join(' ')
  return {
    cc: abilities.reduce((s, a) => s + score(clean(a), CC, 5), 0),
    engage: abilities.reduce((s, a) => s + score(clean(a), ENGAGE, 4), 0) + (/\b(hook|knock|airborne|stun)\b/i.test(full) ? 1.5 : 0),
    poke: score(full, POKE, 10),
    disengage: score(full, DISENGAGE, 10),
    objectiveControl: score(full, OBJECTIVE, 10),
  }
}
