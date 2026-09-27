export const WALLPAPER_TYPES = ['video', 'web', 'scene', 'application', 'playlist'] as const
export type WallpaperType = (typeof WALLPAPER_TYPES)[number]

export interface WallpaperTypeMeta {
  value: WallpaperType
  label: string
  supported: boolean
}

export const WALLPAPER_TYPE_META: Record<WallpaperType, WallpaperTypeMeta> = {
  video: { value: 'video', label: 'Vidéo', supported: true },
  web: { value: 'web', label: 'Web', supported: true },
  scene: { value: 'scene', label: 'Scène', supported: false },
  playlist: { value: 'playlist', label: 'Playlist', supported: true },
  application: { value: 'application', label: 'Application', supported: false }
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
