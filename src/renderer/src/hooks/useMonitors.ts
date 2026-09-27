import { useCallback, useEffect, useState } from 'react'
import type { ExtensionMonitorInfo } from '../../../preload/index'

export function useMonitors() {
  const [monitors, setMonitors] = useState<ExtensionMonitorInfo[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      setMonitors(await window.api.render.monitors())
    } catch {
      setMonitors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      const result = await window.api.render.monitors()
      if (!cancelled) setMonitors(result)
    }
    void run().catch(() => setMonitors([]))
    return () => {
      cancelled = true
    }
  }, [])

  return { monitors, loading, refresh }
}
