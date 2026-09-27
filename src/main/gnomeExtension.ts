import { spawn } from 'child_process'
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
  const target = installedExtensionDir()
  await fs.rm(target, { recursive: true, force: true })
  await cp(source, target, { recursive: true })
  const compile = await run('glib-compile-schemas', [join(target, 'schemas')])
  if (compile.code !== 0) {
    return { ok: false, error: `Compilation du schéma échouée : ${compile.stderr.slice(0, 300)}` }
  }
  const enable = await run('gnome-extensions', ['enable', EXTENSION_UUID])
  if (enable.code !== 0) {
    return {
      ok: false,
      error: `Activation échouée : ${enable.stderr.slice(0, 300)}`
    }
  }
  console.log('[gnome-extension] installée et activée')
  return { ok: true }
}

export async function setExtensionVideoPath(videoPath: string | null): Promise<void> {
  const value = videoPath ?? ''
  await run('gsettings', ['set', EXTENSION_SCHEMA, 'video-path', value])
  console.log(`[gnome-extension] video-path = ${value || '(arrêt)'}`)
}
