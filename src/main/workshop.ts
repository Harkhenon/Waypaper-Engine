import { app } from 'electron'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { DEFAULT_WORKSHOP_FOLDERS, WORKSHOP_APP_ID } from '../shared/workshop'

interface WorkshopConfig {
  folder: string | null
}

interface ScannedItem {
  id: string
  folder: string
  title: string
  type: string
  preview: string | null
  sizeMb: number
}

const CONFIG_FILE = 'waypaper-config.json'

function configPath(): string {
  return join(app.getPath('userData'), CONFIG_FILE)
}

export async function readConfig(): Promise<WorkshopConfig> {
  try {
    const raw = await fs.readFile(configPath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<WorkshopConfig>
    return { folder: parsed.folder ?? null }
  } catch {
    return { folder: null }
  }
}

export async function writeConfig(config: WorkshopConfig): Promise<void> {
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2), 'utf-8')
}

async function folderSizeMb(folder: string): Promise<number> {
  let total = 0
  const entries = await fs.readdir(folder, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(folder, entry.name)
    if (entry.isDirectory()) {
      total += await folderSizeMb(full)
    } else {
      const stat = await fs.stat(full)
      total += stat.size
    }
  }
  return Math.round(total / (1024 * 1024))
}

export async function scanWorkshopFolder(folder: string): Promise<ScannedItem[]> {
  const resolved = resolve(folder.replace(/^~(?=$|\/)/, app.getPath('home')))
  const entries = await fs.readdir(resolved, { withFileTypes: true })

  const items: ScannedItem[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const itemFolder = join(resolved, entry.name)
    try {
      const projectRaw = await fs.readFile(join(itemFolder, 'project.json'), 'utf-8')
      const project = JSON.parse(projectRaw) as Record<string, unknown>
      items.push({
        id: entry.name,
        folder: itemFolder,
        title: typeof project.title === 'string' ? project.title : entry.name,
        type: typeof project.type === 'string' ? project.type : 'unknown',
        preview:
          typeof project.preview === 'string'
            ? join(itemFolder, project.preview)
            : null,
        sizeMb: await folderSizeMb(itemFolder)
      })
    } catch {
      items.push({
        id: entry.name,
        folder: itemFolder,
        title: entry.name,
        type: 'unknown',
        preview: null,
        sizeMb: await folderSizeMb(itemFolder)
      })
    }
  }
  return items
}

export interface DetectedFolder {
  value: string
  label: string
  path: string
}

const STEAM_LIBRARY_CONFIGS = [
  '~/.local/share/Steam/steamapps/libraryfolders.vdf',
  '~/.steam/steam/steamapps/libraryfolders.vdf',
  '~/.steam/debian-installation/steamapps/libraryfolders.vdf',
  '~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/libraryfolders.vdf',
  '~/snap/steam/common/.local/share/Steam/steamapps/libraryfolders.vdf'
]

async function directoryExists(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path)
    return stat.isDirectory()
  } catch {
    return false
  }
}

async function readSteamLibraries(): Promise<string[]> {
  const home = app.getPath('home')
  const libraries: string[] = []
  for (const configLocation of STEAM_LIBRARY_CONFIGS) {
    try {
      const raw = await fs.readFile(configLocation.replace(/^~/, home), 'utf-8')
      const matches = raw.matchAll(/"path"\s+"((?:[^"\\]|\\.)*)"/g)
      for (const match of matches) {
        libraries.push(match[1].replace(/\\\\/g, '\\'))
      }
    } catch {
      // fichier absent — installation Steam non détectée à cet emplacement
    }
  }
  return [...new Set(libraries)]
}

export async function detectWorkshopFolders(): Promise<DetectedFolder[]> {
  const home = app.getPath('home')
  const detected: DetectedFolder[] = []
  const seen = new Set<string>()

  const push = async (value: string, label: string, path: string): Promise<void> => {
    const resolved = resolve(path)
    if (seen.has(resolved)) return
    if (await directoryExists(resolved)) {
      seen.add(resolved)
      detected.push({ value, label, path: resolved })
    }
  }

  for (const folder of DEFAULT_WORKSHOP_FOLDERS) {
    await push(folder.value, folder.label, folder.path.replace(/^~/, home))
  }

  for (const library of await readSteamLibraries()) {
    const shortPath = library.replace(/^~/, home).startsWith(home)
      ? library.replace(home, '~')
      : library
    await push(
      `library-${shortPath}`,
      `Bibliothèque Steam (${shortPath})`,
      join(library, 'steamapps', 'workshop', 'content', WORKSHOP_APP_ID)
    )
  }

  return detected
}
