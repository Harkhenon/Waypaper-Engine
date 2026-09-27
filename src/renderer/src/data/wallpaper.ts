export const WALLPAPER_TYPES = ['video', 'web', 'scene', 'application', 'playlist'] as const
export type WallpaperType = (typeof WALLPAPER_TYPES)[number]

export type SupportLevel = 'supported' | 'partial' | 'unsupported'

export interface WallpaperTypeMeta {
  value: WallpaperType
  label: string
  support: SupportLevel
  /** Explication affichée à l'utilisateur pour les niveaux partial/unsupported. */
  supportExplanation: string
}

export const WALLPAPER_TYPE_META: Record<WallpaperType, WallpaperTypeMeta> = {
  video: {
    value: 'video',
    label: 'Vidéo',
    support: 'supported',
    supportExplanation: ''
  },
  web: {
    value: 'web',
    label: 'Web',
    support: 'supported',
    supportExplanation: ''
  },
  scene: {
    value: 'scene',
    label: 'Scène',
    support: 'partial',
    supportExplanation:
      'Le format scène de Wallpaper Engine est propriétaire (moteur temps réel Windows). ' +
      "Waypaper Engine affiche l'aperçu animé du wallpaper en boucle, pas le rendu interactif du moteur."
  },
  playlist: {
    value: 'playlist',
    label: 'Playlist',
    support: 'unsupported',
    supportExplanation:
      "Les playlists référencent d'autres wallpapers dans un ordre donné — " +
      "la lecture en séquence n'est pas encore implémentée. " +
      "Appliquez individuellement les wallpapers qu'elle contient."
  },
  application: {
    value: 'application',
    label: 'Application',
    support: 'unsupported',
    supportExplanation:
      'Les wallpapers « application » sont des exécutables Windows — ' +
      'ils ne peuvent pas être exécutés sur Linux.'
  }
}

export interface Wallpaper {
  id: string
  workshopId: string
  title: string
  author: string
  description: string
  preview: string
  tags: string[]
  sizeMb: number
  updatedAt: string
  folder: string
  type: WallpaperType
}
