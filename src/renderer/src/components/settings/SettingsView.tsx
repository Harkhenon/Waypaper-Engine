import { Divider, Select, Stack, Text, Title } from '@mantine/core'
import { DISPLAY_BACKEND_META, DISPLAY_BACKENDS } from '../../data/display'
import { MOCK_ACTIVE_BACKEND } from '../../data/mock/monitors'
import WorkshopFolderSection from './WorkshopFolderSection'
import type { ScannedWorkshopItem } from '../../hooks/useWorkshop'

interface SettingsViewProps {
  workshopFolder: string | null
  workshopScanning: boolean
  workshopItems: ScannedWorkshopItem[]
  onPickWorkshopFolder: () => void
  onScanWorkshop: () => void
}

const BACKEND_OPTIONS = DISPLAY_BACKENDS.map((b) => ({
  value: b,
  label: DISPLAY_BACKEND_META[b].label
}))

export function SettingsView({
  workshopFolder,
  workshopScanning,
  workshopItems,
  onPickWorkshopFolder,
  onScanWorkshop
}: SettingsViewProps) {
  return (
    <Stack gap="md" maw={560}>
      <Title order={3}>Paramètres</Title>
      <WorkshopFolderSection
        folder={workshopFolder}
        scanning={workshopScanning}
        itemCount={workshopItems.length}
        onPickFolder={onPickWorkshopFolder}
        onScan={onScanWorkshop}
      />
      <Divider />
      <Select
        label="Backend d'affichage"
        description="Backend utilisé pour le rendu des wallpapers sur le bureau"
        data={BACKEND_OPTIONS}
        value={MOCK_ACTIVE_BACKEND}
        allowDeselect={false}
      />
      <Text size="xs" c="anthracite.3">
        Le backend d'affichage reste une donnée factice pour l'instant — le
        rendu réel arrivera avec les backends mpvpaper/X11.
      </Text>
    </Stack>
  )
}

export default SettingsView
