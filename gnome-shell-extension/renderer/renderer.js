#!/usr/bin/env gjs
// Renderer Waypaper Engine : joue la vidéo dans des fenêtres GTK4 (une par
// écran) que l'extension GNOME Shell clone dans le fond.
// Adapté de Hanabi (jeffshee/gnome-ext-hanabi) — GPL-3.0-or-later.
imports.gi.versions.Gtk = '4.0'
imports.gi.versions.WebKit = '6.0'
const { GObject, Gtk, Gio, GLib, Gdk } = imports.gi

const APPLICATION_ID = 'io.github.harkhenon.WaypaperRenderer'
const SCHEMA_ID = 'com.harkhenon.waypaper'

let WebKit = null
try {
  WebKit = imports.gi.WebKit
} catch (e) {
  console.warn('WebKit 6 indisponible, wallpapers web désactivés')
}
const haveWebKit = WebKit !== null

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
const isWebPath = (path) => /\.(html?|xhtml)$/i.test(path)

const setMonitorVideo = (index, path) => {
  const existing = players.get(index)
  if (existing) {
    if (!path) {
      // Assignation retirée : on stoppe le player ET on détruit la fenêtre —
      // sinon le clone du shell afficherait la dernière frame gelée.
      players.delete(index)
      stopPlayer(existing)
      destroyWindow(index)
      return
    }
    if (existing.path === path) return
    players.delete(index)
    stopPlayer(existing)
  }
  if (!path) return
  let entry
  try {
    entry = buildPlayer(path)
  } catch (e) {
    console.error(`contenu illisible pour l'écran ${index} : ${e}`)
    destroyWindow(index)
    return
  }
  players.set(index, entry)
  if (!windows.has(index)) createWindow(index)
  attachWidget(index, entry.widget)
  syncPlaybackState()
}

const stopPlayer = (entry) => {
  if (entry.view) {
    try {
      entry.view.terminate_web_process ? entry.view.terminate_web_process() : null
    } catch (e) {
      console.warn(`arrêt WebView : ${e}`)
    }
    return
  }
  entry.media?.pause()
  entry.media?.clear()
}

// Construit le contenu d'un écran : WebView pour une page web, player
// vidéo (Gtk.MediaFile) sinon.
const buildPlayer = (path) => {
  if (isWebPath(path)) return buildWebEntry(path)
  return buildVideoEntry(path)
}

const buildWebEntry = (path) => {
  if (!haveWebKit) throw new Error('WebKit 6 requis pour les wallpapers web')
  const view = new WebKit.WebView({
    hexpand: true,
    vexpand: true
  })
  view.set_background_color(new Gdk.RGBA({ red: 0, green: 0, blue: 0, alpha: 1 }))
  view.load_uri(Gio.File.new_for_path(path).get_uri())
  view.connect('load-failed', (_v, _uri, err) => console.error(`chargement web : ${err}`))
  return { path, view, widget: view }
}

const buildVideoEntry = (path) => {
  const entry = buildVideoPlayer(path)
  entry.widget = buildPicture(entry.paintable)
  return entry
}

// Gtk.MediaFile uniquement : son pipeline GStreamer est piloté par GTK depuis
// le main thread. L'alternative GstPlay + gtk4paintablesink panique en Rust
// (« Value accessed from different thread ») au teardown du pipeline, ce qui
// tuait le renderer à chaque changement de wallpaper à chaud.
const buildVideoPlayer = (path) => {
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

const readMonitorsJson = () => {
  if (!settings) return []
  const raw = settings.get_string('monitors-json')
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.warn(`monitors-json illisible : ${e}`)
    return []
  }
}

const gdkMonitorCount = () => {
  const display = Gdk.Display.get_default()
  return display ? display.get_monitors().get_n_items() : 0
}

// Géométrie mutter (monitors-json) : c'est celle du titre de fenêtre — le
// WindowManager du shell repositionne la fenêtre (move_frame) dans le
// référentiel mutter, indépendamment de l'ordre GDK.
const mutterGeometry = (index) => {
  const meta = readMonitorsJson().find((m) => m.index === index)
  return meta ?? { x: 0, y: 0, width: 640, height: 480, scale: 1 }
}

const monitorCount = () => {
  const published = readMonitorsJson()
  return published.length > 0 ? published.length : gdkMonitorCount()
}

const createWindow = (index) => {
  const geometry = mutterGeometry(index)
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
  // Pas de placement direct en GTK4 : le titre transporte la géométrie
  // mutter et le WindowManager de l'extension positionne la fenêtre
  // (move_frame) — c'est le canal fiable, indépendant de l'ordre GDK.
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
    if (entry.media) wantPaused ? entry.media.pause() : entry.media.play()
  }
}

const syncMuteState = () => {
  const wantMuted = settings ? settings.get_boolean('mute') : true
  for (const entry of players.values()) {
    if (entry.media) entry.media.muted = wantMuted
  }
}

const syncLoopState = () => {
  const wantLoop = settings ? settings.get_boolean('loop') : true
  for (const entry of players.values()) {
    if (entry.media) entry.media.set({ loop: wantLoop })
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
        } else if (key === 'loop') {
          syncLoopState()
        }
      })
    }
  }
)

parseArgs(ARGV)
if (!initialVideoPath) {
  console.error('renderer : aucun chemin de vidéo fourni (-F)')
  imports.system.exit(1)
}
const app = new RendererApp({ application_id: APPLICATION_ID })
app.run([])
