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

export interface GnomeExtensionStatus {
  installed: boolean
  enabled: boolean
  version: number | null
  error?: string
}

export async function getExtensionStatus(): Promise<GnomeExtensionStatus> {
  const installedDir = installedExtensionDir()
  if (!existsSync(join(installedDir, 'metadata.json'))) {
    return { installed: false, enabled: false, version: null }
  }
  const list = await run('gnome-extensions', ['list', '--enabled'])
  if (list.code !== 0) {
    return { installed: true, enabled: false, version: null, error: list.stderr.slice(0, 200) }
  }
  const enabled = list.stdout.split('\n').some((line) => line.trim() === EXTENSION_UUID)
  return { installed: true, enabled, version: 1 }
}

export interface InstallResult {
  ok: boolean
  error?: string
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

async function extensionKnownToShell(): Promise<boolean> {
  const list = await run('gnome-extensions', ['list'])
  return list.code === 0 && list.stdout.split('\n').some((line) => line.trim() === EXTENSION_UUID)
}

async function waitForShellDetection(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await extensionKnownToShell()) return true
    await sleep(DETECT_POLL_MS)
  }
  return false
}

async function enableExtension(): Promise<InstallResult> {
  // Cycle disable/enable : recharge le code si l'extension tournait déjà.
  await run('gnome-extensions', ['disable', EXTENSION_UUID])
  const enable = await run('gnome-extensions', ['enable', EXTENSION_UUID])
  if (enable.code === 0) return { ok: true }
  return { ok: false, error: `Activation échouée : ${enable.stderr.slice(0, 300)}` }
}

export async function installExtension(): Promise<InstallResult> {
  const source = extensionSourceDir()
  if (!existsSync(join(source, 'metadata.json'))) {
    return { ok: false, error: `Sources de l'extension introuvables (${source}).` }
  }

  // 1. Staging : copie des sources + compilation des schémas, sans toucher au
  //    dossier installé (le modifier pendant la préparation décharge
  //    l'extension et la fait disparaître de gnome-extensions).
  const staging = join(app.getPath('userData'), 'extension-staging')
  await fs.rm(staging, { recursive: true, force: true })
  await cp(source, staging, { recursive: true })
  const compile = await run('glib-compile-schemas', [join(staging, 'schemas')])
  if (compile.code !== 0) {
    return { ok: false, error: `Compilation du schéma échouée : ${compile.stderr.slice(0, 300)}` }
  }

  // 2. Installation officielle : le zip remplace le dossier installé et le
  //    shell recharge l'extension via son monitor du dossier utilisateur.
  const zipResult = await zipExtension(staging)
  if (zipResult.ok && zipResult.zipPath) {
    const install = await run('gnome-extensions', ['install', '--force', zipResult.zipPath])
    if (install.code === 0) {
      // Le shell détecte le nouveau dossier de façon asynchrone : attendre
      // qu'il connaisse l'extension avant de pouvoir l'activer.
      const known = await waitForShellDetection(DETECT_TIMEOUT_MS)
      if (known) {
        const result = await enableExtension()
        if (result.ok) console.log('[gnome-extension] installée et activée (zip)')
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
  const known = await waitForShellDetection(DETECT_TIMEOUT_MS)
  if (!known) {
    return {
      ok: false,
      error:
        "Extension copiée mais le shell ne la détecte pas — reconnectez-vous pour qu'elle apparaisse, puis activez-la."
    }
  }
  const result = await enableExtension()
  if (result.ok) console.log('[gnome-extension] activée (copie manuelle)')
  return result
}

export async function setExtensionVideoPath(videoPath: string | null): Promise<void> {
  const value = videoPath ?? ''
  await run('gsettings', ['set', EXTENSION_SCHEMA, 'video-path', value])
  console.log(`[gnome-extension] video-path = ${value || '(arrêt)'}`)
}
