import { Badge, Grid, Group, Select, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { IconInfoCircle, IconSearch } from '@tabler/icons-react'
import {
  WALLPAPER_TYPES,
  WALLPAPER_TYPE_META,
  type SupportLevel,
  type WallpaperType
} from '../../data/wallpaper'
import { SORT_OPTIONS, type SortValue, type TypeFilterValue } from '../../data/filters'

interface LibraryFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  typeFilter: TypeFilterValue
  onTypeFilterChange: (value: TypeFilterValue) => void
  sort: SortValue
  onSortChange: (value: SortValue) => void
}

const SUPPORT_GROUPS: { level: SupportLevel; label: string; color: string }[] = [
  { level: 'supported', label: 'Compatibles', color: 'teal' },
  { level: 'partial', label: 'Support partiel', color: 'yellow' },
  { level: 'unsupported', label: 'Non supportés', color: 'red' }
]

const typesForLevel = (level: SupportLevel): WallpaperType[] =>
  WALLPAPER_TYPES.filter((t) => WALLPAPER_TYPE_META[t].support === level)

const groupExplanation = (level: SupportLevel) => (
  <Stack gap={6}>
    {typesForLevel(level).map((t) => (
      <Text key={t} size="xs">
        <Text size="xs" fw={600} component="span">
          {WALLPAPER_TYPE_META[t].label} —{' '}
        </Text>
        {WALLPAPER_TYPE_META[t].supportExplanation}
      </Text>
    ))}
  </Stack>
)

export function LibraryFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sort,
  onSortChange
}: LibraryFiltersProps) {
  return (
    <Grid gap="sm" align="flex-end">
      <Grid.Col span={{ base: 12, sm: 8 }}>
        <TextInput
          placeholder="Rechercher par titre, auteur, tag…"
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          leftSection={<IconSearch size={16} stroke={1.5} />}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Select
          label="Trier par"
          data={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={sort}
          onChange={(v) => onSortChange((v ?? 'recent') as SortValue)}
          allowDeselect={false}
        />
      </Grid.Col>
      {SUPPORT_GROUPS.map((group) => {
        const types = typesForLevel(group.level)
        if (types.length === 0) return null
        const active = typeFilter !== 'all' && types.includes(typeFilter)
        return (
          <Grid.Col key={group.level} span={{ base: 12, sm: 4 }}>
            <Select
              allowDeselect={false}
              label={
                group.level === 'supported' ? (
                  group.label
                ) : (
                  <Group gap={6} wrap="nowrap">
                    <span>{group.label}</span>
                    <Tooltip
                      label={groupExplanation(group.level)}
                      multiline
                      maw={340}
                      position="top"
                      withinPortal
                    >
                      <Badge size="xs" variant="light" color={group.color} circle>
                        <IconInfoCircle size={11} stroke={1.5} />
                      </Badge>
                    </Tooltip>
                  </Group>
                )
              }
              data={[
                { value: 'all', label: 'Tous' },
                ...types.map((t) => ({ value: t, label: WALLPAPER_TYPE_META[t].label }))
              ]}
              value={active ? typeFilter : 'all'}
              onChange={(v) => onTypeFilterChange((v ?? 'all') as TypeFilterValue)}
            />
          </Grid.Col>
        )
      })}
    </Grid>
  )
}

export default LibraryFilters
