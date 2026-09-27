import { useState } from 'react'
import { ActionIcon, Alert, Anchor, Button, Group, Loader, Radio, Stack, Text } from '@mantine/core'
import { IconExternalLink, IconRefreshDot } from '@tabler/icons-react'
import { RENDER_BACKENDS } from '../../../../shared/render'
import type { RenderState } from '../../hooks/useRender'

interface RenderBackendSectionProps {
  state: RenderState | null
  detecting: boolean
  onDetect: () => void
  onSelect: (backendId: string | null) => void
  onInstall: (backendId: string) => void
}

const DESKTOP_LABELS: Record<string, string> = {
  gnome: 'GNOME',
  kde: 'KDE Plasma',
  wlroots: 'wlroots (Hyprland, Sway…)',
  x11: 'X11',
  unknown: 'inconnu'
}

export function RenderBackendSection({
  state,
  detecting,
  onDetect,
  onSelect,
  onInstall
}: RenderBackendSectionProps) {
  const [installing, setInstalling] = useState<string | null>(null)

  if (!state) {
    return (
      <Stack gap="xs">
        <Text fw={500}>Backend d&apos;affichage</Text>
        <Group gap="xs">
          <Loader size="sm" />
          <Text size="sm" c="anthracite.3">
            Détection de la session et des outils de rendu…
          </Text>
        </Group>
      </Stack>
    )
  }

  const available = state.backends.filter((b) => b.available)
  const defs = RENDER_BACKENDS.filter((b) => available.some((s) => s.id === b.id))

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text fw={500}>Backend d&apos;affichage</Text>
        <ActionIcon
          variant="subtle"
          aria-label="Relancer la détection"
          onClick={onDetect}
          loading={detecting}
        >
          <IconRefreshDot size={16} stroke={1.5} />
        </ActionIcon>
      </Group>

      {available.length === 0 ? (
        <Alert color="red" title="Aucun backend disponible">
          Session {state.sessionType} ({DESKTOP_LABELS[state.desktop]}) détectée — aucun outil de
          rendu compatible n&apos;est installé.
        </Alert>
      ) : (
        <Radio.Group
          value={state.active ?? ''}
          onChange={(value) => onSelect(value)}
          name="render-backend"
        >
          <Stack gap={6}>
            {defs.map((backend) => (
              <Group key={backend.id} justify="space-between" wrap="nowrap" w="100%">
                <Radio value={backend.id} label={backend.label} />
                <Group gap={4}>
                  {backend.installCommand && (
                    <Button
                      size="compact-xs"
                      variant="light"
                      loading={installing === backend.id}
                      onClick={() => {
                        setInstalling(backend.id)
                        onInstall(backend.id)
                      }}
                    >
                      {backend.installLabel ?? 'Installer'}
                    </Button>
                  )}
                  {backend.instructionsUrl && (
                    <Anchor
                      size="xs"
                      href={backend.instructionsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Group gap={3}>
                        Instructions
                        <IconExternalLink size={12} stroke={1.5} />
                      </Group>
                    </Anchor>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </Radio.Group>
      )}

      <Text size="xs" c="anthracite.3">
        Session {state.sessionType}, bureau {DESKTOP_LABELS[state.desktop]}. Le backend actif est
        utilisé pour le rendu des wallpapers.
      </Text>
    </Stack>
  )
}

export default RenderBackendSection
