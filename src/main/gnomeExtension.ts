import { exec, spawn } from 'child_process'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import { cp } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'

export const EXTENSION_UUID = 'waypaper-engine@harkhenon'
export const EXTENSION_SCHEMA = 'com.harkhenon.waypaper'

const DETECT_TIMEOUT_MS = 10000
const DETECT_POLL_MS = 300

const RELOGIN_REQUIRED =
  'Nouvelle version installée — déconnectez-vous puis reconnectez-vous ' +
  'pour que GNOME Shell la charge (le shell ne recharge pas une extension ' +
  'active sans reconnexion).'

function run(
  cmd: string,
  args: string[]
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args)
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', () => resolve({ code: -1, stdout, stderr: `impossible de lancer ${cmd}` }))
    child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }))
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extensionSourceDir(): string {
  return join(app.getAppPath(), 'gnome-shell-extension')
}

function installedExtensionDir(): string {
  return join(app.getPath('home'), '.local/share/gnome-shell/extensions', EXTENSION_UUID)
}

interface MetadataInfo {
  version: number
}

async function readMetadata(dir: string): Promise<MetadataInfo | null> {
  try {
    const raw = await fs.readFile(join(dir, 'metadata.json'), 'utf-8')
    const parsed = JSON.parse(raw) as { version?: number }
    return { version: typeof parsed.version === 'number' ? parsed.version : 0 }
  } catch {
    return null
  }
}

export interface GnomeExtensionStatus {
  installed: boolean
  enabled: boolean
  version: number | null
  error?: string
}

async function shellExtensionInfo(): Promise<{
  known: boolean
  enabled: boolean
}> {
  const listAll = await run('gnome-extensions', ['list'])
  const known =
    listAll.code === 0 && listAll.stdout.split('\n').some((line) => line.trim() === EXTENSION_UUID)
  const listEnabled = await run('gnome-extensions', ['list', '--enabled'])
  const enabled =
    listEnabled.code === 0 &&
    listEnabled.stdout.split('\n').some((line) => line.trim() === EXTENSION_UUID)
  return { known, enabled }
}

export async function getExtensionStatus(): Promise<GnomeExtensionStatus> {
  const installedDir = installedExtensionDir()
  const meta = await readMetadata(installedDir)
  if (!meta) {
    return { installed: false, enabled: false, version: null }
  }
  const info = await shellExtensionInfo()
  return { installed: true, enabled: info.enabled, version: meta.version }
}

export interface InstallResult {
  ok: boolean
  error?: string
  reloginRequired?: boolean
}

interface ZipResult {
  ok: boolean
  zipPath?: string
  error?: string
}

function shq(value: string): string {
  const quote = String.fromCharCode(39)
  const escaped = value.replaceAll(quote, String.fromCharCode(39, 92, 39, 39))
  return quote + escaped + quote
}

