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

interface WallpaperBase {
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
}

export interface VideoWallpaper extends WallpaperBase {
  type: 'video'
  content: {
    videoFile: string
    width: number
    height: number
    hasAudio: boolean
  }
}

export interface WebWallpaper extends WallpaperBase {
  type: 'web'
  content: {
    entryFile: string
    width: number
    height: number
  }
}

export interface SceneWallpaper extends WallpaperBase {
  type: 'scene'
  content: {
    sceneFile: string
    width: number
    height: number
  }
}

export interface ApplicationWallpaper extends WallpaperBase {
  type: 'application'
  content: {
    executable: string
  }
}

export interface PlaylistWallpaper extends WallpaperBase {
  type: 'playlist'
  content: {
    children: string[]
  }
}

export type Wallpaper =
  | VideoWallpaper
  | WebWallpaper
  | SceneWallpaper
  | ApplicationWallpaper
  | PlaylistWallpaper

export function isPlaylist(wallpaper: Wallpaper): wallpaper is PlaylistWallpaper {
  return wallpaper.type === 'playlist'
}

export function resolveChildren(wallpaper: PlaylistWallpaper, all: Wallpaper[]): Wallpaper[] {
  return wallpaper.content.children
    .map((id) => all.find((w) => w.id === id))
    .filter((w): w is Wallpaper => Boolean(w))
}
