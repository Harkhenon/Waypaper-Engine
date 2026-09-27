import { useState } from 'react'
import { Divider, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconFolder } from '@tabler/icons-react'
import {
  DEFAULT_WORKSHOP_FOLDERS,
  WORKSHOP_APP_ID
} from '../../data/workshop'

const FOLDER_OPTIONS = DEFAULT_WORKSHOP_FOLDERS.map((f) => ({
  value: f.value,
  label: f.label
}))

export function WorkshopFolderSection() {
  const [folder, setFolder] = useState<string | null>(
    DEFAULT_WORKSHOP_FOLDERS[0].value
  )
  const [customPath, setCustomPath] = useState('')

  const selected = DEFAULT_WORKSHOP_FOLDERS.find((f) => f.value === folder)

  const handleFolderChange = (value: string | null): void => {
    setFolder(value)
    console.log(`[test] dossier Workshop sélectionné : ${value}`)
  }

  const handleCustomChange = (path: string): void => {
    setCustomPath(path)
    console.log(`[test] chemin Workshop personnalisé : ${path}`)
  }

  return (
    <Stack gap="sm">
      <Title order={4}>Import du Workshop</Title>
      <Select
        label="Dossier d'installation"
        description="Dossiers d'installation par défaut de Wallpaper Engine (Steam)"
        data={FOLDER_OPTIONS}
        value={folder}
        onChange={handleFolderChange}
        allowDeselect={false}
        leftSection={<IconFolder size={16} stroke={1.5} />}
      />
      {selected && (
        <Text size="xs" c="anthracite.3" ff="monospace">
          {selected.path}
        </Text>
      )}
      <TextInput
        label="Dossier personnalisé"
        description="Chemin complet vers un dossier de contenu 431960"
        placeholder="/chemin/vers/steamapps/workshop/content/431960"
        value={customPath}
        onChange={(e) => handleCustomChange(e.currentTarget.value)}
      />
      <Divider />
      <Text size="xs" c="anthracite.3">
        AppID Workshop : {WORKSHOP_APP_ID} — la détection réelle des dossiers,
        le scan et la persistance du choix arriveront avec les canaux IPC
        dédiés.
      </Text>
    </Stack>
  )
}

export default WorkshopFolderSection
