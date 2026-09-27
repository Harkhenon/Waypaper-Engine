import { Divider, Stack, Title } from '@mantine/core'
import WorkshopFolderSection from './WorkshopFolderSection'
import RenderBackendSection from './RenderBackendSection'
import PlaybackSection from './PlaybackSection'
import type { ScannedWorkshopItem } from '../../hooks/useWorkshop'
import type { GnomeExtensionPlaybackState, GnomeExtensionStatus } from '../../../../preload/index'
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
  gnomeExtensionStatus: GnomeExtensionStatus | null
  gnomeExtensionInstalling: boolean
  onInstallGnomeExtension: () => void
  playback: GnomeExtensionPlaybackState | null
  onSetPaused: (paused: boolean) => void
  onSetMuted: (muted: boolean) => void
  onSetLoop: (loop: boolean) => void
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
  onInstallRenderBackend,
  gnomeExtensionStatus,
  gnomeExtensionInstalling,
  onInstallGnomeExtension,
  playback,
  onSetPaused,
  onSetMuted,
  onSetLoop
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
        gnomeExtensionStatus={gnomeExtensionStatus}
        gnomeExtensionInstalling={gnomeExtensionInstalling}
        onInstallGnomeExtension={onInstallGnomeExtension}
      />
      <Divider />
      <PlaybackSection
        playback={playback}
        gnomeExtensionActive={Boolean(
          gnomeExtensionStatus?.installed && gnomeExtensionStatus.enabled
        )}
        onSetPaused={onSetPaused}
        onSetMuted={onSetMuted}
        onSetLoop={onSetLoop}
      />
    </Stack>
  )
}

export default SettingsView
