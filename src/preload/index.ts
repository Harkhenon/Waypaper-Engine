import { contextBridge } from 'electron'

const testApi = {
  ping: (): string => {
    const message = 'pong'
    console.log(`[test] ${message}`)
    return message
  }
}

const api = {
  test: testApi
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error fallback when context isolation is disabled
  window.api = api
}
