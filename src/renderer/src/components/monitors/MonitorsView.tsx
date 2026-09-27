import { useMemo } from 'react'
import { Alert, Badge, Button, Card, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconPlayerPause, IconPlayerPlay, IconRefresh } from '@tabler/icons-react'
import type {
  ExtensionMonitorInfo,
  GnomeExtensionPlaybackState,
  ScannedWorkshopItem
} from '../../../../preload/index'
import { MOCK_MONITORS } from '../../data/mock/monitors'

interface MonitorCardData {
  id: string
  index: number
  name: string
  connector: string
  width: number
  height: number
  scale: number
  wallpaperTitle: string | null
}

interface MonitorCardProps {
  monitor: MonitorCardData
  status: 'running' | 'paused' | 'idle' | 'demo'
}

const STATUS_META: Record<MonitorCardProps['status'], { label: string; color: string }> = {
  running: { label: 'En lecture', color: 'teal' },
  paused: { label: 'En pause', color: 'yellow' },
  idle: { label: 'Inactif', color: 'anthracite.4' },
  demo: { label: 'Démo', color: 'anthracite.4' }
}

function MonitorCard({ monitor, status }: MonitorCardProps) {
  const meta = STATUS_META[status]
  return (
    <Card withBorder padding="md">
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4}>
          <Group gap="sm">
            <Text fw={600}>{monitor.name}</Text>
            <Badge size="sm" variant="light" color={meta.color}>
              {status === 'running' ? <IconPlayerPlay size={12} stroke={1.5} /> : null}
              {status === 'paused' ? <IconPlayerPause size={12} stroke={1.5} /> : null}
              {meta.label}
            </Badge>
          </Group>
          <Text size="xs" c="anthracite.3">
            {monitor.connector && monitor.connector !== monitor.name
              ? `${monitor.connector} · `
              : ''}
            {monitor.width}×{monitor.height}
            {monitor.scale !== 1 && ` · échelle ${monitor.scale}`}
          </Text>
        </Stack>
        <Paper px="sm" py="xs" withBorder>
          <Stack gap={2} align="center">
            <Text size="xs" c="anthracite.3">
              Wallpaper
            </Text>
            <Text size="sm" fw={500}>
              {monitor.wallpaperTitle ?? '—'}
            </Text>
          </Stack>
        </Paper>
      </Group>
    </Card>
  )
}

interface MonitorsViewProps {
  monitors: ExtensionMonitorInfo[]
  loading: boolean
  playback: GnomeExtensionPlaybackState | null
  wallpapers: ScannedWorkshopItem[]
  onRefresh: () => void
}

export function MonitorsView({
  monitors,
  loading,
  playback,
  wallpapers,
  onRefresh
}: MonitorsViewProps) {
  const isRealData = monitors.length > 0

  const display = useMemo<MonitorCardData[]>(() => {
    const resolveWallpaperTitle = (videoPath: string | undefined): string | null => {
      if (!videoPath) return null
      const match = wallpapers.find((item) => videoPath.startsWith(item.folder))
      return match?.title ?? null
    }
    if (isRealData) {
      return monitors.map((m) => {
        const assigned = playback?.videoPaths?.[String(m.index)] ?? playback?.videoPath ?? undefined
        return {
          id: `monitor-${m.index}`,
          index: m.index,
          name: m.name,
          connector: m.connector,
          width: m.width,
          height: m.height,
          scale: m.scale,
          wallpaperTitle: resolveWallpaperTitle(assigned)
        }
      })
    }
    return MOCK_MONITORS.map((m, i) => ({
      id: m.id,
      index: i,
      name: m.name,
      connector: m.name,
      width: m.width,
      height: m.height,
      scale: m.scale,
      wallpaperTitle: null
    }))
  }, [isRealData, monitors, playback, wallpapers])

  const statusFor = (monitor: MonitorCardData): MonitorCardProps['status'] => {
    if (!isRealData) return 'demo'
    if (!monitor.wallpaperTitle) return 'idle'
    return playback?.paused ? 'paused' : 'running'
  }

  return (
    <Stack gap="md" maw={560}>
      <Group justify="space-between">
        <Title order={3}>Écrans</Title>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconRefresh size={14} stroke={1.5} />}
          loading={loading}
          onClick={onRefresh}
        >
          Actualiser
        </Button>
      </Group>
      {!isRealData && (
        <Alert color="blue" title="Écrans de démonstration">
          L'extension GNOME Shell n'a publié aucune liste d'écrans — installez-la ou activez-la dans
          les Paramètres pour afficher vos moniteurs réels.
        </Alert>
      )}
      <Stack gap="md">
        {display.map((monitor) => (
          <MonitorCard key={monitor.id} monitor={monitor} status={statusFor(monitor)} />
        ))}
      </Stack>
    </Stack>
  )
}

export default MonitorsView
