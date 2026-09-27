// Repère les fenêtres du renderer (client Wayland de l'extension) et les
// maintient hors de vue : minimisées, toujours en bas.
// Adapté de Hanabi (jeffshee/gnome-ext-hanabi) — GPL-3.0-or-later.
export class WindowManager {
  constructor(launcher) {
    this._launcher = launcher
    this._windows = new Set()
    this._mapId = 0
  }

  enable() {
    this._mapId = global.window_manager.connect_after('map', (_wm, windowActor) => {
      const window = windowActor.get_meta_window()
      if (this._launcher.query_window_belongs_to(window)) this._manage(window)
    })
  }

  disable() {
    if (this._mapId) {
      global.window_manager.disconnect(this._mapId)
      this._mapId = 0
    }
    for (const window of this._windows) {
      window.disconnect(this._managedSignalIds.get(window) ?? 0)
    }
    this._windows.clear()
  }

  _manage(window) {
    if (this._windows.has(window)) return
    this._windows.add(window)
    const raisedId = window.connect('raised', (w) => w.lower())
    this._managedSignalIds = this._managedSignalIds ?? new Map()
    this._managedSignalIds.set(window, raisedId)
    window.minimize()
    window.connect('unmanaged', (w) => {
      this._windows.delete(w)
      this._managedSignalIds?.delete(w)
    })
  }
}
