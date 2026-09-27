import { useMemo } from 'react'
import { Alert, Badge, Button, Card, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { ExtensionMonitorInfo } from '../../../../preload/index'
import { MOCK_MONITORS } from '../../data/mock/monitors'

const STATUS_META = {
  idle: { label: 'Inactif', color: 'anthracite.4' },
  starting: { label: 'Démarrage', color: 'blue' },
  running: { label: 'En lecture', color: 'teal' },
  paused: { label: 'En pause', color: 'yellow' },
  stopped: { label: 'Arrêté', color: 'anthracite.4' },
  error: { label: 'Erreur', color: 'red' }
} as const

interface MonitorsViewProps {
  monitors: ExtensionMonitorInfo[]
  loading: boolean
  onRefresh: () => void
}

export function MonitorsView({ monitors, loading, onRefresh }: MonitorsViewProps) {
  const display = useMemo(() => {
    if (monitors.length > 0) {
      return monitors.map((m) => ({
        id: `monitor-${m.index}`,
        name: m.name,
        connector: m.connector,
        width: m.width,
        height: m.height,
        scale: m.scale
      }))
    }
    return MOCK_MONITORS.map((m) => ({
      id: m.id,
      name: m.name,
      connector: m.name,
      width: m.width,
      height: m.height,
      scale: m.scale
    }))
  }, [monitors])

  const isRealData = monitors.length > 0

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
        {display.map((monitor) => {
          const status = STATUS_META.running
          return (
            <Card key={monitor.id} withBorder padding="md">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Group gap="sm">
                    <Text fw={600}>{monitor.name}</Text>
                    <Badge variant="light" color={isRealData ? status.color : 'anthracite.4'}>
                      {isRealData ? status.label : 'Démo'}
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
                      —
                    </Text>
                  </Stack>
                </Paper>
              </Group>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}

export default MonitorsView
