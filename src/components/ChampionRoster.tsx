import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Champion, Role, Team } from '../core/types'
import { ROLE_LABEL, ROLES } from '../core/draft'
import type { ActiveDraftTurn } from '../hooks/useTeam'
import { championDataProvider } from '../data/providers/registry'
import { RoleIcon } from './RoleIcon'
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
  const [isOpen, setIsOpen] = useState(true)
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
  const roleLocked = activeTurn.kind === 'pick'

  return (
    <section className={`roster${isOpen ? ' roster--open' : ' roster--closed'}`} aria-labelledby="roster-title">
      <div className="roster__header">
        <div>
          <p className="eyebrow">Champion roster</p>
          <h2 id="roster-title" className="roster__title">
            {activeTurn.kind === 'pick' ? `Choose your ${ROLE_LABEL[activeTurn.role]}` : 'Choose a champion'}
            <span>({filteredChampions.length})</span>
          </h2>
        </div>
        <button type="button" className="roster__toggle" aria-expanded={isOpen} aria-controls="champion-roster-content" onClick={() => setIsOpen(open => !open)}>
          <span className="roster__toggle-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
          {isOpen ? 'Hide roster' : 'Show roster'}
        </button>
      </div>

      <AnimatePresence initial={false}>
      {isOpen && <motion.div
        id="champion-roster-content"
        className="roster__content"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: .22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="roster__toolbar">
          {activeTurn.kind === 'pick' && (
            <div className="roster__active-role" aria-label={`Active role: ${ROLE_LABEL[activeTurn.role]}`}>
              <RoleIcon role={activeTurn.role} />
              <span><small>Picking now</small><strong>{ROLE_LABEL[activeTurn.role]}</strong></span>
            </div>
          )}
          <label className="roster__search">
            <span className="sr-only">Search champions</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${activeTurn.kind === 'pick' ? ROLE_LABEL[activeTurn.role].toLowerCase() : ''} champions`} type="search" autoComplete="off" tabIndex={isOpen ? 0 : -1} />
          </label>
          <label className="roster__role-select">
            <span>Lane</span>
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as RoleFilter)} disabled={roleLocked} tabIndex={isOpen ? 0 : -1}>
              <option value="all">All lanes</option>
              {ROLES.map(role => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
            </select>
          </label>
        </div>

        <div className="roster__filters" role="group" aria-label="Filter champions by role">
          <button type="button" disabled={roleLocked} aria-pressed={roleFilter === 'all'} className={roleFilter === 'all' ? 'roster-filter roster-filter--active' : 'roster-filter'} onClick={() => setRoleFilter('all')}>All</button>
          {ROLES.map(role => <button key={role} type="button" disabled={activeTurn.kind === 'pick' && role !== activeTurn.role} aria-pressed={roleFilter === role} className={roleFilter === role ? 'roster-filter roster-filter--active' : 'roster-filter'} onClick={() => setRoleFilter(role)}>{ROLE_LABEL[role]}</button>)}
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
                  tabIndex={isOpen ? 0 : -1}
                  aria-label={`${champion.name}: ${state === 'available' ? action : state}`}
                  title={state === 'available' ? `${action} ${champion.name}` : `${champion.name} is ${state}`}
                  whileHover={selectable ? { y: -3, scale: 1.015 } : undefined}
                  whileTap={selectable ? { scale: .97 } : undefined}
                >
                  <img src={championDataProvider.squareUrl(champion.id)} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true }} />
                  <span className="roster-card__shade" />
                  <span className={`roster-card__damage roster-card__damage--${champion.damageType.toLowerCase()}`}>{champion.damageType}</span>
                  <span className="roster-card__name">{champion.name}</span>
                  <span className="roster-card__class">{champion.classes.join(' · ')}</span>
                  <span className="roster-card__roles">{champion.roles.map(role => ROLE_LABEL[role]).join(' · ')}</span>
                  {state !== 'available' && <span className="roster-card__state">{state}</span>}
                </motion.button>
              )
            })}
          </div>
        ) : <p className="roster__empty" role="status">No champions match that search and lane filter.</p>}
      </motion.div>}
      </AnimatePresence>
    </section>
  )
}

function championState(champion: Champion, activeTurn: ActiveDraftTurn, bannedIds: Set<string>, pickedIds: Set<string>, isLocked: boolean) {
  if (bannedIds.has(champion.id)) return 'banned'
  if (pickedIds.has(champion.id)) return isLocked ? 'locked' : 'picked'
  if (activeTurn.kind === 'pick' && !champion.roles.includes(activeTurn.role)) return 'unavailable'
  return 'available'
}
