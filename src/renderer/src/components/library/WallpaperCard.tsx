import { Card, Group, Stack, Text, Tooltip } from '@mantine/core'
import type { Wallpaper } from '../../data/wallpaper'
import WallpaperPreview from './WallpaperPreview'
import WallpaperBadges from './WallpaperBadges'

function formatSize(sizeMb: number): string {
  if (sizeMb === 0) return '—'
  if (sizeMb >= 1024) return `${(sizeMb / 1024).toFixed(1)} Go`
  return `${sizeMb} Mo`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function WallpaperCard({ wallpaper }: { wallpaper: Wallpaper }) {
  return (
    <Card padding={0} withBorder>
      <WallpaperPreview wallpaper={wallpaper} />
      <Stack gap="xs" p="sm">
        <Tooltip label={wallpaper.title} position="top" withinPortal>
          <Text size="sm" fw={600} truncate>
            {wallpaper.title}
          </Text>
        </Tooltip>
        <Group justify="space-between" gap="xs">
          <WallpaperBadges wallpaper={wallpaper} />
          <Tooltip label={`Par ${wallpaper.author}`} position="top" withinPortal>
            <Text size="xs" c="anthracite.3" truncate maw={100}>
              {wallpaper.author}
            </Text>
          </Tooltip>
        </Group>
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="anthracite.3">
            {formatDate(wallpaper.updatedAt)}
          </Text>
          <Text size="xs" c="anthracite.3">
            {formatSize(wallpaper.sizeMb)}
          </Text>
        </Group>
      </Stack>
    </Card>
  )
}

export default WallpaperCard
