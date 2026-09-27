import { Alert, Badge, Button, Group, Stack, Text } from '@mantine/core'
import { IconCircleCheck, IconDownload } from '@tabler/icons-react'
import type { GnomeExtensionStatus } from '../../../../preload/index'

interface GnomeExtensionSectionProps {
  status: GnomeExtensionStatus | null
  installing: boolean
  onInstall: () => void
}

export function GnomeExtensionSection({
  status,
  installing,
  onInstall
}: GnomeExtensionSectionProps) {
  if (status?.installed && status.enabled) {
    return (
      <Stack gap={4}>
        <Group justify="space-between">
          <Text fw={500}>Extension GNOME Shell</Text>
          <Badge
            size="sm"
            variant="light"
            color="teal"
            leftSection={<IconCircleCheck size={12} stroke={1.5} />}
          >
            Installée et active
          </Badge>
        </Group>
        <Text size="xs" c="anthracite.3">
          La vidéo de fond d'écran est rendue par l'extension Waypaper Engine.
        </Text>
      </Stack>
    )
  }

  return (
    <Alert
      color={status?.installed ? 'orange' : 'blue'}
      title="Extension GNOME Shell — vidéo animée"
    >
      <Stack gap="xs">
        <Text size="sm">
          {status?.installed
            ? "L'extension est installée mais désactivée. L'installation la réactivera."
            : "Pour afficher une vidéo en fond d'écran GNOME, installez l'extension Waypaper Engine (copie locale + activation, aucune dépendance supplémentaire)."}
        </Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconDownload size={14} stroke={1.5} />}
          loading={installing}
          onClick={onInstall}
        >
          {status?.installed ? 'Activer l’extension' : 'Installer l’extension'}
        </Button>
        {status?.installed && !status.enabled && (
          <Text size="xs" c="anthracite.3">
            Après activation, rechargez la détection des backends.
          </Text>
        )}
      </Stack>
    </Alert>
  )
}

export default GnomeExtensionSection
