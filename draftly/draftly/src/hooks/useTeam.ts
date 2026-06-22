import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Archetype, Challenge, Role, Team } from '../core/types'
import { DraftEngine, ROLES } from '../core/draft'
import { analyzeTeam } from '../core/analysis/engine'
import { decodeFromUrl, syncUrl } from '../utils/share'
import type { ChampionDataset } from '../services/championService'

const emptyTeam = (): Team =>
  ROLES.reduce((acc, r) => ({ ...acc, [r]: null }), {} as Team)

export function useTeam(dataset: ChampionDataset) {
  const engine = useMemo(() => new DraftEngine(dataset.champions), [dataset])

  const [archetype, setArchetype] = useState<Archetype>('random')
  const [challenge, setChallenge] = useState<Challenge>('none')
  const [team, setTeam] = useState<Team>(emptyTeam)
  const [lastRolled, setLastRolled] = useState<Role[]>(ROLES)

  const archetypeRef = useRef(archetype)
  const challengeRef = useRef(challenge)
  archetypeRef.current = archetype
  challengeRef.current = challenge

  useEffect(() => {
    const shared = decodeFromUrl(dataset.byId)
    if (shared) {
      setTeam(shared.team)
      setArchetype(shared.archetype)
      setChallenge(shared.challenge)
    } else {
      setTeam(engine.generateTeam('random', 'none'))
    }
    setLastRolled(ROLES)
  }, [engine, dataset])

  useEffect(() => {
    if (ROLES.some((r) => team[r] !== null)) syncUrl(team, archetype, challenge)
  }, [team, archetype, challenge])

  const generate = useCallback(() => {
    setTeam(engine.generateTeam(archetypeRef.current, challengeRef.current))
    setLastRolled(ROLES)
  }, [engine])

  const reroll = useCallback(
    (role: Role) => {
      setTeam((prev) => ({
        ...prev,
        [role]: engine.rollRole(
          role,
          archetypeRef.current,
          challengeRef.current,
          prev[role]?.id,
        ),
      }))
      setLastRolled([role])
    },
    [engine],
  )

  const changeArchetype = useCallback(
    (a: Archetype) => {
      setArchetype(a)
      setTeam(engine.generateTeam(a, challengeRef.current))
      setLastRolled(ROLES)
    },
    [engine],
  )

  const changeChallenge = useCallback(
    (c: Challenge) => {
      setChallenge(c)
      setTeam(engine.generateTeam(archetypeRef.current, c))
      setLastRolled(ROLES)
    },
    [engine],
  )

  const analysis = useMemo(() => analyzeTeam(team, archetype), [team, archetype])

  return {
    team,
    archetype,
    challenge,
    analysis,
    lastRolled,
    generate,
    reroll,
    changeArchetype,
    changeChallenge,
  }
}
