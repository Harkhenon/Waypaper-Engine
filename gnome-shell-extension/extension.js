// Extension GNOME Shell de Waypaper Engine : vidéo de fond d'écran.
// Architecture adaptée de Hanabi (jeffshee/gnome-ext-hanabi) — GPL-3.0-or-later.
// Le renderer (processus GJS/GTK4) joue la vidéo ; l'extension clone sa
// fenêtre dans les acteurs de fond du shell.
import GLib from 'gi://GLib'
import Gio from 'gi://Gio'
import Meta from 'gi://Meta'
import St from 'gi://St'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as Background from 'resource:///org/gnome/shell/ui/background.js'
import { Extension, InjectionManager } from 'resource:///org/gnome/shell/extensions/extension.js'
import { LiveWallpaper } from './wallpaper.js'
import { RendererLauncher } from './launcher.js'
import { WindowManager } from './windowManager.js'
import { SCHEMA_ID } from './constants.js'

export default class WaypaperExtension extends Extension {
  enable() {
    this._enabled = true
    this._settings = this.getSettings(SCHEMA_ID)
    this._wallpaperActors = new Set()
    this._injectionManager = new InjectionManager()
    this._launcher = null
    this._windowManager = new WindowManager()
    this._subprocess = null
    this._relaunchId = 0
    this._startingUp = Main.layoutManager._startingUp
    // Nettoie tout renderer orphelin d'une session précédente/crashée :
    // ses fenêtres plein écran intercepteraient les clics.
    this._killOrphanRenderers()

    const extensionInstance = this
    this._injectionManager.overrideMethod(
      Background.BackgroundManager.prototype,
      '_createBackgroundActor',
      (originalMethod) => {
        return function () {
          const backgroundActor = originalMethod.call(this)
          const actor = new LiveWallpaper(backgroundActor)
          this._waypaperActor = actor
          extensionInstance._trackActor(actor)
          return backgroundActor
        }
      }
    )

    this._settingsChangedId = this._settings.connect('changed::video-path', () =>
      this._syncRenderer()
    )
    this._assignmentsChangedId = this._settings.connect('changed::video-paths', () =>
      this._syncRenderer()
    )
    this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', () => {
      if (this._monitorsTimeoutId) GLib.source_remove(this._monitorsTimeoutId)
      this._monitorsTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
        this._monitorsTimeoutId = 0
        this._stopRenderer()
        this._publishMonitors()
        this._syncRenderer()
        return GLib.SOURCE_REMOVE
      })
    })

    this._windowManager.enable()
    this._publishMonitors()
    if (this._startingUp) {
      this._startupCompleteId = Main.layoutManager.connect('startup-complete', () => {
        Main.layoutManager.disconnect(this._startupCompleteId)
        this._startupCompleteId = 0
        this._reloadBackgrounds()
        this._publishMonitors()
        this._syncRenderer()
      })
    } else {
      this._reloadBackgrounds()
      this._syncRenderer()
    }
  }

  _killOrphanRenderers() {
    const procFolder = Gio.File.new_for_path('/proc')
    if (!procFolder.query_exists(null)) return
    const enumerator = procFolder.enumerate_children(
      'standard::*',
      Gio.FileQueryInfoFlags.NONE,
      null
    )
    const rendererPath = `gjs ${GLib.build_filenamev([this.path, 'renderer', 'renderer.js'])}`
    let info
    while ((info = enumerator.next_file(null)) !== null) {
      const pid = info.get_name()
      const cmdlineFile = Gio.File.new_for_path(GLib.build_filenamev(['/proc', pid, 'cmdline']))
      if (!cmdlineFile.query_exists(null)) continue
      let contents = ''
      try {
        const [bytes] = cmdlineFile.load_bytes(null)
        const data = bytes.get_data()
        if (data) {
          for (let i = 0; i < data.length; i++) {
            contents += data[i] < 32 ? ' ' : String.fromCharCode(data[i])
          }
        }
      } catch (e) {
        continue
      }
      if (contents.startsWith(rendererPath)) {
        console.log(`[waypaper] renderer orphelin tué (pid ${pid})`)
        try {
          const killer = new Gio.Subprocess({ argv: ['/bin/kill', pid] })
          killer.init(null)
          killer.wait(null)
        } catch (e) {
          console.warn(`[waypaper] impossible de tuer le pid ${pid} : ${e}`)
        }
      }
    }
  }

  _trackActor(actor) {
    this._wallpaperActors?.add(actor)
    actor.connect('destroy', (a) => {
      this._wallpaperActors?.delete(a)
    })
  }

  // Publie la liste des écrans dans le schéma pour que l'application puisse
  // afficher des moniteurs réels (la clé est relue par gsettings côté app).
  _publishMonitors() {
    if (!this._settings) return
    // Noms lisibles via mutter : Meta.LogicalMonitor.get_number() donne le même
    // index que Main.layoutManager.monitors, et Meta.Monitor expose le libellé
    // usine et le connecteur (DP-1, HDMI-A-1…).
    let connectorNames = []
    try {
      const monitorManager = global.backend.get_monitor_manager()
      connectorNames = monitorManager.get_logical_monitors().map((logical) => {
        const physical = logical.get_monitors()[0]
        return {
          index: logical.get_number(),
          name: physical?.get_display_name() ?? '',
          connector: physical?.get_connector() ?? ''
        }
      })
    } catch (e) {
      console.warn(`[waypaper] noms d'écrans indisponibles : ${e}`)
    }
    const nameFor = (index, m) => {
      const entry = connectorNames.find((c) => c.index === index)
      if (entry?.name && entry.name !== 'Unknown') return entry.name
      if (entry?.connector) return entry.connector
      return `${m.width}x${m.height}+${m.x}+${m.y}`
    }
    const connectorFor = (index) => connectorNames.find((c) => c.index === index)?.connector ?? ''
    const monitors = Main.layoutManager.monitors.map((m, index) => ({
      index,
      name: nameFor(index, m),
      connector: connectorFor(index),
      x: m.x,
      y: m.y,
      width: m.width,
      height: m.height,
      scale: Main.layoutManager.monitorScalingScale ?? m.geometry?.scale ?? 1
    }))
    this._settings.set_string('monitors-json', JSON.stringify(monitors))
  }

  _getLaters() {
    if (global.compositor?.get_laters) return global.compositor.get_laters()
    if (Meta.Laters?.get) return Meta.Laters.get()
    return null
  }

  _reloadBackgrounds() {
    this._wallpaperActors?.forEach((actor) => actor.destroy())
    this._wallpaperActors?.clear()
    const laters = this._getLaters()
    if (laters) {
      laters.add(Meta.LaterType.BEFORE_REDRAW, () => {
        Main.layoutManager._updateBackgrounds()
        return GLib.SOURCE_REMOVE
      })
    } else {
      Main.layoutManager._updateBackgrounds()
    }
  }

  _syncRenderer() {
    const videoPath = this._settings.get_string('video-path')
    const assignments = this._settings.get_string('video-paths')
    if (videoPath === '' && (!assignments || assignments === '{}')) {
      this._stopRenderer()
      return
    }
    if (this._subprocess) return
    this._launchRenderer(videoPath || assignments)
  }

  _launchRenderer(videoPath) {
    console.log(`[waypaper] lancement renderer : ${videoPath}`)
    const argv = [
      'gjs',
      GLib.build_filenamev([this.path, 'renderer', 'renderer.js']),
      '-P',
      this.path,
      '-F',
      videoPath
    ]
    this._launcher = new RendererLauncher()
    this._windowManager.setLauncher(this._launcher)
    this._rendererFailures = 0
    try {
      this._subprocess = this._launcher.spawnv(argv)
    } catch (e) {
      console.error(`[waypaper] lancement renderer : ${e}`)
      this._windowManager.setLauncher(null)
      this._launcher = null
      this._subprocess = null
      return
    }
    this._subprocess.wait_async(null, (obj, res) => {
      obj.wait_finish(res)
      console.log(`[waypaper] renderer terminé (exit ${obj.get_exit_status()})`)
      if (!this._subprocess || obj !== this._subprocess) return
      this._subprocess = null
      this._launcher = null
      this._windowManager.setLauncher(null)
      if (
        this._enabled &&
        (this._settings.get_string('video-path') !== '' ||
          this._settings.get_string('video-paths') !== '{}')
      ) {
        // Anti-crash-loop : après 3 échecs consécutifs, on abandonne plutôt
        // que de relancer GStreamer en boucle (fige la session).
        this._rendererFailures = (this._rendererFailures ?? 0) + 1
        if (this._rendererFailures >= 3) {
          console.error('[waypaper] renderer planté 3 fois de suite — relance abandonnée')
          this._rendererFailures = 0
          return
        }
        if (this._relaunchId) GLib.source_remove(this._relaunchId)
        this._relaunchId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
          this._relaunchId = 0
          this._syncRenderer()
          return GLib.SOURCE_REMOVE
        })
      }
    })
  }

  _stopRenderer() {
    if (this._relaunchId) {
      GLib.source_remove(this._relaunchId)
      this._relaunchId = 0
    }
    if (this._launcher) {
      this._launcher.cancellable?.cancel()
      this._launcher = null
    }
    this._windowManager?.setLauncher(null)
    if (this._subprocess) {
      this._subprocess.send_signal(15)
      this._subprocess = null
    }
  }

  disable() {
    this._enabled = false
    this._stopRenderer()
    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId)
      this._settingsChangedId = 0
    }
    if (this._assignmentsChangedId) {
      this._settings.disconnect(this._assignmentsChangedId)
      this._assignmentsChangedId = 0
    }
    if (this._monitorsChangedId) {
      Main.layoutManager.disconnect(this._monitorsChangedId)
      this._monitorsChangedId = 0
    }
    if (this._monitorsTimeoutId) {
      GLib.source_remove(this._monitorsTimeoutId)
      this._monitorsTimeoutId = 0
    }
    this._windowManager.disable()
    this._injectionManager.clear()
    this._reloadBackgrounds()
    this._wallpaperActors = null
    this._settings = null
  }
}
