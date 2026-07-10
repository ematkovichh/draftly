import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Champion, Role, Team } from '../core/types'
import { ROLE_LABEL, ROLES } from '../core/draft'
import type { ActiveDraftTurn } from '../hooks/useTeam'
import { championDataProvider } from '../data/providers/registry'
import './ChampionRoster.css'

type RoleFilter = Role | 'all'

interface Props {
  champions: Champion[]
  team: Team
  bans: Champion[]
  activeTurn: ActiveDraftTurn
  isLocked: boolean
  selectedIds: Set<string>
  onSelect: (champion: Champion) => void
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base' })

export function ChampionRoster({ champions, team, bans, activeTurn, isLocked, selectedIds, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase())
  const bannedIds = useMemo(() => new Set(bans.map(champion => champion.id)), [bans])
  const pickedIds = useMemo(() => new Set(Object.values(team).flatMap(champion => champion ? [champion.id] : [])), [team])

  useEffect(() => {
    setRoleFilter(activeTurn.kind === 'pick' ? activeTurn.role : 'all')
  }, [activeTurn])

  const filteredChampions = useMemo(() => champions
    .filter(champion => roleFilter === 'all' || champion.roles.includes(roleFilter))
    .filter(champion => !deferredQuery || [champion.name, champion.title, champion.id].some(value => value.toLocaleLowerCase().includes(deferredQuery)))
    .sort((a, b) => collator.compare(a.name, b.name)), [champions, deferredQuery, roleFilter])

  const instruction = activeTurn.kind === 'ban'
    ? `Ban ${activeTurn.number} of 5: choose any available champion.`
    : activeTurn.kind === 'pick'
      ? `Pick ${ROLE_LABEL[activeTurn.role]}: champions outside this lane are unavailable.`
      : 'Complete the board to continue.'

  return (
    <section className="roster" aria-labelledby="roster-title">
      <div className="roster__header">
        <div>
          <p className="eyebrow">Champion roster</p>
          <h2 id="roster-title" className="roster__title">Choose a champion <span>({filteredChampions.length})</span></h2>
        </div>
        <div className="roster__tools">
          <label className="roster__search">
            <span className="sr-only">Search champions</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search champions" type="search" autoComplete="off" />
          </label>
          <label className="roster__role-select">
            <span>Lane</span>
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as RoleFilter)}>
              <option value="all">All lanes</option>
              {ROLES.map(role => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="roster__filters" role="group" aria-label="Filter champions by role">
        <button type="button" aria-pressed={roleFilter === 'all'} className={roleFilter === 'all' ? 'roster-filter roster-filter--active' : 'roster-filter'} onClick={() => setRoleFilter('all')}>All</button>
        {ROLES.map(role => <button key={role} type="button" aria-pressed={roleFilter === role} className={roleFilter === role ? 'roster-filter roster-filter--active' : 'roster-filter'} onClick={() => setRoleFilter(role)}>{ROLE_LABEL[role]}</button>)}
      </div>

      <p className="roster__instruction" aria-live="polite">{instruction}</p>
      {filteredChampions.length ? (
        <div className="roster__grid" aria-label="Champion choices">
          {filteredChampions.map(champion => {
            const state = championState(champion, activeTurn, bannedIds, pickedIds, isLocked)
            const selectable = state === 'available'
            const action = activeTurn.kind === 'ban' ? 'Ban' : activeTurn.kind === 'pick' ? `Pick for ${ROLE_LABEL[activeTurn.role]}` : 'Select'
            return (
              <motion.button
                layout="position"
                type="button"
                key={champion.id}
                className={`roster-card roster-card--${state}`}
                onClick={() => onSelect(champion)}
                disabled={!selectable || selectedIds.has(champion.id)}
                aria-label={`${champion.name}: ${state === 'available' ? action : state}`}
                title={state === 'available' ? `${action} ${champion.name}` : `${champion.name} is ${state}`}
                whileHover={selectable ? { y: -2 } : undefined}
                whileTap={selectable ? { scale: .97 } : undefined}
              >
                <img src={championDataProvider.squareUrl(champion.id)} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true }} />
                <span className="roster-card__shade" />
                <span className="roster-card__name">{champion.name}</span>
                <span className="roster-card__roles">{champion.roles.map(role => ROLE_LABEL[role]).join(' · ')}</span>
                {state !== 'available' && <span className="roster-card__state">{state}</span>}
              </motion.button>
            )
          })}
        </div>
      ) : <p className="roster__empty" role="status">No champions match that search and lane filter.</p>}
    </section>
  )
}

function championState(champion: Champion, activeTurn: ActiveDraftTurn, bannedIds: Set<string>, pickedIds: Set<string>, isLocked: boolean) {
  if (bannedIds.has(champion.id)) return 'banned'
  if (pickedIds.has(champion.id)) return isLocked ? 'locked' : 'picked'
  if (activeTurn.kind === 'pick' && !champion.roles.includes(activeTurn.role)) return 'unavailable'
  return 'available'
}
