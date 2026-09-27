import { Badge, Card, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { MOCK_MONITORS, MOCK_PLAYBACK_STATES } from '../../data/mock/monitors'

const STATUS_META = {
  idle: { label: 'Inactif', color: 'anthracite.4' },
  starting: { label: 'Démarrage', color: 'blue' },
  running: { label: 'En lecture', color: 'teal' },
  paused: { label: 'En pause', color: 'yellow' },
  stopped: { label: 'Arrêté', color: 'anthracite.4' },
  error: { label: 'Erreur', color: 'red' }
} as const

export function MonitorsView() {
  return (
    <Stack gap="md">
      <Title order={3}>Écrans</Title>
      <Stack gap="md">
        {MOCK_MONITORS.map((monitor) => {
          const playback = MOCK_PLAYBACK_STATES.find(
            (p) => p.monitorId === monitor.id
          )
          const status = playback
            ? STATUS_META[playback.status]
            : STATUS_META.idle

          return (
            <Card key={monitor.id} withBorder padding="md">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Group gap="sm">
                    <Text fw={600}>{monitor.name}</Text>
                    <Badge variant="light" color={status.color}>
                      {status.label}
                    </Badge>
                  </Group>
                  <Text size="xs" c="anthracite.3">
                    {monitor.width}×{monitor.height} · {monitor.refreshRate} Hz
                    {monitor.scale !== 1 && ` · échelle ${monitor.scale}`}
                  </Text>
                </Stack>
                <Paper px="sm" py="xs" withBorder>
                  <Stack gap={2} align="center">
                    <Text size="xs" c="anthracite.3">
                      Wallpaper
                    </Text>
                    <Text size="sm" fw={500}>
                      {playback?.wallpaperId ?? '—'}
                    </Text>
                    {playback && playback.status === 'running' && (
                      <Text size="xs" c="teal.5">
                        {playback.fps} FPS
                      </Text>
                    )}
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
