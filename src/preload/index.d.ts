import type { SetWallpaperPayload, SetWallpaperResult } from '../shared/render'

export interface ScannedWorkshopItem {
  id: string
  folder: string
  title: string
  type: string
  preview: string | null
  sizeMb: number
}

export interface WorkshopScanResult {
  folder: string | null
  items: ScannedWorkshopItem[]
}

export interface WindowApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
}

export interface RenderBackendStatus {
  id: string
  available: boolean
}

export interface RenderDetectResult {
  sessionType: 'X11' | 'Wayland'
  desktop: 'gnome' | 'kde' | 'wlroots' | 'x11' | 'unknown'
  backends: RenderBackendStatus[]
  active: string | null
}

export interface GnomeExtensionStatus {
  installed: boolean
  enabled: boolean
  version: number | null
  error?: string
}

export interface GnomeExtensionPlaybackState {
  paused: boolean
  muted: boolean
  videoPath: string
}

export interface RenderApi {
  extensionStatus: () => Promise<GnomeExtensionStatus>
  installExtension: () => Promise<{
    ok: boolean
    error?: string
    reloginRequired?: boolean
  }>
  detect: () => Promise<RenderDetectResult>
  setActive: (backendId: string | null) => Promise<void>
  set: (payload: SetWallpaperPayload) => Promise<SetWallpaperResult>
  stop: () => Promise<void>
  install: (backendId: string) => Promise<{ ok: boolean; error?: string }>
  playbackState: () => Promise<GnomeExtensionPlaybackState>
  setPlayback: (key: 'paused' | 'mute', value: boolean) => Promise<void>
}

export interface DetectedWorkshopFolder {
  value: string
  label: string
  path: string
}

export interface WorkshopApi {
  getFolder: () => Promise<{ folder: string | null }>
  setFolder: (folder: string | null) => Promise<string | null>
  pickFolder: () => Promise<string | null>
  scan: () => Promise<WorkshopScanResult>
  detectFolders: () => Promise<DetectedWorkshopFolder[]>
  openSteamStore: () => void
}

export interface TestApi {
  ping: () => string
}

export interface Api {
  window: WindowApi
  render: RenderApi
  workshop: WorkshopApi
  test: TestApi
}

declare global {
  interface Window {
    api: Api
  }
}

export {}
