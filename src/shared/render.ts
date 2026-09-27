export interface RenderBackendDef {
  id: string
  label: string
  tool: string
  sessionType: 'X11' | 'Wayland'
  description: string
}

export const RENDER_BACKENDS: RenderBackendDef[] = [
  {
    id: 'mpvpaper',
    label: 'mpvpaper',
    tool: 'mpvpaper',
    sessionType: 'Wayland',
    description: 'Rendu vidéo sur les compositors wlroots (Hyprland, Sway…)'
  },
  {
    id: 'mpv-root',
    label: 'mpv — fenêtre racine X11',
    tool: 'mpv',
    sessionType: 'X11',
    description: 'Rendu vidéo ancré sur la fenêtre racine du serveur X11'
  }
]

export interface SetWallpaperPayload {
  wallpaperId: string
  folder: string
  file: string
}

export interface SetWallpaperResult {
  ok: boolean
  error?: string
}
