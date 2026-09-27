import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'
import { RENDER_BACKENDS, type RenderBackendDef, type SetWallpaperPayload, type SetWallpaperResult } from '../shared/render'
import { readConfig, writeConfig, type WorkshopConfig } from './workshop'

export interface BackendStatus {
  id: string
  available: boolean
}

export interface DetectResult {
  sessionType: 'X11' | 'Wayland'
  backends: BackendStatus[]
  active: string | null
}

function isWaylandSession(): boolean {
  return Boolean(process.env['WAYLAND_DISPLAY']) || process.env['XDG_SESSION_TYPE'] === 'wayland'
}

export function toolAvailable(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    const check = spawn('command', ['-v', tool], { shell: true })
    check.on('close', (code) => resolve(code === 0))
    check.on('error', () => resolve(false))
  })
}

export async function detectBackends(): Promise<DetectResult> {
  const sessionType = isWaylandSession() ? 'Wayland' : 'X11'
  const backends: BackendStatus[] = []
  for (const backend of RENDER_BACKENDS) {
    const compatible = backend.sessionType === sessionType
    const available = compatible && (await toolAvailable(backend.tool))
    backends.push({ id: backend.id, available })
  }
  const config = await readRenderConfig()
  return { sessionType, backends, active: config.activeBackend ?? null }
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

export async function findVideoFile(folder: string): Promise<string | null> {
  const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv']
  try {
    const entries = await fs.readdir(folder, { withFileTypes: true })
    const video = entries.find(
      (entry) => entry.isFile() && VIDEO_EXTENSIONS.some((ext) => entry.name.toLowerCase().endsWith(ext))
    )
    if (video) return join(folder, video.name)
  } catch {
    return null
  }
  return null
}

export async function setWallpaper(payload: SetWallpaperPayload): Promise<SetWallpaperResult> {
  const backends = await detectBackends()
  const active = backends.active
    ? RENDER_BACKENDS.find((b) => b.id === backends.active)
    : undefined
  if (!active) {
    return { ok: false, error: 'Aucun backend actif — choisissez un backend dans les Paramètres.' }
  }
  if (!backends.backends.some((b) => b.id === active.id && b.available)) {
    return { ok: false, error: `Backend « ${active.label} » indisponible (outil "${active.tool}" introuvable).` }
  }

  await stopWallpaper()

  const videoFile = await findVideoFile(payload.folder)
  if (!videoFile) {
    return { ok: false, error: 'Aucun fichier vidéo trouvé dans le dossier du wallpaper.' }
  }

  return new Promise<SetWallpaperResult>((resolve) => {
    const child = active.sessionType === 'Wayland'
      ? spawn(active.tool, ['-l', '0', '-s', 'fit', videoFile], { detached: false })
      : spawn(active.tool, ['--wid=0', '--loop', '--no-audio', '--pause=no', videoFile], { detached: false })

    child.on('error', (err) => {
      runningProcess = null
      resolve({ ok: false, error: `Échec du lancement : ${err.message}` })
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      if (text.includes('mpv 0.')) return
      console.log(`[render:${active.id}] ${text.trim()}`)
    })
    runningProcess = child
    resolve({ ok: true })
  })
}

export function getBackendDef(id: string): RenderBackendDef | undefined {
  return RENDER_BACKENDS.find((b) => b.id === id)
}
