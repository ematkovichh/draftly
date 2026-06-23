import { Header } from './components/Header'
import { Controls } from './components/Controls'
import { TeamGrid } from './components/TeamGrid'
import { TeamAnalysis } from './components/TeamAnalysis'
import { Footer } from './components/Footer'
import { LoadingScreen, ErrorScreen } from './components/StatusScreen'
import { useChampions } from './hooks/useChampions'
import { useTeam } from './hooks/useTeam'
import type { ChampionDataset } from './services/championService'
import './styles/index.css'

function Forge({ dataset }: { dataset: ChampionDataset }) {
  const { team, archetype, challenge, analysis, revealKey, generate, reroll, changeArchetype, changeChallenge } = useTeam(dataset)
  const hasFilled = Object.values(team).some(c => c !== null)
  return (
    <>
      <Header info={dataset.info} />
      <div className="hex-rule" style={{ margin: '0 0 4px' }} />
      <Controls
        archetype={archetype} challenge={challenge} team={team}
        onGenerate={generate} onArchetype={changeArchetype} onChallenge={changeChallenge}
      />
      <TeamGrid team={team} onReroll={reroll} isGenerating={false} revealKey={revealKey} />
      {hasFilled && <TeamAnalysis analysis={analysis} />}
      <Footer />
    </>
  )
}

export default function App() {
  const { data, loading, error } = useChampions()
  return (
    <div className="app">
      {loading && <><Header /><LoadingScreen /></>}
      {error && <><Header /><ErrorScreen message={error} /></>}
      {data && <Forge dataset={data} />}
    </div>
  )
}
