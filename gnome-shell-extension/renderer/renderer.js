#!/usr/bin/env gjs
// Renderer Waypaper Engine : joue la vidéo dans des fenêtres GTK4 (une par
// écran) que l'extension GNOME Shell clone dans le fond.
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

// Un player par écran : index de moniteur -> { uri, player, widget }.
const players = new Map()

const parseArgs = (argv) => {
  let last = null
  for (const arg of argv) {
    if (last === '-P') {
      // -P : chemin du code (inutilisé ici, réservé)
      last = null
    } else if (last === '-F') {
      initialVideoPath = arg
      last = null
    } else if (arg === '-P' || arg === '-F') {
      last = arg
    }
  }
}

let initialVideoPath = null

// Lis « video-paths » (JSON index -> chemin) puis « video-path » (tous les
// écrans sans assignation).
const readAssignments = () => {
  const byMonitor = {}
  if (settings) {
    const raw = settings.get_string('video-paths')
    if (raw) {
      try {
        Object.assign(byMonitor, JSON.parse(raw))
      } catch (e) {
        console.warn(`video-paths illisible : ${e}`)
      }
    }
  }
  const globalPath = settings ? settings.get_string('video-path') : initialVideoPath
  return { byMonitor, globalPath }
}

const setPlay = (player) => player.play()
const setPause = (player) => player.pause()

// Titre = contrat avec le WindowManager du shell (pattern Hanabi).
const buildWindowTitle = (index, geometry) => {
  const state = {
    position: [geometry.x, geometry.y],
    keepAtBottom: true,
    keepMinimized: true,
    keepPosition: true
  }
  return `@${APPLICATION_ID}!${JSON.stringify(state)}|${index}`
}

// Crée (ou remplace) le player d'un écran. Retire l'écran de la map si le
// chemin est vide (assignation retirée).
const setMonitorVideo = (index, path) => {
  const existing = players.get(index)
  if (existing) {
    if (!path) {
      // Assignation retirée : on stoppe le player ET on détruit la fenêtre —
      // sinon le clone du shell afficherait la dernière frame gelée.
      players.delete(index)
      existing.media?.stream_unprepared()
      existing.play?.stop()
      existing.media?.pause()
      destroyWindow(index)
      return
    }
    if (existing.path === path) return
    existing.path = path
    const file = Gio.File.new_for_path(path)
    if (existing.play) existing.play.set_uri(file.get_uri())
    else existing.media.file = file
  } else {
    if (!path) return
    const entry = buildPlayer(path)
    players.set(index, entry)
    if (!windows.has(index)) createWindow(index)
    const picture = buildPicture(entry.paintable)
    attachWidget(index, picture)
  }
  syncPlaybackState()
}

// Construit un player (GstPlay si dispo, sinon Gtk.MediaFile) et son
// paintable partagé pour l'écran donné.
const buildPlayer = (path) => {
  const file = Gio.File.new_for_path(path)
  if (haveGstPlay) {
    let sink = Gst.ElementFactory.make('gtk4paintablesink', 'gtk4paintablesink')
    if (!sink) sink = Gst.ElementFactory.make('gtksink', 'gtksink')
    if (sink && !sink.widget && sink.paintable) {
      const play = GstPlay.Play.new(GstPlay.PlayVideoOverlayVideoRenderer.new_with_sink(null, sink))
      const adapter = GstPlay.PlaySignalAdapter.new(play)
      adapter.connect('end-of-stream', (a) => {
        if (settings ? settings.get_boolean('loop') : true) a.play.seek(0)
      })
      adapter.connect('warning', (_a, err) => console.warn(err))
      adapter.connect('error', (_a, err) => console.error(err))
      play.set_uri(file.get_uri())
      play.mute = settings ? settings.get_boolean('mute') : true
      play.play()
      return { path, play, adapter, paintable: sink.paintable }
    }
  }
  const media = Gtk.MediaFile.new_for_filename(path)
  media.set({ loop: settings ? settings.get_boolean('loop') : true })
  media.muted = settings ? settings.get_boolean('mute') : true
  media.play()
  return { path, media, paintable: media }
}

