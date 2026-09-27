import { ActionIcon, Alert, Group, Radio, Stack, Text } from '@mantine/core'
import { IconRefreshDot } from '@tabler/icons-react'
import type { RenderState } from '../../hooks/useRender'

interface RenderBackendSectionProps {
  state: RenderState
  detecting: boolean
  onDetect: () => void
  onSelect: (backendId: string | null) => void
}

const BACKEND_LABELS: Record<string, string> = {
  mpvpaper: 'mpvpaper (Wayland)',
  'mpv-root': 'mpv — fenêtre racine X11'
}

export function RenderBackendSection({ state, detecting, onDetect, onSelect }: RenderBackendSectionProps) {
  const available = state.backends.filter((b) => b.available)

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text fw={500}>Backend d'affichage</Text>
        <ActionIcon variant="subtle" aria-label="Relancer la détection" onClick={onDetect} loading={detecting}>
          <IconRefreshDot size={16} stroke={1.5} />
        </ActionIcon>
      </Group>

      {available.length === 0 ? (
        <Alert color="red" title="Aucun backend disponible">
          Session {state.sessionType} détectée — aucun outil de rendu compatible n'est installé.
          Installez mpvpaper (Wayland) ou mpv (X11).
        </Alert>
      ) : (
        <Radio.Group
          value={state.active ?? ''}
          onChange={(value) => onSelect(value)}
          name="render-backend"
        >
          <Stack gap={6}>
            {available.map((backend) => (
              <Radio key={backend.id} value={backend.id} label={BACKEND_LABELS[backend.id] ?? backend.id} />
            ))}
          </Stack>
        </Radio.Group>
      )}

      <Text size="xs" c="anthracite.3">
        Le backend actif est utilisé pour le rendu des wallpapers. La détection
        vérifie les outils installés selon votre session ({state.sessionType}).
      </Text>
    </Stack>
  )
}

export default RenderBackendSection
