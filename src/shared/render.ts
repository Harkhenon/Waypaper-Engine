export interface RenderBackendDef {
  id: string
  label: string
  tool: string | null
  sessionType: 'X11' | 'Wayland' | 'any'
  description: string
  installCommand: string | null
  installLabel: string | null
  instructionsUrl: string | null
}

export const RENDER_BACKENDS: RenderBackendDef[] = [
  {
    id: 'gnome-static',
    label: 'GNOME — fond statique',
    tool: 'gsettings',
    sessionType: 'any',
    description: 'Applique l\'aperçu du wallpaper comme fond d\'écran GNOME (image fixe, rien à installer)',
    installCommand: null,
    installLabel: null,
    instructionsUrl: null
  },
  {
    id: 'mpv-root',
    label: 'mpv — fenêtre racine X11',
    tool: 'mpv',
    sessionType: 'X11',
    description: 'Rendu vidéo ancré sur la fenêtre racine du serveur X11',
    installCommand: 'apt-get install -y mpv',
    installLabel: 'Installer mpv',
    instructionsUrl: null
  },
  {
    id: 'mpvpaper',
    label: 'mpvpaper (wlroots)',
    tool: 'mpvpaper',
    sessionType: 'Wayland',
    description: 'Rendu vidéo sur les compositors wlroots (Hyprland, Sway…) — incompatible GNOME',
    installCommand: null,
    installLabel: null,
    instructionsUrl: 'https://github.com/GhostNaN/mpvpaper'
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
