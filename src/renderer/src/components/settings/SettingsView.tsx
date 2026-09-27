import { Divider, Select, Stack, Text, Title } from '@mantine/core'
import { DISPLAY_BACKEND_META, DISPLAY_BACKENDS } from '../../data/display'
import { MOCK_ACTIVE_BACKEND } from '../../data/mock/monitors'
import WorkshopFolderSection from './WorkshopFolderSection'

const BACKEND_OPTIONS = DISPLAY_BACKENDS.map((b) => ({
  value: b,
  label: DISPLAY_BACKEND_META[b].label
}))

export function SettingsView() {
  return (
    <Stack gap="md" maw={560}>
      <Title order={3}>Paramètres</Title>
      <WorkshopFolderSection />
      <Divider />
      <Select
        label="Backend d'affichage"
        description="Backend utilisé pour le rendu des wallpapers sur le bureau"
        data={BACKEND_OPTIONS}
        value={MOCK_ACTIVE_BACKEND}
        allowDeselect={false}
      />
      <Text size="xs" c="anthracite.3">
        Les paramètres sont pour l'instant des données factices — la persistance
        arrivera avec les canaux IPC réels.
      </Text>
    </Stack>
  )
}

export default SettingsView
