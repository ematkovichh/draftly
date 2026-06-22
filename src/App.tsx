import { Header } from './components/Header'
import { DataBar } from './components/DataBar'
import { Controls } from './components/Controls'
import { TeamGrid } from './components/TeamGrid'
import { TeamAnalysis } from './components/TeamAnalysis'
import { Footer } from './components/Footer'
import { LoadingScreen, ErrorScreen } from './components/StatusScreen'
import { useChampions } from './hooks/useChampions'
import { useTeam } from './hooks/useTeam'
import type { ChampionDataset } from './services/championService'

function Draft({ dataset }: { dataset: ChampionDataset }) {
  const {
    team,
    archetype,
    challenge,
    analysis,
    generate,
    reroll,
    changeArchetype,
    changeChallenge,
  } = useTeam(dataset)

  return (
    <>
      <DataBar info={dataset.info} />
      <Controls
        archetype={archetype}
        challenge={challenge}
        team={team}
        onGenerate={generate}
        onArchetype={changeArchetype}
        onChallenge={changeChallenge}
      />
      <TeamGrid team={team} onReroll={reroll} />
      <TeamAnalysis analysis={analysis} />
    </>
  )
}

export default function App() {
  const { data, loading, error } = useChampions()

  return (
    <div className="app">
      <Header />
      {loading && <LoadingScreen />}
      {error && <ErrorScreen message={error} />}
      {data && <Draft dataset={data} />}
      <Footer />
    </div>
  )
}
