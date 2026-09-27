import { contextBridge, ipcRenderer } from 'electron'

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

const testApi = {
  ping: (): string => {
    const message = 'pong'
    console.log(`[test] ${message}`)
    return message
  }
}

const api = {
  window: windowApi,
  test: testApi
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error fallback when context isolation is disabled
  window.api = api
}