const buildPicture = (paintable) => {
  const picture = new Gtk.Picture({
    paintable,
    hexpand: true,
    vexpand: true
  })
  picture.set_content_fit(Gtk.ContentFit.CONTAIN)
  return picture
}

// Chaque écran a sa fenêtre, créée à la demande (une assignation arrive) et
// détruite quand elle est retirée. attachWidget garde le mapping pour remplacer
// le contenu à chaud.
const windows = new Map()
let applicationInstance = null

const attachWidget = (index, widget) => {
  const window = windows.get(index)
  if (window) window.set_child(widget)
}

const monitorGeometry = (index) => {
  const display = Gdk.Display.get_default()
  const monitors = display ? [...display.get_monitors()] : []
  return monitors[index]?.get_geometry() ?? { x: 0, y: 0, width: 640, height: 480 }
}

const monitorCount = () => {
  const display = Gdk.Display.get_default()
  return display ? display.get_monitors().get_n_items() : 0
}

const createWindow = (index) => {
  const geometry = monitorGeometry(index)
  const window = new Gtk.ApplicationWindow({
    application: applicationInstance,
    decorated: false,
    default_width: geometry.width,
    default_height: geometry.height,
    title: buildWindowTitle(index, geometry)
  })
  window.set_size_request(geometry.width, geometry.height)
  window.set_resizable(false)
  windows.set(index, window)
  window.present()
  return window
}

const destroyWindow = (index) => {
  const window = windows.get(index)
  if (!window) return
  windows.delete(index)
  window.close()
}

const syncPlaybackState = () => {
  const wantPaused = settings ? settings.get_boolean('paused') : false
  for (const entry of players.values()) {
    if (entry.play) wantPaused ? entry.play.pause() : entry.play.play()
    else if (entry.media) wantPaused ? entry.media.pause() : entry.media.play()
  }
}

const syncMuteState = () => {
  const wantMuted = settings ? settings.get_boolean('mute') : true
  for (const entry of players.values()) {
    if (entry.play) {
      if (entry.play.mute === wantMuted) entry.play.mute = !wantMuted
      entry.play.mute = wantMuted
    } else if (entry.media) {
      entry.media.muted = wantMuted
    }
  }
}

const syncAll = () => {
  const { byMonitor, globalPath } = readAssignments()
  for (const [index, path] of Object.entries(byMonitor)) {
    setMonitorVideo(Number(index), path)
  }
  // Écrans sans assignation : vidéo globale (ou retrait si vide). On couvre
  // tous les index connus (fenêtres existantes + écrans physiques) pour créer
  // les fenêtres manquantes quand un chemin global arrive.
  const indices = new Set([...windows.keys()])
  for (let i = 0; i < monitorCount(); i++) indices.add(i)
  for (const index of indices) {
    if (!(String(index) in byMonitor)) setMonitorVideo(index, globalPath)
  }
}

const RendererApp = GObject.registerClass(
  { GTypeName: 'WaypaperRenderer' },
  class RendererApp extends Gtk.Application {
    vfunc_activate() {
      applicationInstance = this
      const { byMonitor, globalPath } = readAssignments()
      const maxIndex = Math.max(
        -1,
        ...Object.keys(byMonitor).map(Number),
        globalPath || initialVideoPath ? monitorCount() - 1 : -1
      )
      for (let index = 0; index <= maxIndex; index++) {
        const path = byMonitor[String(index)] ?? globalPath ?? initialVideoPath
        if (path) setMonitorVideo(index, path)
      }
      settings?.connect('changed', (s, key) => {
        if (key === 'video-path' || key === 'video-paths') {
          syncAll()
        } else if (key === 'paused') {
          syncPlaybackState()
        } else if (key === 'mute') {
          syncMuteState()
        }
      })
    }
  }
)

Gst.init(null)
parseArgs(ARGV)
if (!initialVideoPath) {
  console.error('renderer : aucun chemin de vidéo fourni (-F)')
  imports.system.exit(1)
}
const app = new RendererApp({ application_id: APPLICATION_ID })
app.run([])
