#!/usr/bin/env gjs
// Renderer Waypaper Engine : joue la vidéo dans des fenêtres GTK4 (une par
// écran, paintable partagé) que l'extension GNOME Shell clone dans le fond.
// Adapté de Hanabi (jeffshee/gnome-ext-hanabi) — GPL-3.0-or-later.
imports.gi.versions.Gtk = '4.0'
const { GObject, Gtk, Gio, GLib, Gdk, Gst } = imports.gi

const APPLICATION_ID = 'io.github.harkhenon.WaypaperRenderer'
const SCHEMA_ID = 'com.harkhenon.waypaper'

let GstPlay = null
try {
  GstPlay = imports.gi.GstPlay
} catch (e) {
  console.warn('GstPlay indisponible, repli sur Gtk.MediaFile')
}
const haveGstPlay = GstPlay !== null

const settings = Gio.SettingsSchemaSource.get_default().lookup(SCHEMA_ID, false)
  ? Gio.Settings.new(SCHEMA_ID)
  : null

let videoPath = null
let mute = settings ? settings.get_boolean('mute') : true
let paused = settings ? settings.get_boolean('paused') : false

let sharedPaintable = null
const pictures = []
let play = null
let media = null

const parseArgs = (argv) => {
  let last = null
  for (const arg of argv) {
    if (last === '-P') {
      // -P : chemin du code (inutilisé ici, réservé)
      last = null
    } else if (last === '-F') {
      videoPath = arg
      last = null
    } else if (arg === '-P' || arg === '-F') {
      last = arg
    }
  }
}

const setPlay = () => {
  if (play) play.play()
  else if (media) media.play()
}

const setPause = () => {
  if (play) play.pause()
  else if (media) media.pause()
}

const setFilePath = (path) => {
  const file = Gio.File.new_for_path(path)
  if (play) {
    play.set_uri(file.get_uri())
  } else if (media) {
    media.file = file
  }
  setPlay()
}

// Titre = contrat avec le WindowManager du shell : position cible et états
// keep* (pattern Hanabi). La fenêtre n'est PAS fullscreen : le shell la
// minimise et la positionne lui-même, ce qui évite qu'elle intercepte les
// clics pendant le map.
const buildWindowTitle = (index, geometry) => {
  const state = {
    position: [geometry.x, geometry.y],
    keepAtBottom: true,
    keepMinimized: true,
    keepPosition: true
  }
  return `@${APPLICATION_ID}!${JSON.stringify(state)}|${index}`
}

const syncPlayback = () => {
  const wantPaused = settings ? settings.get_boolean('paused') : false
  if (wantPaused) setPause()
  else setPlay()
}

const buildWidgetFromSink = (sink) => {
  sharedPaintable = sink.paintable
  return buildWidgetFromPaintable()
}

const buildWidgetFromPaintable = () => {
  const picture = new Gtk.Picture({
    paintable: sharedPaintable,
    hexpand: true,
    vexpand: true
  })
  picture.set_content_fit(Gtk.ContentFit.CONTAIN)
  pictures.push(picture)
  return picture
}

const setupPlayback = () => {
  if (haveGstPlay) {
    let sink = Gst.ElementFactory.make('gtk4paintablesink', 'gtk4paintablesink')
    if (!sink) sink = Gst.ElementFactory.make('gtksink', 'gtksink')
    if (sink && !sink.widget && sink.paintable) {
      play = GstPlay.Play.new(GstPlay.PlayVideoOverlayVideoRenderer.new_with_sink(null, sink))
      const adapter = GstPlay.PlaySignalAdapter.new(play)
      adapter.connect('end-of-stream', (a) => a.play.seek(0))
      adapter.connect('warning', (_a, err) => console.warn(err))
      adapter.connect('error', (_a, err) => console.error(err))
      const file = Gio.File.new_for_path(videoPath)
      play.set_uri(file.get_uri())
      play.play()
      sharedPaintable = sink.paintable
      return buildWidgetFromPaintable()
    }
  }
  // Repli : Gtk.MediaFile (présent dans GTK4, aucune dépendance GStreamer)
  media = Gtk.MediaFile.new_for_filename(videoPath)
  media.set({ loop: true, muted: mute })
  media.play()
  sharedPaintable = media
  return buildWidgetFromPaintable()
}

const RendererApp = GObject.registerClass(
  { GTypeName: 'WaypaperRenderer' },
  class RendererApp extends Gtk.Application {
    vfunc_activate() {
      const display = Gdk.Display.get_default()
      const monitors = display ? [...display.get_monitors()] : []
      const widget = setupPlayback()
      monitors.forEach((gdkMonitor, index) => {
        const geometry = gdkMonitor.get_geometry()
        const window = new Gtk.ApplicationWindow({
          application: this,
          decorated: false,
          default_width: geometry.width,
          default_height: geometry.height,
          title: buildWindowTitle(index, geometry)
        })
        window.set_child(index === 0 ? widget : buildWidgetFromPaintable())
        window.set_size_request(geometry.width, geometry.height)
        window.set_resizable(false)
        window.present()
      })
      settings?.connect('changed', (s, key) => {
        if (key === 'video-path') {
          const next = s.get_string(key)
          if (next && next !== videoPath) {
            videoPath = next
            setFilePath(next)
          }
        } else if (key === 'paused') {
          syncPlayback()
        } else if (key === 'mute') {
          if (media) media.muted = s.get_boolean(key)
        }
      })
    }
  }
)

Gst.init(null)
parseArgs(ARGV)
if (!videoPath) {
  console.error('renderer : aucun chemin de vidéo fourni (-F)')
  imports.system.exit(1)
}
const app = new RendererApp({ application_id: APPLICATION_ID })
app.run([])
