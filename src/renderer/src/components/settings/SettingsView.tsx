import { Divider, Stack, Title } from '@mantine/core'
import WorkshopFolderSection from './WorkshopFolderSection'
import RenderBackendSection from './RenderBackendSection'
import type { ScannedWorkshopItem } from '../../hooks/useWorkshop'
import type { RenderState } from '../../hooks/useRender'

interface SettingsViewProps {
  workshopFolder: string | null
  workshopDetectedFolders: { value: string; label: string; path: string }[]
  workshopScanning: boolean
  workshopItems: ScannedWorkshopItem[]
  onPickWorkshopFolder: () => void
  onSelectWorkshopFolder: (path: string) => void
  onScanWorkshop: () => void
  onOpenSteamStore: () => void
  onRedetectWorkshop: () => void
  renderState: RenderState | null
  renderDetecting: boolean
  onDetectRender: () => void
  onSelectRenderBackend: (backendId: string | null) => void
  onInstallRenderBackend: (backendId: string) => void
}

export function SettingsView({
  workshopFolder,
  workshopDetectedFolders,
  workshopScanning,
  workshopItems,
  onPickWorkshopFolder,
  onSelectWorkshopFolder,
  onScanWorkshop,
  onOpenSteamStore,
  onRedetectWorkshop,
  renderState,
  renderDetecting,
  onDetectRender,
  onSelectRenderBackend,
  onInstallRenderBackend
}: SettingsViewProps) {
  return (
    <Stack gap="md" maw={560}>
      <Title order={3}>Paramètres</Title>
      <WorkshopFolderSection
        folder={workshopFolder}
        detectedFolders={workshopDetectedFolders}
        scanning={workshopScanning}
        itemCount={workshopItems.length}
        onPickFolder={onPickWorkshopFolder}
        onSelectFolder={(value) => value && onSelectWorkshopFolder(value)}
        onScan={onScanWorkshop}
        onOpenSteam={onOpenSteamStore}
        onRedetect={onRedetectWorkshop}
      />
      <Divider />
      <RenderBackendSection
        state={renderState}
        detecting={renderDetecting}
        onDetect={onDetectRender}
        onSelect={onSelectRenderBackend}
        onInstall={onInstallRenderBackend}
      />
    </Stack>
  )
}

export default SettingsView
