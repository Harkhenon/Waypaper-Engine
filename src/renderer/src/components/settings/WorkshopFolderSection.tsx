import { Button, Divider, Select, Stack, Text, Title } from '@mantine/core'
import { IconFolder, IconRefresh } from '@tabler/icons-react'
import {
  DEFAULT_WORKSHOP_FOLDERS,
  WORKSHOP_APP_ID
} from '../../data/workshop'

interface WorkshopFolderSectionProps {
  folder: string | null
  scanning: boolean
  itemCount: number
  onPickFolder: () => void
  onScan: () => void
}

export function WorkshopFolderSection({
  folder,
  scanning,
  itemCount,
  onPickFolder,
  onScan
}: WorkshopFolderSectionProps) {
  const matchingDefault = DEFAULT_WORKSHOP_FOLDERS.find((f) =>
    folder ? f.path.replace(/^~/, '') !== '' && folder.includes('431960') && folder.startsWith(f.path.replace(/^~.*/, '')) : false
  )

  return (
    <Stack gap="sm">
      <Title order={4}>Import du Workshop</Title>
      <Select
        label="Dossier d'installation détecté"
        description="Dossiers d'installation par défaut de Wallpaper Engine (Steam)"
        data={DEFAULT_WORKSHOP_FOLDERS.map((f) => ({
          value: f.value,
          label: f.label
        }))}
        value={matchingDefault?.value ?? null}
        placeholder="Aucune installation par défaut sélectionnée"
        leftSection={<IconFolder size={16} stroke={1.5} />}
        readOnly
      />
      {folder ? (
        <Text size="xs" c="anthracite.3" ff="monospace">
          {folder}
        </Text>
      ) : (
        <Text size="xs" c="anthracite.3">
          Aucun dossier Workshop configuré — cliquez sur Parcourir pour choisir
          le dossier de contenu {WORKSHOP_APP_ID}.
        </Text>
      )}
      <Button
        leftSection={<IconFolder size={16} stroke={1.5} />}
        onClick={onPickFolder}
      >
        Parcourir…
      </Button>
      <Button
        variant="light"
        leftSection={<IconRefresh size={16} stroke={1.5} />}
        onClick={onScan}
        loading={scanning}
        disabled={!folder}
      >
        Rescanner le dossier
      </Button>
      {folder && (
        <Divider />
      )}
      {folder && (
        <Text size="xs" c="anthracite.3">
          {itemCount} item{itemCount > 1 ? 's' : ''} détecté
          {itemCount > 1 ? 's' : ''} dans le dossier configuré.
        </Text>
      )}
    </Stack>
  )
}

export default WorkshopFolderSection
