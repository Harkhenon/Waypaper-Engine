import { useCallback, useEffect, useState } from 'react'
import type {
  GnomeExtensionPlaybackState,
  GnomeExtensionStatus,
  RenderDetectResult
} from '../../../preload/index'

export type RenderState = RenderDetectResult

export function useRender() {
  const [state, setState] = useState<RenderState | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [extension, setExtension] = useState<GnomeExtensionStatus | null>(null)
  const [installingExtension, setInstallingExtension] = useState(false)
  const [playback, setPlayback] = useState<GnomeExtensionPlaybackState | null>(null)

  const fetchPlayback = useCallback(async (): Promise<GnomeExtensionPlaybackState | null> => {
    try {
      return await window.api.render.playbackState()
    } catch {
      return null
    }
  }, [])

  const refreshPlayback = useCallback(async (): Promise<void> => {
    setPlayback(await fetchPlayback())
  }, [fetchPlayback])

  const setPaused = useCallback(
    async (paused: boolean): Promise<void> => {
      await window.api.render.setPlayback('paused', paused)
      await refreshPlayback()
    },
    [refreshPlayback]
  )

  const setMuted = useCallback(
    async (muted: boolean): Promise<void> => {
      await window.api.render.setPlayback('mute', muted)
      await refreshPlayback()
    },
    [refreshPlayback]
  )

  const setLoop = useCallback(
    async (loop: boolean): Promise<void> => {
      await window.api.render.setPlayback('loop', loop)
      await refreshPlayback()
    },
    [refreshPlayback]
  )

  const fetchExtension = useCallback(async (): Promise<GnomeExtensionStatus | null> => {
    try {
      return await window.api.render.extensionStatus()
    } catch {
      return null
    }
  }, [])

  const installExtension = useCallback(async (): Promise<{
    ok: boolean
    error?: string
    reloginRequired?: boolean
  }> => {
    setInstallingExtension(true)
    try {
      const result = await window.api.render.installExtension()
      setExtension(await fetchExtension())
      return result
    } finally {
      setInstallingExtension(false)
    }
  }, [fetchExtension])

  const [detectError, setDetectError] = useState<string | null>(null)

  const fetchState = useCallback(async (): Promise<RenderState> => {
    try {
      return await window.api.render.detect()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err), { cause: err })
    }
  }, [])

  const detect = useCallback(async (): Promise<void> => {
    setDetecting(true)
    setDetectError(null)
    try {
      setState(await fetchState())
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : String(err))
    } finally {
      setDetecting(false)
    }
  }, [fetchState])

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      try {
        const result = await fetchState()
        if (!cancelled) setState(result)
      } catch (err) {
        if (!cancelled) setDetectError(err instanceof Error ? err.message : String(err))
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [fetchState])

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      const result = await fetchExtension()
      if (!cancelled) setExtension(result)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [fetchExtension])

  const setActive = useCallback(async (backendId: string | null): Promise<void> => {
    await window.api.render.setActive(backendId)
    setState((prev) =>
      prev
        ? { ...prev, active: backendId }
        : { sessionType: 'X11', desktop: 'unknown', backends: [], active: backendId }
    )
  }, [])

  const set = useCallback(
    async (payload: {
      wallpaperId: string
      folder: string
      monitorIndex?: number | null
    }): Promise<{ ok: boolean; error?: string }> => {
      return window.api.render.set({
        wallpaperId: payload.wallpaperId,
        folder: payload.folder,
        monitorIndex: payload.monitorIndex ?? null
      })
    },
    []
  )

  const stop = useCallback(async (): Promise<void> => {
    await window.api.render.stop()
  }, [])

  const install = useCallback(
    async (backendId: string): Promise<{ ok: boolean; error?: string }> => {
      const result = await window.api.render.install(backendId)
      if (result.ok) {
        setState(await fetchState())
      }
      return result
    },
    [fetchState]
  )

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      const result = await fetchPlayback()
      if (!cancelled) setPlayback(result)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [fetchPlayback])

  return {
    state,
    detecting,
    detectError,
    detect,
    setActive,
    set,
    stop,
    install,
    extension,
    installingExtension,
    installExtension,
    playback,
    refreshPlayback,
    setPaused,
    setMuted,
    setLoop
  }
}
