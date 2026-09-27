import { contextBridge, ipcRenderer } from 'electron'

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

const windowApi = {
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  onMaximizedChange: (callback: (maximized: boolean) => void): (() => void) => {
    const listener = (_event: unknown, maximized: boolean): void => callback(maximized)
    ipcRenderer.on('window:maximized', listener)
    return () => ipcRenderer.removeListener('window:maximized', listener)
  }
}

const wallpaperApi = {
  set: (wallpaperId: string): void => {
    console.log(`[test] wallpaperApi.set — ${wallpaperId}`)
    ipcRenderer.send('wallpaper:set', wallpaperId)
  }
}

const workshopApi = {
  getFolder: (): Promise<{ folder: string | null }> =>
    ipcRenderer.invoke('workshop:get-folder'),
  setFolder: (folder: string | null): Promise<string | null> =>
    ipcRenderer.invoke('workshop:set-folder', folder),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('workshop:pick-folder'),
  scan: (): Promise<WorkshopScanResult> => ipcRenderer.invoke('workshop:scan')
}

const testApi = {
  ping: (): string => {
    const message = 'pong'
    console.log(`[test] ${message}`)
    return message
  }
}

const api = {
  window: windowApi,
  wallpaper: wallpaperApi,
  workshop: workshopApi,
  test: testApi
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error fallback when context isolation is disabled
  window.api = api
}
