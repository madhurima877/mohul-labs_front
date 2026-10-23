import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

// useFetch loads a GET endpoint and returns { data, error, loading, reload }. Pass null to skip.
export function useFetch(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) })

  const load = useCallback(async () => {
    if (!path) {
      setState({ data: null, error: null, loading: false })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      setState({ data: await api.get(path), error: null, loading: false })
    } catch (error) {
      setState({ data: null, error, loading: false })
    }
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
