import { promises as fs } from 'fs'
import { join } from 'path'

export interface PkgEntry {
  fullPath: string
  offset: number
  length: number
}

export interface PkgContents {
  magic: string
  dataStart: number
  entries: PkgEntry[]
}

const MAGIC_PREFIX = 'PKG'
const MAGIC_MAX_LENGTH = 32
const PATH_MAX_LENGTH = 255
const MAX_ENTRIES = 100000

export function parsePkg(buffer: Buffer): PkgContents {
  if (buffer.byteLength < 8) {
    throw new Error('Fichier .pkg trop court')
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let cursor = 0

  const readString = (maxLength: number): string => {
    const size = view.getInt32(cursor, true)
    cursor += 4
    const bounded = Math.min(Math.max(size, 0), maxLength)
    const value = buffer.subarray(cursor, cursor + bounded).toString('utf-8')
    cursor += bounded
    return value
  }

  const magic = readString(MAGIC_MAX_LENGTH)
  if (!magic.startsWith(MAGIC_PREFIX)) {
    throw new Error(`Magic .pkg invalide : "${magic}"`)
  }

  const entryCount = view.getInt32(cursor, true)
  cursor += 4
  if (entryCount < 0 || entryCount > MAX_ENTRIES) {
    throw new Error(`Nombre d'entrées .pkg invalide : ${entryCount}`)
  }

  const entries: PkgEntry[] = []
  for (let i = 0; i < entryCount; i += 1) {
    const fullPath = readString(PATH_MAX_LENGTH)
    const offset = view.getInt32(cursor, true)
    cursor += 4
    const length = view.getInt32(cursor, true)
    cursor += 4
    if (offset < 0 || length < 0 || offset + length > buffer.byteLength - cursor) {
      throw new Error(`Entrée .pkg incohérente : "${fullPath}"`)
    }
    entries.push({ fullPath, offset, length })
  }

  return { magic, dataStart: cursor, entries }
}

export function readEntry(buffer: Buffer, contents: PkgContents, entry: PkgEntry): Buffer {
  const start = contents.dataStart + entry.offset
  return buffer.subarray(start, start + entry.length)
}

export async function findPkgFile(folder: string): Promise<string | null> {
  const entries = await fs.readdir(folder, { withFileTypes: true })
  const pkg = entries.find((entry) => entry.isFile() && entry.name.endsWith('.pkg'))
  return pkg ? join(folder, pkg.name) : null
}

export async function readProjectFromPkg(
  pkgPath: string
): Promise<Record<string, unknown> | null> {
  const buffer = await fs.readFile(pkgPath)
  const contents = parsePkg(buffer)
  const entry = contents.entries.find(
    (candidate) => candidate.fullPath.toLowerCase() === 'project.json'
  )
  if (!entry) return null

  const raw = readEntry(buffer, contents, entry).toString('utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}
