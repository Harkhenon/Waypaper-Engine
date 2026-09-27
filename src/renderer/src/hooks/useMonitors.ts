import { useCallback, useEffect, useState } from 'react'
import type { ExtensionMonitorInfo } from '../../../preload/index'

const RETRY_EMPTY_MS = 5000

async function fetchMonitors(): Promise<ExtensionMonitorInfo[]> {
  try {
    return await window.api.render.monitors()
  } catch {
    return []
  }
}

export function useMonitors() {
  const [monitors, setMonitors] = useState<ExtensionMonitorInfo[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await fetchMonitors()
      setMonitors(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const retryRef = { id: null as ReturnType<typeof setTimeout> | null }

    const run = async (): Promise<void> => {
      const result = await fetchMonitors()
      if (cancelled) return
      setMonitors(result)
      // L'extension peut publier la liste après le lancement de l'app
      // (installation, reconnexion) : on retente tant que c'est vide.
      if (result.length === 0) {
        retryRef.id = setTimeout(() => void run(), RETRY_EMPTY_MS)
      }
    }

    void run()
    return () => {
      cancelled = true
      if (retryRef.id) clearTimeout(retryRef.id)
    }
  }, [])

  return { monitors, loading, refresh }
}
