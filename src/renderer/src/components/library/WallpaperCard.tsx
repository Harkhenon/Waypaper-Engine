import { ActionIcon, Card, Group, Menu, Stack, Text, Tooltip } from '@mantine/core'
import { IconDeviceDesktop, IconDeviceDesktopAnalytics } from '@tabler/icons-react'
import type { Wallpaper } from '../../data/wallpaper'
import type { ExtensionMonitorInfo } from '../../../../preload/index'
import { WALLPAPER_TYPE_META } from '../../data/wallpaper'
import WallpaperPreview from './WallpaperPreview'
import WallpaperBadges from './WallpaperBadges'

function formatSize(sizeMb: number): string {
  if (sizeMb === 0) return '—'
  if (sizeMb >= 1024) return `${(sizeMb / 1024).toFixed(1)} Go`
  return `${sizeMb} Mo`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

interface WallpaperCardProps {
  wallpaper: Wallpaper
  onSet: (wallpaper: Wallpaper, monitorIndex?: number | null) => void
  monitors: ExtensionMonitorInfo[]
}

export function WallpaperCard({ wallpaper, onSet, monitors }: WallpaperCardProps) {
  const canApply = WALLPAPER_TYPE_META[wallpaper.type].support !== 'unsupported'

  const handleSet = (): void => onSet(wallpaper)
  const handleSetOnMonitor = (index: number): void => onSet(wallpaper, index)

  return (
    <Card padding={0} withBorder className="wallpaper-card">
      <WallpaperPreview wallpaper={wallpaper} />
      {canApply && (
        <Menu position="bottom-end" withinPortal shadow="md">
          <Menu.Target>
            <ActionIcon
              variant="filled"
              color="teal"
              aria-label="Appliquer le wallpaper"
              pos="absolute"
              top={8}
              right={8}
              className="wallpaper-card-action"
            >
              <IconDeviceDesktop size={16} stroke={1.5} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Appliquer sur</Menu.Label>
            <Menu.Item
              leftSection={<IconDeviceDesktop size={14} stroke={1.5} />}
              onClick={handleSet}
            >
              Tous les écrans
            </Menu.Item>
            {monitors.map((monitor) => (
              <Menu.Item
                key={monitor.index}
                leftSection={<IconDeviceDesktopAnalytics size={14} stroke={1.5} />}
                onClick={() => handleSetOnMonitor(monitor.index)}
              >
                {monitor.name}
                {monitor.connector && monitor.connector !== monitor.name && (
                  <Text size="xs" c="anthracite.3" component="span">
                    {' '}
                    · {monitor.connector}
                  </Text>
                )}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
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
