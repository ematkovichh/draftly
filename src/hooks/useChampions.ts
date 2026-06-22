import { useEffect, useState } from 'react'
import { loadChampions, type ChampionDataset } from '../services/championService'

interface State {
  data: ChampionDataset | null
  loading: boolean
  error: string | null
}

/** Loads the live champion dataset from the configured providers. */
export function useChampions(): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true
    loadChampions()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error:
              err instanceof Error ? err.message : 'Failed to load champion data',
          })
      })
    return () => {
      active = false
    }
  }, [])

  return state
}
