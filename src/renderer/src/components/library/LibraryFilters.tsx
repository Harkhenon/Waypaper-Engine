import { Grid, Select, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { SORT_OPTIONS, type SortValue } from '../../data/filters'

interface LibraryFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  sort: SortValue
  onSortChange: (value: SortValue) => void
}

export function LibraryFilters({
  search,
  onSearchChange,
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
    </Grid>
  )
}

export default LibraryFilters
