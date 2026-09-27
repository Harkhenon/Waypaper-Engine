export const DISPLAY_BACKENDS = ['x11', 'wlroots', 'kde'] as const

export type DisplayBackend = (typeof DISPLAY_BACKENDS)[number]

export interface DisplayBackendMeta {
  value: DisplayBackend
  label: string
  sessionType: 'X11' | 'Wayland'
}

export const DISPLAY_BACKEND_META: Record<DisplayBackend, DisplayBackendMeta> = {
  x11: { value: 'x11', label: 'X11', sessionType: 'X11' },
  wlroots: { value: 'wlroots', label: 'wlroots (Sway, Hyprland…)', sessionType: 'Wayland' },
  kde: { value: 'kde', label: 'KDE Plasma', sessionType: 'Wayland' }
}

export interface Monitor {
  id: string
  name: string
  width: number
  height: number
  refreshRate: number
  scale: number
}

export type PlaybackStatus = 'idle' | 'starting' | 'running' | 'paused' | 'stopped' | 'error'

export interface PlaybackState {
  monitorId: string
  wallpaperId: string
  status: PlaybackStatus
  fps: number
  pausedAt?: string
}
