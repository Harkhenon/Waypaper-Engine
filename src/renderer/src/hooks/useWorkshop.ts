import { useCallback, useEffect, useState } from 'react'
export interface DetectedWorkshopFolder {
  value: string
  label: string
  path: string
}

export interface ScannedWorkshopItem {
  id: string
  folder: string
  title: string
  type: string
  preview: string | null
  sizeMb: number
}
import type { Wallpaper, WallpaperType } from '../data/wallpaper'

const VALID_TYPES: WallpaperType[] = ['video', 'web', 'scene', 'application', 'playlist']

export function toWallpaper(item: ScannedWorkshopItem): Wallpaper {
  const type = VALID_TYPES.includes(item.type as WallpaperType)
    ? (item.type as WallpaperType)
    : 'application'

  const base = {
    id: item.id,
    workshopId: item.id,
    title: item.title,
    author: '—',
    description: '',
    preview: item.preview ?? '',
    tags: [] as string[],
    sizeMb: item.sizeMb,
    updatedAt: '',
    folder: item.folder
  }

  switch (type) {
    case 'video':
      return { ...base, type, content: { videoFile: '', width: 0, height: 0, hasAudio: false } }
    case 'web':
      return { ...base, type, content: { entryFile: '', width: 0, height: 0 } }
    case 'scene':
      return { ...base, type, content: { sceneFile: '', width: 0, height: 0 } }
    case 'playlist':
      return { ...base, type, content: { children: [] } }
    default:
      return { ...base, type: 'application', content: { executable: '' } }
  }
}

export function useWorkshop() {
  const [folder, setFolder] = useState<string | null>(null)
  const [items, setItems] = useState<ScannedWorkshopItem[]>([])
  const [detectedFolders, setDetectedFolders] = useState<DetectedWorkshopFolder[]>([])
  const [scanning, setScanning] = useState(false)

  const scan = useCallback(async (): Promise<void> => {
    setScanning(true)
    try {
      const result = await window.api.workshop.scan()
      setFolder(result.folder)
      setItems(result.items)
    } finally {
      setScanning(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      const detected = await window.api.workshop.detectFolders()
      const result = await window.api.workshop.scan()
      if (cancelled) return
      setDetectedFolders(detected)
      setFolder(result.folder)
      setItems(result.items)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const pickAndSetFolder = useCallback(async (): Promise<string | null> => {
    const picked = await window.api.workshop.pickFolder()
    if (!picked) return null
    await window.api.workshop.setFolder(picked)
    await scan()
    return picked
  }, [scan])

  const setFolderAndScan = useCallback(async (path: string): Promise<void> => {
    await window.api.workshop.setFolder(path)
    await scan()
  }, [scan])

  const openSteamStore = useCallback((): void => {
    window.api.workshop.openSteamStore()
  }, [])

  const refreshDetected = useCallback(async (): Promise<void> => {
    const detected = await window.api.workshop.detectFolders()
    setDetectedFolders(detected)
  }, [])

  return {
    folder,
    items,
    detectedFolders,
    scanning,
    scan,
    pickAndSetFolder,
    setFolderAndScan,
    openSteamStore,
    refreshDetected
  }
}
