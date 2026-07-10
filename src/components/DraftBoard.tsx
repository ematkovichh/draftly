import { AnimatePresence, motion } from 'framer-motion'
import type { Champion, Role, Team, TeamAnalysis } from '../core/types'
import { BAN_LIMIT, ROLE_LABEL, ROLES } from '../core/draft'
import type { ActiveDraftTurn } from '../hooks/useTeam'
import { championDataProvider } from '../data/providers/registry'
import { RoleIcon } from './RoleIcon'
import './DraftBoard.css'

interface Props {
  team: Team
  bans: Champion[]
  activeTurn: ActiveDraftTurn
  isLocked: boolean
  analysis: TeamAnalysis
  showStats: boolean
  isGeneratingStats: boolean
  onUndo: () => void
  onLock: () => void
}

function turnCopy(turn: ActiveDraftTurn): { eyebrow: string; label: string; description: string } {
  switch (turn.kind) {
    case 'ban': return { eyebrow: `Ban ${turn.number} of ${BAN_LIMIT}`, label: 'Ban Draft active', description: 'Complete the separate Ban Draft below before role picks unlock.' }
    case 'pick': return { eyebrow: `${ROLE_LABEL[turn.role]} pick`, label: `Pick a ${ROLE_LABEL[turn.role]} champion`, description: 'The champion roster is filtered to the active lane.' }
    case 'lock': return { eyebrow: 'Draft complete', label: 'Lock this composition', description: 'Review your draft stats and lock the finished composition.' }
    case 'locked': return { eyebrow: 'Composition locked', label: 'Your draft is ready', description: 'Your selected champions and bans are locked.' }
    default: return { eyebrow: 'Manual draft', label: 'Ready to draft', description: 'Choose Draft manually to start a pick / ban flow.' }
  }
}

export function DraftBoard({ team, bans, activeTurn, isLocked, analysis, showStats, isGeneratingStats, onUndo, onLock }: Props) {
  const copy = turnCopy(activeTurn)
  const pickedCount = ROLES.filter(role => team[role] !== null).length
  const hasActions = bans.length > 0 || pickedCount > 0

  return (
    <section className="draft-board" aria-labelledby="draft-board-title">
      <div className="draft-board__header">
        <div>
          <p className="eyebrow">Interactive draft</p>
          <h2 id="draft-board-title" className="draft-board__title">Manual Draft</h2>
        </div>
        <div className={`draft-turn draft-turn--${activeTurn.kind}`} aria-live="polite" aria-atomic="true">
          <span className="draft-turn__eyebrow">{copy.eyebrow}</span>
          <strong>{copy.label}</strong>
        </div>
      </div>
      <p className="draft-board__description">{copy.description}</p>

      <section className="draft-board__section draft-board__section--picks" aria-labelledby="normal-draft-title">
        <div className="draft-board__section-header">
          <div>
            <span className="draft-board__group-label">Normal draft</span>
            <h3 id="normal-draft-title">Your composition</h3>
          </div>
          <span className="draft-board__count">{pickedCount}/5 picks</span>
        </div>
        <p className="draft-board__section-copy">{activeTurn.kind === 'ban' ? 'Finish the Ban Draft below to unlock lane picks.' : 'Pick one role at a time to build your composition.'}</p>
        <ol className="draft-board__picks" aria-label="Your champion picks">
          {ROLES.map(role => {
            const champion = team[role]
            const isActive = activeTurn.kind === 'pick' && activeTurn.role === role
            return (
              <li key={role} className={`draft-slot draft-slot--pick${isActive ? ' draft-slot--active' : ''}${champion ? ' draft-slot--filled' : ''}`}>
                <AnimatePresence mode="wait" initial={false}>
                  {champion ? <SlotChampion champion={champion} status={isLocked ? 'Locked' : 'Picked'} role={role} /> : <EmptyPickSlot role={role} />}
                </AnimatePresence>
              </li>
            )
          })}
        </ol>
        <DraftInsights analysis={analysis} pickedCount={pickedCount} bans={bans.length} showStats={showStats} isGeneratingStats={isGeneratingStats} />
        {activeTurn.kind === 'lock' && <button type="button" className="draft-board__lock" onClick={onLock}>Lock composition</button>}
      </section>

      <section className="draft-board__section draft-board__section--bans" aria-labelledby="ban-draft-title">
        <div className="draft-board__section-header">
          <div>
            <span className="draft-board__group-label">Ban draft</span>
            <h3 id="ban-draft-title">Champion bans</h3>
          </div>
          <span className="draft-board__count draft-board__count--ban">{bans.length}/{BAN_LIMIT} bans</span>
        </div>
        <p className="draft-board__section-copy">Banned champions are unavailable for every pick in this manual draft.</p>
        <ol className="draft-board__bans" aria-label="Banned champions">
          {Array.from({ length: BAN_LIMIT }, (_, index) => {
            const champion = bans[index]
            const isActive = activeTurn.kind === 'ban' && index === bans.length
            return (
              <li key={index} className={`draft-slot draft-slot--ban${isActive ? ' draft-slot--active' : ''}${champion ? ' draft-slot--filled' : ''}`}>
                <AnimatePresence mode="wait" initial={false}>
                  {champion ? <SlotChampion champion={champion} status="Banned" /> : <EmptyBanSlot index={index} />}
                </AnimatePresence>
              </li>
            )
          })}
        </ol>
        {!isLocked && <div className="draft-board__actions"><button type="button" className="draft-board__undo" onClick={onUndo} disabled={!hasActions}>Undo last action</button></div>}
      </section>
    </section>
  )
}

