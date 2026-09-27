import { Alert, Button, Divider, Group, Select, Stack, Text, Title } from '@mantine/core'
import { IconBrandSteam, IconFolder, IconRefresh, IconRefreshDot } from '@tabler/icons-react'
import { STEAM_STORE_URL, WORKSHOP_APP_ID } from '../../data/workshop'
import type { DetectedWorkshopFolder } from '../../../../preload/index'

interface WorkshopFolderSectionProps {
  folder: string | null
  detectedFolders: DetectedWorkshopFolder[]
  scanning: boolean
  itemCount: number
  onPickFolder: () => void
  onSelectFolder: (value: string | null) => void
  onScan: () => void
  onOpenSteam: () => void
  onRedetect: () => void
}

export function WorkshopFolderSection({
  folder,
  detectedFolders,
  scanning,
  itemCount,
  onPickFolder,
  onSelectFolder,
  onScan,
  onOpenSteam,
  onRedetect
}: WorkshopFolderSectionProps) {
  const currentDetected = detectedFolders.find((f) => f.path === folder)

  return (
    <Stack gap="sm">
      <Title order={4}>Import du Workshop</Title>

      {detectedFolders.length > 0 && (
        <Select
          label="Dossier d'installation détecté"
          description="Sélectionné automatiquement — vous pouvez le changer"
          data={detectedFolders.map((f) => ({
            value: f.path,
            label: f.label
          }))}
          value={currentDetected ? currentDetected.path : null}
          onChange={onSelectFolder}
          leftSection={<IconFolder size={16} stroke={1.5} />}
          allowDeselect={false}
        />
      )}

      {!folder && detectedFolders.length === 0 && (
        <Alert
          color="red"
          title="Wallpaper Engine introuvable"
          icon={<IconBrandSteam size={20} stroke={1.5} />}
        >
          <Stack gap="xs" mt={4}>
            <Text size="sm">
              Aucune installation de Wallpaper Engine n'a été détectée sur ce
              système. Installez-le via Steam, puis revenez rescanner.
            </Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconBrandSteam size={14} stroke={1.5} />}
              onClick={onOpenSteam}
              style={{ alignSelf: 'flex-start' }}
            >
              Ouvrir dans Steam
            </Button>
          </Stack>
        </Alert>
      )}

      {folder && (
        <Text size="xs" c="anthracite.3" ff="monospace">
          {folder}
        </Text>
      )}

      <Button
        variant="light"
        leftSection={<IconFolder size={16} stroke={1.5} />}
        onClick={onPickFolder}
      >
        Choisir un dossier personnalisé…
      </Button>

      <Group>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} stroke={1.5} />}
          onClick={onScan}
          loading={scanning}
          disabled={!folder}
        >
          Rescanner le dossier
        </Button>
        <Button
          variant="light"
          leftSection={<IconRefreshDot size={16} stroke={1.5} />}
          onClick={onRedetect}
          loading={scanning}
        >
          Relancer la détection
        </Button>
      </Group>

      {folder && (
        <>
          <Divider />
          <Text size="xs" c="anthracite.3">
            {itemCount} item{itemCount > 1 ? 's' : ''} détecté
            {itemCount > 1 ? 's' : ''} — AppID Workshop : {WORKSHOP_APP_ID}
          </Text>
        </>
      )}
    </Stack>
  )
}

export default WorkshopFolderSection

export const STEAM_URL = STEAM_STORE_URL
