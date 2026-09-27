import { useCallback, useEffect, useState } from 'react'
import type { RenderDetectResult } from '../../../preload/index'

export type RenderState = RenderDetectResult

export function useRender() {
  const [state, setState] = useState<RenderState | null>(null)
  const [detecting, setDetecting] = useState(false)

  const fetchState = useCallback(async (): Promise<RenderState> => {
    return window.api.render.detect()
  }, [])

  const detect = useCallback(async (): Promise<void> => {
    setDetecting(true)
    try {
      setState(await fetchState())
    } finally {
      setDetecting(false)
    }
  }, [fetchState])

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      const result = await fetchState()
      if (!cancelled) setState(result)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [fetchState])

  const setActive = useCallback(async (backendId: string | null): Promise<void> => {
    await window.api.render.setActive(backendId)
    setState((prev) =>
      prev ? { ...prev, active: backendId } : { sessionType: 'X11', backends: [], active: backendId }
    )
  }, [])

  const set = useCallback(
    async (payload: { wallpaperId: string; folder: string }): Promise<{ ok: boolean; error?: string }> => {
      return window.api.render.set({ wallpaperId: payload.wallpaperId, folder: payload.folder, file: '' })
    },
    []
  )

  const stop = useCallback(async (): Promise<void> => {
    await window.api.render.stop()
  }, [])

  return { state, detecting, detect, setActive, set, stop }
}