function execAsync(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function zipExtension(staging: string): Promise<ZipResult> {
  const zipPath = join(app.getPath('userData'), `${EXTENSION_UUID}.zip`)
  try {
    await fs.rm(zipPath, { force: true })
    await execAsync(`cd ${shq(staging)} && zip -q -r ${shq(zipPath)} .`)
    return { ok: true, zipPath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

async function waitForShellDetection(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const info = await shellExtensionInfo()
    if (info.known) return true
    await sleep(DETECT_POLL_MS)
  }
  return false
}

async function enableViaCli(): Promise<InstallResult> {
  const enable = await run('gnome-extensions', ['enable', EXTENSION_UUID])
  if (enable.code === 0) return { ok: true }
  return { ok: false, error: `Activation échouée : ${enable.stderr.slice(0, 300)}` }
}

async function prepareStaging(): Promise<{ ok: boolean; staging?: string; error?: string }> {
  const source = extensionSourceDir()
  if (!existsSync(join(source, 'metadata.json'))) {
    return { ok: false, error: `Sources de l'extension introuvables (${source}).` }
  }
  const staging = join(app.getPath('userData'), 'extension-staging')
  await fs.rm(staging, { recursive: true, force: true })
  await cp(source, staging, { recursive: true })
  const compile = await run('glib-compile-schemas', [join(staging, 'schemas')])
  if (compile.code !== 0) {
    return { ok: false, error: `Compilation du schéma échouée : ${compile.stderr.slice(0, 300)}` }
  }
  const schema = await ensureUserSchema()
  if (!schema.ok) {
    return { ok: false, error: schema.error }
  }
  return { ok: true, staging }
}

/**
 * Rend le schéma visible hors du shell : le CLI gsettings et le renderer
 * cherchent dans ~/.local/share/glib-2.0/schemas/, pas dans le dossier de
 * l'extension (seul le shell y regarde via getSettings()).
 */
export async function ensureUserSchema(): Promise<InstallResult> {
  const source = extensionSourceDir()
  const schemaXml = join(source, 'schemas', `${EXTENSION_SCHEMA}.gschema.xml`)
  if (!existsSync(schemaXml)) {
    return { ok: false, error: `Schéma source introuvable (${schemaXml}).` }
  }
  const userSchemasDir = join(app.getPath('home'), '.local/share/glib-2.0/schemas')
  await fs.mkdir(userSchemasDir, { recursive: true })
  await fs.copyFile(schemaXml, join(userSchemasDir, `${EXTENSION_SCHEMA}.gschema.xml`))
  const userCompile = await run('glib-compile-schemas', [userSchemasDir])
  if (userCompile.code !== 0) {
    return {
      ok: false,
      error: `Compilation du schéma utilisateur échouée : ${userCompile.stderr.slice(0, 300)}`
    }
  }
  console.log('[gnome-extension] schéma utilisateur installé')
  return { ok: true }
}

async function schemaVisible(): Promise<boolean> {
  const check = await run('gsettings', ['list-schemas'])
  return check.code === 0 && check.stdout.split('\n').some((l) => l.trim() === EXTENSION_SCHEMA)
}

export async function installExtension(): Promise<InstallResult> {
  // État actuel : le shell connaît-il l'extension, est-elle active ?
  const before = await shellExtensionInfo()

  // 1. Rien à faire si l'extension est déjà active avec la même version.
  if (before.enabled) {
    const installedMeta = await readMetadata(installedExtensionDir())
    const sourceMeta = await readMetadata(extensionSourceDir())
    if (installedMeta && sourceMeta && installedMeta.version === sourceMeta.version) {
      console.log('[gnome-extension] déjà active et à jour')
      return { ok: true }
    }
  }

  const stagingResult = await prepareStaging()
  if (!stagingResult.ok || !stagingResult.staging) {
    return { ok: false, error: stagingResult.error }
  }
  const staging = stagingResult.staging

  // 2. Installation officielle via zip — le shell remplace le dossier et
  //    décharge l'extension chargée (elle reviendra à la reconnexion).
  const zipResult = await zipExtension(staging)
  if (zipResult.ok && zipResult.zipPath) {
    const install = await run('gnome-extensions', ['install', '--force', zipResult.zipPath])
    if (install.code === 0) {
      if (before.enabled) {
        // Le shell a déchargé l'ancienne version : reconnexion requise pour
        // charger la nouvelle. On réactive pour la prochaine session.
        await run('gnome-extensions', ['enable', EXTENSION_UUID])
        console.log('[gnome-extension] nouvelle version installée — reconnexion requise')
        return { ok: true, reloginRequired: true, error: RELOGIN_REQUIRED }
      }
      // Première installation : le shell découvre le dossier, on attend
      // qu'il le voie puis on active.
      const known = await waitForShellDetection(DETECT_TIMEOUT_MS)
      if (known) {
        const result = await enableViaCli()
        if (result.ok) {
          console.log('[gnome-extension] installée et activée (zip)')
          return { ok: true }
        }
        return result
      }
      return {
        ok: false,
        error:
          'Installée mais pas encore détectée par le shell — patientez quelques secondes puis recliquez, ou reconnectez-vous.'
      }
    }
    console.log(
      `[gnome-extension] gnome-extensions install a échoué (${install.stderr.trim().slice(0, 200)}) — repli copie manuelle`
    )
  } else {
    console.log(
      `[gnome-extension] zip non créé (${zipResult.error ?? 'erreur inconnue'}) — repli copie manuelle`
    )
  }

  // 3. Repli : copie manuelle (schémas déjà compilés dans le staging).
  const target = installedExtensionDir()
  await fs.rm(target, { recursive: true, force: true })
  await cp(staging, target, { recursive: true })
  if (before.enabled) {
    await run('gnome-extensions', ['enable', EXTENSION_UUID])
    console.log('[gnome-extension] nouvelle version copiée — reconnexion requise')
    return { ok: true, reloginRequired: true, error: RELOGIN_REQUIRED }
  }
  const known = await waitForShellDetection(DETECT_TIMEOUT_MS)
  if (!known) {
    return {
      ok: false,
      error:
        "Extension copiée mais le shell ne la détecte pas — reconnectez-vous pour qu'elle apparaisse, puis activez-la."
    }
  }
  const result = await enableViaCli()
  if (result.ok) console.log('[gnome-extension] activée (copie manuelle)')
  return result
}

export interface ExtensionPlaybackState {
  paused: boolean
  muted: boolean
  loop: boolean
  videoPath: string
}

async function readExtensionBoolean(key: 'paused' | 'mute' | 'loop'): Promise<boolean> {
  const result = await run('gsettings', ['get', EXTENSION_SCHEMA, key])
  if (result.code !== 0) {
    if (key === 'loop') return true
    return false
  }
  const value = result.stdout.trim()
  if (value !== 'true' && value !== 'false') return key === 'loop'
  return value === 'true'
}

export async function getExtensionPlaybackState(): Promise<ExtensionPlaybackState> {
  const [paused, muted, loop, videoResult] = await Promise.all([
    readExtensionBoolean('paused'),
    readExtensionBoolean('mute'),
    readExtensionBoolean('loop'),
    run('gsettings', ['get', EXTENSION_SCHEMA, 'video-path'])
  ])
  const raw = videoResult.stdout.trim()
  const videoPath = raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1) : raw
  return { paused, muted, loop, videoPath }
}

export async function setExtensionPlaybackValue(
  key: 'paused' | 'mute' | 'loop',
  value: boolean
): Promise<void> {
  const result = await run('gsettings', ['set', EXTENSION_SCHEMA, key, value ? 'true' : 'false'])
  if (result.code !== 0) {
    throw new Error(`\u00c9chec gsettings ${key} : ${result.stderr.trim().slice(0, 200)}`)
  }
  console.log(`[gnome-extension] ${key} = ${value}`)
}

export interface ExtensionMonitor {
  index: number
  name: string
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export async function getExtensionMonitors(): Promise<ExtensionMonitor[]> {
  const result = await run('gsettings', ['get', EXTENSION_SCHEMA, 'monitors-json'])
  if (result.code !== 0) return []
  const raw = result.stdout.trim()
  if (!raw || raw === "''") return []
  const json = raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1) : raw
  try {
    const parsed = JSON.parse(json) as ExtensionMonitor[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function readStringSetting(key: 'video-path' | 'video-paths'): Promise<string> {
  const result = await run('gsettings', ['get', EXTENSION_SCHEMA, key])
  if (result.code !== 0) return ''
  const raw = result.stdout.trim()
  return raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1) : raw
}

async function readVideoPaths(): Promise<Record<string, string>> {
  const raw = await readStringSetting('video-paths')
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeVideoPaths(paths: Record<string, string>): Promise<void> {
  const value = Object.keys(paths).length === 0 ? '' : JSON.stringify(paths)
  const result = await run('gsettings', ['set', EXTENSION_SCHEMA, 'video-paths', value])
  if (result.code !== 0) {
    throw new Error(`\u00c9chec gsettings video-paths : ${result.stderr.trim().slice(0, 200)}`)
  }
}

/**
 * Assigne une vidéo à un écran précis (index), ou à tous les écrans sans
 * assignation si monitorIndex est null (clé video-path). Passer null en
 * monitorIndex avec videoPath null stoppe tout le rendu.
 */
export async function setExtensionVideoPath(
  videoPath: string | null,
  monitorIndex?: number | 'all' | null
): Promise<void> {
  if (monitorIndex === 'all') {
    if (!videoPath) {
      await writeVideoPaths({})
      console.log('[gnome-extension] toutes les assignations video-paths retirées')
    }
    return
  }
  if (monitorIndex !== undefined && monitorIndex !== null) {
    const paths = await readVideoPaths()
    if (videoPath) {
      paths[String(monitorIndex)] = videoPath
    } else {
      delete paths[String(monitorIndex)]
    }
    await writeVideoPaths(paths)
    console.log(`[gnome-extension] video-paths[${monitorIndex}] = ${videoPath || '(retir\u00e9)'}`)
    return
  }
  const value = videoPath ?? ''
  let result = await run('gsettings', ['set', EXTENSION_SCHEMA, 'video-path', value])
  if (result.code !== 0 && !(await schemaVisible())) {
    // Sch\u00e9ma absent : l'installer puis retenter.
    console.log('[gnome-extension] sch\u00e9ma absent, installation puis nouvelle tentative')
    await ensureUserSchema()
    result = await run('gsettings', ['set', EXTENSION_SCHEMA, 'video-path', value])
  }
  if (result.code !== 0) {
    console.error(
      `[gnome-extension] gsettings set a \u00e9chou\u00e9 : ${result.stderr.trim().slice(0, 300)}`
    )
    throw new Error(`\u00c9chec gsettings : ${result.stderr.trim().slice(0, 200)}`)
  }
  console.log(`[gnome-extension] video-path = ${value || '(arr\u00eat)'}`)
}
