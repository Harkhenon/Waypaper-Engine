import { notifications } from '@mantine/notifications'
import { ActionIcon, Card, Group, Stack, Text, Tooltip } from '@mantine/core'
import { IconCheck, IconDeviceDesktop } from '@tabler/icons-react'
import type { Wallpaper } from '../../data/wallpaper'
import { WALLPAPER_TYPE_META } from '../../data/wallpaper'
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
  const supported = WALLPAPER_TYPE_META[wallpaper.type].supported

  const handleSet = (): void => {
    window.api.wallpaper.set(wallpaper.id)
    notifications.show({
      title: 'Wallpaper défini',
      message: `« ${wallpaper.title} » a été défini sur le bureau.`,
      color: 'teal',
      icon: <IconCheck size={18} stroke={1.5} />,
      autoClose: 3500
    })
  }

  return (
    <Card padding={0} withBorder className="wallpaper-card">
      <WallpaperPreview wallpaper={wallpaper} />
      {supported && (
        <Tooltip label="Définir comme wallpaper" position="bottom" withinPortal>
          <ActionIcon
            variant="filled"
            color="teal"
            aria-label="Définir comme wallpaper"
            pos="absolute"
            top={8}
            right={8}
            className="wallpaper-card-action"
            onClick={handleSet}
          >
            <IconDeviceDesktop size={16} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      )}
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
