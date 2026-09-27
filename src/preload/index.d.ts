export interface WindowApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
}

export interface TestApi {
  ping: () => string
}

export interface Api {
  window: WindowApi
  test: TestApi
}

declare global {
  interface Window {
    api: Api
  }
}

export {}
