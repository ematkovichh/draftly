import { useEffect, useState } from 'react'
import { loadChampions, type ChampionDataset } from '../services/championService'

export function useChampions() {
  const [data, setData] = useState<ChampionDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadChampions()
      .then(d => { if (active) { setData(d); setLoading(false) } })
      .catch((e: unknown) => { if (active) { setError(e instanceof Error ? e.message : 'Failed to load'); setLoading(false) } })
    return () => { active = false }
  }, [])

  return { data, loading, error }
}
