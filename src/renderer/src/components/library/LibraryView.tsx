import { useMemo, useState } from 'react'
import { Center, Grid, Loader, Stack, Text, Title } from '@mantine/core'
import type { Wallpaper } from '../../data/wallpaper'
import type { ExtensionMonitorInfo } from '../../../../preload/index'
import { toWallpaper, type ScannedWorkshopItem } from '../../hooks/useWorkshop'
import { type SortValue, type TypeFilterValue } from '../../data/filters'
import WallpaperCard from './WallpaperCard'
import LibraryFilters from './LibraryFilters'

function applyFilters(
  wallpapers: Wallpaper[],
  search: string,
  typeFilter: TypeFilterValue,
  sort: SortValue
): Wallpaper[] {
  const searchLower = search.trim().toLowerCase()
  const filtered = wallpapers.filter((w) => {
    const matchesType = typeFilter === 'all' || w.type === typeFilter
    const matchesSearch =
      searchLower === '' ||
      w.title.toLowerCase().includes(searchLower) ||
      w.author.toLowerCase().includes(searchLower) ||
      w.tags.some((tag) => tag.includes(searchLower))
    return matchesType && matchesSearch
  })
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
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('all')
  const [sort, setSort] = useState<SortValue>('recent')

  const wallpapers = useMemo(() => items.map(toWallpaper), [items])
  const filtered = useMemo(
    () => applyFilters(wallpapers, search, typeFilter, sort),
    [wallpapers, search, typeFilter, sort]
  )

  return (
    <Stack gap="md" h="100%">
      <LibraryFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sort={sort}
        onSortChange={setSort}
      />
      <Text size="xs" c="anthracite.3">
        {filtered.length} wallpaper{filtered.length > 1 ? 's' : ''} affiché
        {filtered.length > 1 ? 's' : ''}
      </Text>
      {scanning && (
        <Center>
          <Loader color="anthracite.3" />
        </Center>
      )}
      {!scanning && filtered.length === 0 && (
        <Center h={300}>
          <Stack align="center" gap="xs">
            <Title order={4} c="anthracite.2">
              {items.length === 0 ? 'Aucun wallpaper importé' : 'Aucun résultat'}
            </Title>
            <Text size="sm" c="anthracite.3">
              {items.length === 0
                ? 'Configurez le dossier Workshop dans les Paramètres pour importer vos wallpapers.'
                : 'Essayez une autre recherche ou un autre filtre.'}
            </Text>
          </Stack>
        </Center>
      )}
      {!scanning && filtered.length > 0 && (
        <Grid gap="md">
          {filtered.map((wallpaper) => (
            <Grid.Col key={wallpaper.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <WallpaperCard wallpaper={wallpaper} onSet={onSet} monitors={monitors} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Stack>
  )
}

export default LibraryView
