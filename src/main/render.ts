import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'
import {
  RENDER_BACKENDS,
  type RenderBackendDef,
  type SetWallpaperPayload,
  type SetWallpaperResult
} from '../shared/render'
import {
  readConfig,
  writeConfig,
  readProjectMetadata,
  resolvePreview,
  type WorkshopConfig
} from './workshop'

export interface BackendStatus {
  id: string
  available: boolean
}

export interface DetectResult {
  sessionType: 'X11' | 'Wayland'
  desktop: 'gnome' | 'kde' | 'wlroots' | 'x11' | 'unknown'
  backends: BackendStatus[]
  active: string | null
}

function isWaylandSession(): boolean {
  return Boolean(process.env['WAYLAND_DISPLAY']) || process.env['XDG_SESSION_TYPE'] === 'wayland'
}

function detectDesktop(): DetectResult['desktop'] {
  const desktops = [
    process.env['XDG_CURRENT_DESKTOP'],
    process.env['DESKTOP_SESSION'],
    process.env['XDG_SESSION_DESKTOP']
  ].filter(Boolean) as string[]
  const joined = desktops.join(':').toLowerCase()
  if (joined.includes('gnome')) return 'gnome'
  if (joined.includes('kde') || joined.includes('plasma')) return 'kde'
  if (joined.includes('hyprland') || joined.includes('sway') || joined.includes('niri') || joined.includes('wlroots')) {
    return 'wlroots'
  }
  if (!isWaylandSession()) return 'x11'
  return 'unknown'
}

export function toolAvailable(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    const check = spawn('sh', ['-c', `command -v ${tool}`])
    check.on('close', (code) => resolve(code === 0))
    check.on('error', () => resolve(false))
  })
}

export async function detectBackends(): Promise<DetectResult> {
  const sessionType = isWaylandSession() ? 'Wayland' : 'X11'
  const desktop = detectDesktop()
  const backends: BackendStatus[] = []

  for (const backend of RENDER_BACKENDS) {
    if (backend.id === 'gnome-static') {
      const available = desktop === 'gnome' && (await toolAvailable('gsettings'))
      backends.push({ id: backend.id, available })
      continue
    }
    const compatible =
      backend.sessionType === 'any' ||
      (backend.sessionType === 'Wayland' && desktop === 'wlroots') ||
      (backend.sessionType === 'X11' && sessionType === 'X11')
    const available = compatible && backend.tool !== null && (await toolAvailable(backend.tool))
    backends.push({ id: backend.id, available })
  }

  const config = await readConfig()
  return { sessionType, desktop, backends, active: config.activeBackend ?? null }
}

export async function readRenderConfig(): Promise<WorkshopConfig> {
  return readConfig()
}

export async function setActiveBackend(id: string | null): Promise<void> {
  const config = await readConfig()
  config.activeBackend = id
  await writeConfig(config)
}

let runningProcess: ReturnType<typeof spawn> | null = null

export async function stopWallpaper(): Promise<void> {
  if (runningProcess) {
    runningProcess.kill('SIGTERM')
    runningProcess = null
  }
}

export interface InstallResult {
  ok: boolean
  error?: string
}

export async function installBackendTool(backendId: string): Promise<InstallResult> {
  const backend = RENDER_BACKENDS.find((b) => b.id === backendId)
  if (!backend || !backend.installCommand) {
    return { ok: false, error: "Ce backend n'a pas de commande d'installation automatique." }
  }
  return new Promise<InstallResult>((resolve) => {
    const child = spawn('pkexec', ['sh', '-c', backend.installCommand!], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.on('error', (err) => resolve({ ok: false, error: `Échec du lancement de pkexec : ${err.message}` }))
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => {
      if (code === 0) resolve({ ok: true })
      else resolve({ ok: false, error: `Installation échouée (code ${code}) : ${stderr.slice(0, 300)}` })
    })
  })
}

export async function findVideoFile(folder: string): Promise<string | null> {
  const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv']
  try {
    const entries = await fs.readdir(folder, { withFileTypes: true })
    const video = entries.find(
      (entry) =>
        entry.isFile() &&
        VIDEO_EXTENSIONS.some((ext) => entry.name.toLowerCase().endsWith(ext))
    )
    if (video) return join(folder, video.name)
  } catch {
    return null
  }
  return null
}

async function setGnomeBackground(imagePath: string): Promise<SetWallpaperResult> {
  return new Promise<SetWallpaperResult>((resolve) => {
    const uri = pathToFileURL(imagePath).href
    const child = spawn('gsettings', [
      'set',
      'org.gnome.desktop.background',
      'picture-uri',
      uri
    ])
    let settled = false
    child.on('error', (err) => {
      if (!settled) {
        settled = true
        resolve({ ok: false, error: `gsettings indisponible : ${err.message}` })
      }
    })
    let stderr = ''
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      if (code !== 0) {
        console.error(`[render:gnome] gsettings échec : ${stderr.trim()}`)
        resolve({ ok: false, error: `gsettings a échoué (code ${code}).` })
        return
      }
      const dark = spawn('gsettings', [
        'set',
        'org.gnome.desktop.background',
        'picture-uri-dark',
        uri
      ])
      dark.on('close', () => resolve({ ok: true }))
      dark.on('error', () => resolve({ ok: true }))
    })
  })
}

export async function setWallpaper(payload: SetWallpaperPayload): Promise<SetWallpaperResult> {
  const detection = await detectBackends()
  const active = detection.active
    ? RENDER_BACKENDS.find((b) => b.id === detection.active)
    : undefined

  if (!active) {
    return {
      ok: false,
      error: 'Aucun backend actif — choisissez un backend dans les Paramètres.'
    }
  }
  if (!detection.backends.some((b) => b.id === active.id && b.available)) {
    return {
      ok: false,
      error: `Backend « ${active.label} » indisponible sur cette session.`
    }
  }

  await stopWallpaper()

  if (active.id === 'gnome-static') {
    const { project, pkgPath } = await readProjectMetadata(payload.folder)
    const preview = await resolvePreview(payload.folder, payload.wallpaperId, project, pkgPath)
    if (!preview) {
      return { ok: false, error: "Aucune image d'aperçu trouvée pour ce wallpaper." }
    }
    return setGnomeBackground(preview)
  }

  const videoFile = await findVideoFile(payload.folder)
  if (!videoFile) {
    return { ok: false, error: 'Aucun fichier vidéo trouvé dans le dossier du wallpaper.' }
  }

  return new Promise<SetWallpaperResult>((resolve) => {
    const args =
      active.id === 'mpvpaper'
        ? ['-l', '0', '-s', 'fit', videoFile]
        : ['--wid=0', '--loop', '--no-audio', '--pause=no', videoFile]
    const child = spawn(active.tool!, args)

    child.on('error', (err) => {
      runningProcess = null
      resolve({ ok: false, error: `Échec du lancement : ${err.message}` })
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      console.log(`[render:${active.id}] ${chunk.toString().trim()}`)
    })
    runningProcess = child
    resolve({ ok: true })
  })
}

export function getBackendDef(id: string): RenderBackendDef | undefined {
  return RENDER_BACKENDS.find((b) => b.id === id)
}
