export interface WindowApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
}

export interface WallpaperApi {
  set: (wallpaperId: string) => void
}

export interface TestApi {
  ping: () => string
}

export interface Api {
  window: WindowApi
  wallpaper: WallpaperApi
  test: TestApi
}

declare global {
  interface Window {
    api: Api
  }
}

export {}
