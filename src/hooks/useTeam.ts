import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Archetype, Challenge, Champion, Role, Team } from '../core/types'
import { BAN_LIMIT, DraftEngine, ROLES } from '../core/draft'
import { analyzeTeam } from '../core/analysis/engine'
import type { ChampionDataset } from '../services/championService'
import { decodeFromUrl } from '../utils/share'

const empty = (): Team => ROLES.reduce((t, r) => ({ ...t, [r]: null }), {} as Team)
const emptyRevealKeys = (): Record<Role, number> => ROLES.reduce((keys, role) => ({ ...keys, [role]: 0 }), {} as Record<Role, number>)
const rerollHistoryFor = (team: Team): Record<Role, Set<string>> => ROLES.reduce((history, role) => {
  const champion = team[role]
  history[role] = new Set(champion ? [champion.id] : [])
  return history
}, {} as Record<Role, Set<string>>)
const advanceAllRevealKeys = (current: Record<Role, number>): Record<Role, number> => {
  const nextKey = Math.max(...ROLES.map(role => current[role])) + 1
  return ROLES.reduce((next, role) => ({ ...next, [role]: nextKey }), {} as Record<Role, number>)
}

export type ActiveDraftTurn =
  | { kind: 'idle' }
  | { kind: 'ban'; number: number }
  | { kind: 'pick'; role: Role }
  | { kind: 'lock' }
  | { kind: 'locked' }

export function useTeam(dataset: ChampionDataset) {
  const engine = useMemo(() => new DraftEngine(dataset.champions), [dataset])
  const [archetype, setArchetype] = useState<Archetype>('random')
  const [challenge, setChallenge] = useState<Challenge>('none')
  const [team, setTeam] = useState<Team>(empty)
  const [bans, setBans] = useState<Champion[]>([])
  const [isManualDraft, setIsManualDraft] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [revealKeys, setRevealKeys] = useState<Record<Role, number>>(emptyRevealKeys)
  const archRef = useRef(archetype); archRef.current = archetype
  const chalRef = useRef(challenge); chalRef.current = challenge
  const rerollHistoryRef = useRef<Record<Role, Set<string>>>(rerollHistoryFor(empty()))

  useEffect(() => {
    const decoded = decodeFromUrl(dataset.byId)
    setBans([])
    setIsManualDraft(false)
    setIsLocked(false)
    const nextTeam = decoded?.team ?? engine.generate('random', 'none')
    if (decoded) {
      setArchetype(decoded.archetype)
      setChallenge(decoded.challenge)
    }
    setTeam(nextTeam)
    rerollHistoryRef.current = rerollHistoryFor(nextTeam)
    setRevealKeys(advanceAllRevealKeys)
  }, [engine, dataset])

  const generate = useCallback(() => {
    const nextTeam = engine.generate(archRef.current, chalRef.current)
    setTeam(nextTeam)
    rerollHistoryRef.current = rerollHistoryFor(nextTeam)
    setBans([])
    setIsManualDraft(false)
    setIsLocked(false)
    setRevealKeys(advanceAllRevealKeys)
  }, [engine])

  const reroll = useCallback((role: Role) => {
    if (isManualDraft) return
    const teammateIds = ROLES
      .filter(otherRole => otherRole !== role)
      .map(otherRole => team[otherRole]?.id)
      .filter((id): id is string => Boolean(id))
    const nextChampion = engine.reroll(role, chalRef.current, team[role], teammateIds, rerollHistoryRef.current[role])
    setTeam(current => ({ ...current, [role]: nextChampion }))
    rerollHistoryRef.current[role].add(nextChampion.id)
    setRevealKeys(current => ({ ...current, [role]: current[role] + 1 }))
  }, [engine, isManualDraft, team])

  const changeArchetype = useCallback((a: Archetype) => {
    const nextTeam = engine.generate(a, chalRef.current)
    setArchetype(a); setTeam(nextTeam); rerollHistoryRef.current = rerollHistoryFor(nextTeam); setBans([]); setIsManualDraft(false); setIsLocked(false); setRevealKeys(advanceAllRevealKeys)
  }, [engine])

  const changeChallenge = useCallback((c: Challenge) => {
    const nextTeam = engine.generate(archRef.current, c)
    setChallenge(c); setTeam(nextTeam); rerollHistoryRef.current = rerollHistoryFor(nextTeam); setBans([]); setIsManualDraft(false); setIsLocked(false); setRevealKeys(advanceAllRevealKeys)
  }, [engine])

  const startManualDraft = useCallback(() => {
    setTeam(empty())
    rerollHistoryRef.current = rerollHistoryFor(empty())
    setBans([])
    setIsManualDraft(true)
    setIsLocked(false)
    setRevealKeys(advanceAllRevealKeys)
  }, [])

  const selectedIds = useMemo(() => new Set([
    ...bans.map(champion => champion.id),
    ...ROLES.map(role => team[role]?.id).filter((id): id is string => Boolean(id)),
  ]), [bans, team])

  const activeTurn = useMemo<ActiveDraftTurn>(() => {
    if (!isManualDraft) return { kind: 'idle' }
    if (isLocked) return { kind: 'locked' }
    if (bans.length < BAN_LIMIT) return { kind: 'ban', number: bans.length + 1 }
    const role = ROLES.find(candidate => team[candidate] === null)
    return role ? { kind: 'pick', role } : { kind: 'lock' }
  }, [bans.length, isLocked, isManualDraft, team])

  const selectChampion = useCallback((champion: Champion) => {
    if (!isManualDraft || isLocked || selectedIds.has(champion.id)) return
    if (bans.length < BAN_LIMIT) {
      setBans(current => current.length < BAN_LIMIT ? [...current, champion] : current)
      return
    }
    const role = ROLES.find(candidate => team[candidate] === null)
    if (!role || !champion.roles.includes(role)) return
    setTeam(current => ({ ...current, [role]: champion }))
  }, [bans.length, isLocked, isManualDraft, selectedIds, team])

  const undoDraftAction = useCallback(() => {
    if (!isManualDraft || isLocked) return
    const latestRole = [...ROLES].reverse().find(role => team[role] !== null)
    if (latestRole) {
      setTeam(current => ({ ...current, [latestRole]: null }))
    } else {
      setBans(current => current.slice(0, -1))
    }
  }, [isLocked, isManualDraft, team])

  const lockDraft = useCallback(() => {
    if (isManualDraft && bans.length === BAN_LIMIT && ROLES.every(role => team[role] !== null)) {
      setIsLocked(true)
      setRevealKeys(advanceAllRevealKeys)
    }
  }, [bans.length, isManualDraft, team])

  const analysis = useMemo(() => analyzeTeam(team, archetype), [team, archetype])
  const isComplete = ROLES.every(role => team[role] !== null)

  return {
    team, bans, archetype, challenge, analysis, revealKeys, isManualDraft, isLocked,
    isComplete, activeTurn, selectedIds, generate, reroll, changeArchetype, changeChallenge,
    startManualDraft, selectChampion, undoDraftAction, lockDraft,
  }
}
