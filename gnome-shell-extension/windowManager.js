// Repère les fenêtres du renderer (client Wayland de l'extension) et les
// maintient hors de vue : minimisées, toujours en bas, position verrouillée.
// Le titre de chaque fenêtre transporte l'état souhaité (pattern Hanabi) :
// `@<APP_ID>!<json>|<index>`.
// Adapté de Hanabi (jeffshee/gnome-ext-hanabi) et de DING — GPL-3.0-or-later.
import GLib from 'gi://GLib'
import { APPLICATION_ID } from './constants.js'

const MINIMIZE_RESYNC_DELAY_MS = 250

const WINDOW_STATE_KEYS = ['position', 'keepAtBottom', 'keepMinimized', 'keepPosition']

class ManagedWindow {
  constructor(window) {
    this._window = window
    this._isDisposed = false
    this._resyncTimeoutId = 0
    this._state = {
      position: [0, 0],
      keepAtBottom: false,
      keepMinimized: false,
      keepPosition: false
    }
    this._signalIds = [
      window.connect('notify::title', () => {
        if (!this._isDisposed) this._parseTitle()
      }),
      window.connect_after('shown', () => {
        if (!this._isDisposed && this._state.keepMinimized) {
          this._window.minimize()
          this._scheduleMinimizeResync()
        }
      }),
      window.connect_after('raised', () => {
        if (!this._isDisposed && this._state.keepAtBottom) this._window.lower()
      }),
      window.connect('notify::above', () => {
        if (!this._isDisposed && this._state.keepAtBottom && this._window.above)
          this._window.unmake_above()
      }),
      window.connect('notify::minimized', () => {
        if (!this._isDisposed && this._state.keepMinimized && !this._window.minimized)
          this._window.minimize()
      }),
      window.connect('position-changed', () => {
        if (this._isDisposed || !this._state.keepPosition) return
        const [x, y] = this._state.position
        this._window.move_frame(true, x, y)
      })
    ]
    this._parseTitle()
  }

  _parseTitle() {
    const marker = `@${APPLICATION_ID}!`
    const title = this._window.title
    if (title?.startsWith(marker)) {
      const json = title.slice(marker.length).split('|')[0]
      try {
        const parsed = JSON.parse(json)
        for (const key of WINDOW_STATE_KEYS) {
          if (key in parsed) this._state[key] = parsed[key]
        }
      } catch (e) {
        console.warn(`[waypaper] état de fenêtre illisible : ${e}`)
      }
    }
    this._refresh()
  }

  // Après une reprise de veille, mutter peut garder la fenêtre mappée (donc
  // visible et cliquable) alors qu'il la considère minimisée : minimize()
  // seul ne fait alors rien. On revérifie et on force unminimize+minimize.
  _scheduleMinimizeResync() {
    if (this._resyncTimeoutId) return
    this._resyncTimeoutId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      MINIMIZE_RESYNC_DELAY_MS,
      () => {
        this._resyncTimeoutId = 0
        if (this._isDisposed || !this._state.keepMinimized) return GLib.SOURCE_REMOVE
        const actor = this._window.get_compositor_private()
        if (this._window.minimized && actor?.visible) {
          console.log('[waypaper] fenêtre renderer encore mappée, resync minimisation')
          this._window.unminimize()
          this._window.minimize()
        }
        return GLib.SOURCE_REMOVE
      }
    )
  }

  _refresh() {
    if (this._state.keepAtBottom && this._window.above) this._window.unmake_above()
    if (this._state.keepMinimized && !this._window.minimized) this._window.minimize()
    this._scheduleMinimizeResync()
    if (this._state.keepPosition) {
      const [x, y] = this._state.position
      this._window.move_frame(true, x, y)
    }
  }

  dispose() {
    this._isDisposed = true
    if (this._resyncTimeoutId) {
      GLib.source_remove(this._resyncTimeoutId)
      this._resyncTimeoutId = 0
    }
    for (const id of this._signalIds) this._window.disconnect(id)
    this._signalIds = []
  }
}

export class WindowManager {
  constructor() {
    this._launcher = null
    this._windows = new Set()
    this._mapId = 0
  }

  setLauncher(launcher) {
    this._launcher = launcher
  }

  enable() {
    this._mapId = global.window_manager.connect_after('map', (_wm, windowActor) => {
      const window = windowActor.get_meta_window()
      if (window && this._launcher?.query_window_belongs_to(window)) this._manage(window)
    })
  }

  disable() {
    if (this._mapId) {
      global.window_manager.disconnect(this._mapId)
      this._mapId = 0
    }
    for (const window of this._windows) this._release(window)
    this._windows.clear()
  }

  _manage(window) {
    if (this._windows.has(window)) return
    window._waypaperManaged = new ManagedWindow(window)
    this._windows.add(window)
    const unmanagedId = window.connect('unmanaged', (w) => {
      this._release(w)
      this._windows.delete(w)
    })
    window._waypaperUnmanagedId = unmanagedId
  }

  _release(window) {
    if (window._waypaperUnmanagedId) {
      window.disconnect(window._waypaperUnmanagedId)
      window._waypaperUnmanagedId = 0
    }
    window._waypaperManaged?.dispose()
    window._waypaperManaged = null
  }
}
