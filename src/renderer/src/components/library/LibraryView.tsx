import { useMemo, useState } from 'react'
import { Grid, Select, Stack, Text, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import type { Wallpaper } from '../../data/wallpaper'
import { WALLPAPER_TYPE_META } from '../../data/wallpaper'
import { MOCK_WALLPAPERS } from '../../data/mock/wallpapers'
import { SORT_OPTIONS, TYPE_FILTER_OPTIONS, type SortValue, type TypeFilterValue } from '../../data/filters'
import WallpaperCard from './WallpaperCard'

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

export function LibraryView() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('all')
  const [sort, setSort] = useState<SortValue>('recent')

  const filtered = useMemo(
    () => applyFilters(MOCK_WALLPAPERS, search, typeFilter, sort),
    [search, typeFilter, sort]
  )

  return (
    <Stack gap="md" h="100%">
      <Grid gap="sm" align="flex-end">
        <Grid.Col span={6}>
          <TextInput
            placeholder="Rechercher par titre, auteur, tag…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={16} stroke={1.5} />}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Type"
            data={TYPE_FILTER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label
            }))}
            value={typeFilter}
            onChange={(v) => setTypeFilter((v ?? 'all') as TypeFilterValue)}
            allowDeselect={false}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Trier par"
            data={SORT_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label
            }))}
            value={sort}
            onChange={(v) => setSort((v ?? 'recent') as SortValue)}
            allowDeselect={false}
          />
        </Grid.Col>
      </Grid>

      <Text size="xs" c="anthracite.3">
        {filtered.length} wallpaper{filtered.length > 1 ? 's' : ''} affiché
        {filtered.length > 1 ? 's' : ''}
        {filtered.some((w) => !WALLPAPER_TYPE_META[w.type].supported) && (
          <Text size="xs" c="anthracite.3" span>
            {' '}
            — certains items ne sont pas encore supportés
          </Text>
        )}
      </Text>

      <Grid gap="md">
        {filtered.map((wallpaper) => (
          <Grid.Col key={wallpaper.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <WallpaperCard wallpaper={wallpaper} />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  )
}

export default LibraryView