function DraftInsights({ analysis, pickedCount, bans, showStats, isGeneratingStats }: { analysis: TeamAnalysis; pickedCount: number; bans: number; showStats: boolean; isGeneratingStats: boolean }) {
  const suggestion = analysis.suggestions[0] ?? (pickedCount < 5 ? 'Keep the remaining roles flexible until the draft is complete.' : 'Your composition is ready to lock in.')
  return (
    <section className="draft-insights" aria-labelledby="draft-insights-title">
      <div className="draft-insights__header">
        <div><span className="draft-board__group-label">Draft stats</span><h3 id="draft-insights-title">Live composition read</h3></div>
        <span className="draft-insights__status" aria-live="polite">{isGeneratingStats ? 'Calculating…' : showStats ? 'Updated' : 'Ready to generate'}</span>
      </div>
      <div className="draft-insights__stats">
        <InsightStat label="Picks" value={`${pickedCount}/5`} />
        <InsightStat label="Bans" value={`${bans}/5`} />
        <InsightStat label="Frontline" value={String(analysis.draftStats.frontline)} />
        <InsightStat label="Magic / Physical" value={`${analysis.draftStats.ap} / ${analysis.draftStats.ad}`} />
      </div>
      <p className="draft-insights__suggestion"><strong>Suggestion</strong>{showStats ? suggestion : 'Use Generate draft stats above for a two-second composition scan and tailored suggestion.'}</p>
    </section>
  )
}

function InsightStat({ label, value }: { label: string; value: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>
}

function SlotChampion({ champion, status, role }: { champion: Champion; status: 'Banned' | 'Picked' | 'Locked'; role?: Role }) {
  return (
    <motion.div key={champion.id} className="draft-slot__champion" initial={{ opacity: 0, scale: 0.84 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      <img src={championDataProvider.squareUrl(champion.id)} alt="" onError={event => { event.currentTarget.hidden = true }} />
      <span className="draft-slot__shade" />
      {role && <span className="draft-slot__role"><RoleIcon role={role} /> {ROLE_LABEL[role]}</span>}
      <span className="draft-slot__name">{champion.name}</span>
      <span className={`draft-slot__status draft-slot__status--${status.toLowerCase()}`}>{status}</span>
    </motion.div>
  )
}

function EmptyBanSlot({ index }: { index: number }) {
  return <motion.div key="empty" className="draft-slot__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span aria-hidden="true">×</span><span>Ban {index + 1}</span></motion.div>
}

function EmptyPickSlot({ role }: { role: Role }) {
  return <motion.div key="empty" className="draft-slot__empty draft-slot__empty--pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><RoleIcon role={role} /><span>{ROLE_LABEL[role]}</span></motion.div>
}
