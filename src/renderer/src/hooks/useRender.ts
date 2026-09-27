import { useCallback, useEffect, useState } from 'react'
import type { GnomeExtensionStatus, RenderDetectResult } from '../../../preload/index'

export type RenderState = RenderDetectResult

export function useRender() {
  const [state, setState] = useState<RenderState | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [extension, setExtension] = useState<GnomeExtensionStatus | null>(null)
  const [installingExtension, setInstallingExtension] = useState(false)

  const fetchExtension = useCallback(async (): Promise<GnomeExtensionStatus | null> => {
    try {
      return await window.api.render.extensionStatus()
    } catch {
      return null
    }
  }, [])

  const installExtension = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    setInstallingExtension(true)
    try {
      const result = await window.api.render.installExtension()
      setExtension(await fetchExtension())
      return result
    } finally {
      setInstallingExtension(false)
    }
  }, [fetchExtension])

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
    }): Promise<{ ok: boolean; error?: string }> => {
      return window.api.render.set({
        wallpaperId: payload.wallpaperId,
        folder: payload.folder,
        file: ''
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

  return {
    state,
    detecting,
    detect,
    setActive,
    set,
    stop,
    install,
    extension,
    installingExtension,
    installExtension
  }
}
