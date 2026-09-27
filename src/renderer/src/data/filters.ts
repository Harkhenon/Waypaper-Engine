import type { WallpaperType } from './wallpaper'

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'title', label: 'Titre (A→Z)' },
  { value: 'size', label: 'Taille' }
] as const

export type SortValue = (typeof SORT_OPTIONS)[number]['value']

export const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'video', label: 'Vidéo' },
  { value: 'web', label: 'Web' },
  { value: 'scene', label: 'Scène' },
  { value: 'playlist', label: 'Playlist' },
  { value: 'application', label: 'Application' }
] as const

export type TypeFilterValue = (typeof TYPE_FILTER_OPTIONS)[number]['value']

export interface TypeVisualMeta {
  icon: 'video' | 'world' | 'cube' | 'playlist' | 'app'
  badgeColor: string
  gradientFrom: string
  gradientTo: string
}

export const TYPE_VISUAL_META: Record<WallpaperType, TypeVisualMeta> = {
  video: {
    icon: 'video',
    badgeColor: 'blue',
    gradientFrom: 'indigo.8',
    gradientTo: 'cyan.6'
  },
  web: {
    icon: 'world',
    badgeColor: 'teal',
    gradientFrom: 'teal.8',
    gradientTo: 'lime.6'
  },
  scene: {
    icon: 'cube',
    badgeColor: 'grape',
    gradientFrom: 'grape.8',
    gradientTo: 'pink.5'
  },
  playlist: {
    icon: 'playlist',
    badgeColor: 'orange',
    gradientFrom: 'orange.8',
    gradientTo: 'yellow.5'
  },
  application: {
    icon: 'app',
    badgeColor: 'red',
    gradientFrom: 'red.8',
    gradientTo: 'orange.5'
  }
}
