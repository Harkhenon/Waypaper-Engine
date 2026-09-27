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

export interface WallpaperApi {
  set: (wallpaperId: string) => void
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
  wallpaper: WallpaperApi
  workshop: WorkshopApi
  test: TestApi
}

declare global {
  interface Window {
    api: Api
  }
}

export {}
