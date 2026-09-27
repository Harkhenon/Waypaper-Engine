import { useState } from 'react'
import { ActionIcon, Alert, Anchor, Button, Group, Loader, Radio, Stack, Text } from '@mantine/core'
import { IconExternalLink, IconRefreshDot } from '@tabler/icons-react'
import { RENDER_BACKENDS } from '../../../../shared/render'
import GnomeExtensionSection from './GnomeExtensionSection'
import type { GnomeExtensionStatus } from '../../../../preload/index'
import type { RenderState } from '../../hooks/useRender'

interface RenderBackendSectionProps {
  state: RenderState | null
  detecting: boolean
  detectError: string | null
  onDetect: () => void
  onSelect: (backendId: string | null) => void
  onInstall: (backendId: string) => void
  gnomeExtensionStatus: GnomeExtensionStatus | null
  gnomeExtensionInstalling: boolean
  onInstallGnomeExtension: () => void
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
  detectError,
  onDetect,
  onSelect,
  onInstall,
  gnomeExtensionStatus,
  gnomeExtensionInstalling,
  onInstallGnomeExtension
}: RenderBackendSectionProps) {
  const [installing, setInstalling] = useState<string | null>(null)

  const detectButton = (
    <ActionIcon
      variant="subtle"
      aria-label="Relancer la détection"
      onClick={onDetect}
      loading={detecting}
    >
      <IconRefreshDot size={16} stroke={1.5} />
    </ActionIcon>
  )

  if (!state) {
    return (
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={500}>Backend d&apos;affichage</Text>
          {detectButton}
        </Group>
        {detectError ? (
          <Alert color="red" title="Échec de la détection">
            <Stack gap="xs">
              <Text size="sm">{detectError}</Text>
              <Button size="xs" variant="light" onClick={onDetect} loading={detecting}>
                Réessayer
              </Button>
            </Stack>
          </Alert>
        ) : (
          <Group gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="anthracite.3">
              Détection de la session et des outils de rendu…
            </Text>
          </Group>
        )}
      </Stack>
    )
  }

  const available = state.backends.filter((b) => b.available)
  const defs = RENDER_BACKENDS.filter((b) => available.some((s) => s.id === b.id))

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text fw={500}>Backend d&apos;affichage</Text>
        {detectButton}
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

      {state.desktop === 'gnome' && (
        <GnomeExtensionSection
          status={gnomeExtensionStatus}
          installing={gnomeExtensionInstalling}
          onInstall={onInstallGnomeExtension}
        />
      )}
    </Stack>
  )
}

export default RenderBackendSection
