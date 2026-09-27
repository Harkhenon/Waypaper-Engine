import { app } from 'electron'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'

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
