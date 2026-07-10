import { Header } from './components/Header'
import { Controls } from './components/Controls'
import { TeamGrid } from './components/TeamGrid'
import { TeamAnalysis } from './components/TeamAnalysis'
import { Footer } from './components/Footer'
import { DraftBoard } from './components/DraftBoard'
import { ChampionRoster } from './components/ChampionRoster'
import { LoadingScreen, ErrorScreen } from './components/StatusScreen'
import { useChampions } from './hooks/useChampions'
import { useTeam } from './hooks/useTeam'
import type { ChampionDataset } from './services/championService'
import { MotionConfig } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { StatsProgress } from './components/StatsProgress'
import './styles/index.css'

function Forge({ dataset }: { dataset: ChampionDataset }) {
  const {
    team, bans, archetype, challenge, analysis, revealKeys, isManualDraft, isLocked,
    isComplete, activeTurn, selectedIds, generate, reroll, changeArchetype, changeChallenge,
    startManualDraft, selectChampion, undoDraftAction, lockDraft,
  } = useTeam(dataset)
  const [showStats, setShowStats] = useState(false)
  const [isGeneratingStats, setIsGeneratingStats] = useState(false)
  const statsTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (statsTimer.current !== null) window.clearTimeout(statsTimer.current)
  }, [])

  useEffect(() => {
    if (statsTimer.current !== null) window.clearTimeout(statsTimer.current)
    setShowStats(false)
    setIsGeneratingStats(false)
  }, [team])

  function generateStats() {
    if (!isComplete && !isManualDraft) return
    if (statsTimer.current !== null) window.clearTimeout(statsTimer.current)
    setShowStats(false)
    setIsGeneratingStats(true)
    statsTimer.current = window.setTimeout(() => {
      setIsGeneratingStats(false)
      setShowStats(true)
      statsTimer.current = null
    }, 2000)
  }

  return (
    <>
      <Header info={dataset.info} />
      <div className="hex-rule" style={{ margin: '0 0 4px' }} />
      <Controls
        archetype={archetype} challenge={challenge} team={team}
        isComplete={isComplete} isManualDraft={isManualDraft}
        hasStats={showStats} isGeneratingStats={isGeneratingStats}
        onGenerate={generate} onStartDraft={startManualDraft} onGenerateStats={generateStats}
        onArchetype={changeArchetype} onChallenge={changeChallenge}
      />
      {isManualDraft && (
        <>
          <DraftBoard
            team={team} bans={bans} activeTurn={activeTurn} isLocked={isLocked}
            analysis={analysis} showStats={showStats} isGeneratingStats={isGeneratingStats}
            onUndo={undoDraftAction} onLock={lockDraft}
          />
          {!isLocked && (
            <ChampionRoster
              champions={dataset.champions} team={team} bans={bans} activeTurn={activeTurn}
              isLocked={isLocked} selectedIds={selectedIds}
              onSelect={selectChampion}
            />
          )}
        </>
      )}
      {(!isManualDraft || isLocked) && <TeamGrid team={team} onReroll={reroll} canReroll={!isManualDraft} revealKeys={revealKeys} />}
      {isGeneratingStats && !isManualDraft && <StatsProgress />}
      {isComplete && !showStats && !isGeneratingStats && !isManualDraft && <p className="stats-callout" role="status">Generate team stats to see composition details and counter-readiness signals.</p>}
      {showStats && (!isManualDraft || isLocked) && <TeamAnalysis analysis={analysis} onClose={() => setShowStats(false)} />}
      <Footer />
    </>
  )
}

export default function App() {
  const { data, loading, error } = useChampions()
  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        {loading && <><Header /><LoadingScreen /></>}
        {error && <><Header /><ErrorScreen message={error} /></>}
        {data && <Forge dataset={data} />}
      </div>
    </MotionConfig>
  )
}
