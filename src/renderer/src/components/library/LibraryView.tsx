import { useMemo, useState } from 'react'
import { Center, Loader, Stack, Text, Title } from '@mantine/core'
import type { Wallpaper } from '../../data/wallpaper'
import type { ExtensionMonitorInfo } from '../../../../preload/index'
import { toWallpaper, type ScannedWorkshopItem } from '../../hooks/useWorkshop'
import type { SortValue } from '../../data/filters'
import LibraryFilters from './LibraryFilters'
import LibrarySupportSection from './LibrarySupportSection'

function applyFilters(wallpapers: Wallpaper[], search: string, sort: SortValue): Wallpaper[] {
  const searchLower = search.trim().toLowerCase()
  const filtered = wallpapers.filter(
    (w) =>
      searchLower === '' ||
      w.title.toLowerCase().includes(searchLower) ||
      w.author.toLowerCase().includes(searchLower) ||
      w.tags.some((tag) => tag.includes(searchLower))
  )
  const sorted = [...filtered]
  switch (sort) {
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr'))
      break
    case 'size':
      sorted.sort((a, b) => b.sizeMb - a.sizeMb)
      break
    case 'recent':
    default:
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  return sorted
}

interface LibraryViewProps {
  items: ScannedWorkshopItem[]
  scanning: boolean
  onSet: (wallpaper: Wallpaper, monitorIndex?: number | null) => void
  monitors: ExtensionMonitorInfo[]
}

export function LibraryView({ items, scanning, onSet, monitors }: LibraryViewProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortValue>('recent')

  const wallpapers = useMemo(() => items.map(toWallpaper), [items])
  const filtered = useMemo(() => applyFilters(wallpapers, search, sort), [wallpapers, search, sort])

  return (
    <Stack gap="md" h="100%">
      <LibraryFilters
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />
      {scanning && (
        <Center>
          <Loader color="anthracite.3" />
        </Center>
      )}
      {!scanning && items.length === 0 && (
        <Center h={300}>
          <Stack align="center" gap="xs">
            <Title order={4} c="anthracite.2">
              Aucun wallpaper importé
            </Title>
            <Text size="sm" c="anthracite.3">
              Configurez le dossier Workshop dans les Paramètres pour importer vos wallpapers.
            </Text>
          </Stack>
        </Center>
      )}
      {!scanning && items.length > 0 && filtered.length === 0 && (
        <Center h={300}>
          <Stack align="center" gap="xs">
            <Title order={4} c="anthracite.2">
              Aucun résultat
            </Title>
            <Text size="sm" c="anthracite.3">
              Essayez une autre recherche.
            </Text>
          </Stack>
        </Center>
      )}
      {!scanning && filtered.length > 0 && (
        <LibrarySupportSection wallpapers={filtered} monitors={monitors} onSet={onSet} />
      )}
    </Stack>
  )
}

export default LibraryView
