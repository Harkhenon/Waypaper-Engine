import { exec, spawn } from 'child_process'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import { cp } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'

export const EXTENSION_UUID = 'waypaper-engine@harkhenon'
export const EXTENSION_SCHEMA = 'com.harkhenon.waypaper'

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

export async function installExtension(): Promise<InstallResult> {
  const source = extensionSourceDir()
  if (!existsSync(join(source, 'metadata.json'))) {
    return { ok: false, error: `Sources de l'extension introuvables (${source}).` }
  }

  // 1. Copie locale (supporte les shells qui n'ont pas l'API D-Bus d'install)
  const target = installedExtensionDir()
  await fs.rm(target, { recursive: true, force: true })
  await cp(source, target, { recursive: true })
  const compile = await run('glib-compile-schemas', [join(target, 'schemas')])
  if (compile.code !== 0) {
    return { ok: false, error: `Compilation du schéma échouée : ${compile.stderr.slice(0, 300)}` }
  }

  // 2. Enregistrement à chaud auprès du shell : l'extension n'est vue par
  // gnome-extensions qu'après ce passage (ou un redémarrage du shell).
  // On zippe le dossier cible (schémas déjà compilés) car l'installation
  // remplace le contenu du dossier d'extension par celui du zip.
  const zipResult = await zipExtension(target)
  if (zipResult.ok && zipResult.zipPath) {
    const install = await run('gnome-extensions', ['install', zipResult.zipPath])
    if (install.code === 0) {
      const enable = await run('gnome-extensions', ['enable', EXTENSION_UUID])
      if (enable.code === 0) {
        console.log('[gnome-extension] installée et activée (zip)')
        return { ok: true }
      }
      return {
        ok: false,
        error: `Activation échouée : ${enable.stderr.slice(0, 300)}`
      }
    }
    // install indisponible ou échoué (ex. shell non-EOG-style) : la copie
    // locale reste en place, l'utilisateur devra se reconnecter.
    console.log(
      `[gnome-extension] gnome-extensions install a échoué (${install.stderr.trim().slice(0, 200)}) — la copie locale reste en place`
    )
  } else {
    console.log(
      `[gnome-extension] zip non créé (${zipResult.error ?? 'erreur inconnue'}) — copie locale uniquement`
    )
  }

  // 3. Repli : activer directement (fonctionne si le shell a déjà scanné le dossier)
  const enable = await run('gnome-extensions', ['enable', EXTENSION_UUID])
  if (enable.code === 0) {
    console.log('[gnome-extension] activée après copie locale')
    return { ok: true }
  }
  return {
    ok: false,
    error:
      "Extension copiée mais invisible pour le shell. Déconnectez-vous puis reconnectez-vous pour qu'elle apparaisse, puis activez-la."
  }
}

interface ZipResult {
  ok: boolean
  zipPath?: string
  error?: string
}

async function zipExtension(source: string): Promise<ZipResult> {
  const zipPath = join(app.getPath('userData'), `${EXTENSION_UUID}.zip`)
  try {
    await fs.rm(zipPath, { force: true })
    await execAsync(`cd ${shq(source)} && zip -q -r ${shq(zipPath)} .`)
    return { ok: true, zipPath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function shq(value: string): string {
  const escaped = value.replaceAll(String.fromCharCode(39), String.fromCharCode(39, 92, 39, 39))
  return String.fromCharCode(39) + escaped + String.fromCharCode(39)
}

function execAsync(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function setExtensionVideoPath(videoPath: string | null): Promise<void> {
  const value = videoPath ?? ''
  await run('gsettings', ['set', EXTENSION_SCHEMA, 'video-path', value])
  console.log(`[gnome-extension] video-path = ${value || '(arrêt)'}`)
}
