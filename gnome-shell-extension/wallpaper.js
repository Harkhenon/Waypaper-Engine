// Acteur de fond d'écran : clone la fenêtre du renderer dans l'acteur de
// fond GNOME. Adapté de Hanabi (jeffshee/gnome-ext-hanabi) — GPL-3.0-or-later.
import Clutter from 'gi://Clutter'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Graphene from 'gi://Graphene'
import St from 'gi://St'
import { APPLICATION_ID } from './constants.js'

const FADE_DURATION = 500
const RETRY_INTERVAL_MS = 500

export const LiveWallpaper = GObject.registerClass(
  class LiveWallpaper extends St.Widget {
    constructor(backgroundActor) {
      super({
        layout_manager: new Clutter.BinLayout(),
        width: backgroundActor.width,
        height: backgroundActor.height,
        x_expand: true,
        y_expand: true,
        opacity: 0
      })
      this._backgroundActor = backgroundActor
      this._isDisposed = false
      this._timeoutId = null
      this._wallpaper = null
      this._sourceDestroyId = 0

      this.connect('destroy', () => {
        this._isDisposed = true
        if (this._timeoutId) {
          GLib.Source.remove(this._timeoutId)
          this._timeoutId = null
        }
        if (this._wallpaper) {
          this._wallpaper.source = null
          this._wallpaper.destroy()
          this._wallpaper = null
        }
      })

      backgroundActor.layout_manager = new Clutter.BinLayout()
      backgroundActor.add_child(this)
      this._applyWallpaper()
    }

    _applyWallpaper() {
      if (this._isDisposed) return
      const operation = () => {
        if (this._isDisposed) return false
        const renderer = this._findRendererActor()
        if (renderer) {
          console.log(`[waypaper] clone attaché (moniteur ${this._backgroundActor.monitor})`)
          this._wallpaper = new Clutter.Clone({
            source: renderer,
            pivot_point: new Graphene.Point({ x: 0.5, y: 0.5 })
          })
          this._wallpaper.connect('destroy', () => {
            this._wallpaper = null
          })
          this._sourceDestroyId = this._wallpaper.source.connect('destroy', () => {
            if (this._wallpaper) this._wallpaper.destroy()
            if (!this._isDisposed) this._applyWallpaper()
          })
          this.add_child(this._wallpaper)
          this.ease({
            opacity: 255,
            duration: FADE_DURATION,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD
          })
          return false
        }
        // Renderer pas encore mappé : on réessaie.
        return true
      }
      if (operation()) {
        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, RETRY_INTERVAL_MS, operation)
      }
    }

    _findRendererActor() {
      const rendererActors = global
        .get_window_actors()
        .filter((actor) => actor.meta_window.title?.includes(APPLICATION_ID))
      if (rendererActors.length === 0) return null
      return (
        rendererActors.find(
          (actor) => actor.meta_window.get_monitor() === this._backgroundActor.monitor
        ) ?? rendererActors[0]
      )
    }
  }
)
