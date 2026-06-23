import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Archetype, Challenge, Role, Team } from '../core/types'
import { DraftEngine, ROLES, decodeTeam } from '../core/draft'
import { analyzeTeam } from '../core/analysis/engine'
import type { ChampionDataset } from '../services/championService'

const empty = (): Team => ROLES.reduce((t, r) => ({ ...t, [r]: null }), {} as Team)

export function useTeam(dataset: ChampionDataset) {
  const engine = useMemo(() => new DraftEngine(dataset.champions), [dataset])
  const [archetype, setArchetype] = useState<Archetype>('random')
  const [challenge, setChallenge] = useState<Challenge>('none')
  const [team, setTeam] = useState<Team>(empty)
  const [revealKey, setRevealKey] = useState(0)
  const archRef = useRef(archetype); archRef.current = archetype
  const chalRef = useRef(challenge); chalRef.current = challenge

  useEffect(() => {
    const decoded = decodeTeam(dataset.byId)
    if (decoded) { setTeam(decoded.team); setArchetype(decoded.arch); setChallenge(decoded.ch) }
    else { setTeam(engine.generate('random', 'none')); setRevealKey(k => k + 1) }
  }, [engine, dataset])

  const generate = useCallback(() => {
    setTeam(engine.generate(archRef.current, chalRef.current))
    setRevealKey(k => k + 1)
  }, [engine])

  const reroll = useCallback((role: Role) => {
    setTeam(prev => ({ ...prev, [role]: engine.roll(role, archRef.current, chalRef.current, prev[role]?.id) }))
    setRevealKey(k => k + 1)
  }, [engine])

  const changeArchetype = useCallback((a: Archetype) => {
    setArchetype(a); setTeam(engine.generate(a, chalRef.current)); setRevealKey(k => k + 1)
  }, [engine])

  const changeChallenge = useCallback((c: Challenge) => {
    setChallenge(c); setTeam(engine.generate(archRef.current, c)); setRevealKey(k => k + 1)
  }, [engine])

  const analysis = useMemo(() => analyzeTeam(team, archetype), [team, archetype])

  return { team, archetype, challenge, analysis, revealKey, generate, reroll, changeArchetype, changeChallenge }
}
