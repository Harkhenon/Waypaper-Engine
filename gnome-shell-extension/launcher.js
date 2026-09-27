// Lancement du renderer comme client Wayland de GNOME Shell.
// Adapté de Hanabi (jeffshee/gnome-ext-hanabi) et de DING — GPL-3.0-or-later.
import Meta from 'gi://Meta'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import * as Config from 'resource:///org/gnome/shell/misc/config.js'

const shellVersion = parseInt(Config.PACKAGE_VERSION.split('.')[0])

export class RendererLauncher {
  constructor() {
    if (shellVersion < 50) this._isX11 = !Meta.is_wayland_compositor()
    else this._isX11 = false

    this._launcher = new Gio.SubprocessLauncher({
      flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_MERGE
    })
    this._waylandClient = null
    this.subprocess = null
    this.running = false
    this.cancellable = new Gio.Cancellable()
  }

  spawnv(argv) {
    if (!this._isX11) {
      if (shellVersion < 49) {
        this._waylandClient = Meta.WaylandClient.new(global.context, this._launcher)
        this.subprocess = this._waylandClient.spawnv(global.display, argv)
      } else {
        this._waylandClient = Meta.WaylandClient.new_subprocess(
          global.context,
          this._launcher,
          argv
        )
        this.subprocess = this._waylandClient.get_subprocess()
      }
    } else {
      this.subprocess = this._launcher.spawnv(argv)
    }
    if (this._launcher.close) this._launcher.close()
    this._launcher = null
    this.running = this.subprocess !== null
    return this.subprocess
  }

  query_window_belongs_to(window) {
    if (this._isX11 || !this.running) return false
    try {
      return this._waylandClient.owns_window(window)
    } catch (e) {
      return false
    }
  }
}
