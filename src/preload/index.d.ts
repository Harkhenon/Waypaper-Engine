export interface TestApi {
  ping: () => string
}

export interface Api {
  test: TestApi
}

declare global {
  interface Window {
    api: Api
  }
}

export {}
