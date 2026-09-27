import { useState } from 'react'
import { AppShell, Box, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import TitleBar from './components/TitleBar'
import AppNavbar from './components/AppNavbar'
import LibraryView from './components/library/LibraryView'
import MonitorsView from './components/monitors/MonitorsView'
import SettingsView from './components/settings/SettingsView'
import { useWorkshop } from './hooks/useWorkshop'
import { useRender } from './hooks/useRender'
import { useMonitors } from './hooks/useMonitors'
import type { Wallpaper } from './data/wallpaper'
import type { NavigationValue } from './data/navigation'

export default function App() {
  const [section, setSection] = useState<NavigationValue>('library')
  const workshop = useWorkshop()
  const render = useRender()
  const monitors = useMonitors()

  const handleSetWallpaper = (wallpaper: Wallpaper, monitorIndex?: number | null): void => {
    void (async () => {
      const result = await render.set({
        wallpaperId: wallpaper.id,
        folder: wallpaper.folder,
        monitorIndex: monitorIndex ?? null
      })
      await render.refreshPlayback()
      if (result.ok) {
        notifications.show({
          title: 'Wallpaper lancé',
          message: `« ${wallpaper.title} » est en cours de rendu sur le bureau.`,
          color: 'teal',
          icon: <IconCheck size={18} stroke={1.5} />,
          autoClose: 3500
        })
      } else {
        notifications.show({
          title: 'Échec du rendu',
          message: result.error ?? 'Erreur inconnue.',
          color: 'red',
          icon: <IconAlertTriangle size={18} stroke={1.5} />,
          autoClose: 6000
        })
      }
    })()
  }

  return (
    <Stack gap={0} h="100%">
      <TitleBar />
      <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
        <AppShell.Navbar>
          <AppNavbar section={section} onSectionChange={setSection} />
        </AppShell.Navbar>
        <AppShell.Main h="calc(100vh - 36px)">
          <Box h="100%" style={{ overflowY: 'auto' }}>
            {section === 'library' && (
              <LibraryView
                items={workshop.items}
                scanning={workshop.scanning}
                onSet={handleSetWallpaper}
                monitors={monitors.monitors}
              />
            )}
            {section === 'monitors' && (
              <MonitorsView
                monitors={monitors.monitors}
                loading={monitors.loading}
                playback={render.playback}
                wallpapers={workshop.items}
                onRefresh={() => void monitors.refresh()}
              />
            )}
            {section === 'settings' && (
              <SettingsView
                workshopFolder={workshop.folder}
                workshopDetectedFolders={workshop.detectedFolders}
                workshopScanning={workshop.scanning}
                workshopItems={workshop.items}
                onPickWorkshopFolder={() => void workshop.pickAndSetFolder()}
                onSelectWorkshopFolder={(path) => void workshop.setFolderAndScan(path)}
                onScanWorkshop={() => void workshop.scan()}
                onOpenSteamStore={workshop.openSteamStore}
                onRedetectWorkshop={() => void workshop.redetect()}
                renderState={render.state}
                renderDetecting={render.detecting}
                renderDetectError={render.detectError}
                onDetectRender={() => void render.detect()}
                onSelectRenderBackend={(id) => void render.setActive(id)}
                onInstallRenderBackend={(id) => {
                  void (async () => {
                    const result = await render.install(id)
                    if (result.ok) {
                      notifications.show({
                        title: 'Installation terminée',
                        message: 'Le backend a été installé et la détection relancée.',
                        color: 'teal',
                        autoClose: 3500
                      })
                    } else {
                      notifications.show({
                        title: 'Échec de l\u2019installation',
                        message: result.error ?? 'Erreur inconnue.',
                        color: 'red',
                        autoClose: 6000
                      })
                    }
                  })()
                }}
                gnomeExtensionStatus={render.extension}
                gnomeExtensionInstalling={render.installingExtension}
                playback={render.playback}
                onSetPaused={(paused) => {
                  void render.setPaused(paused)
                }}
                onSetMuted={(muted) => {
                  void render.setMuted(muted)
                }}
                onSetLoop={(loop) => {
                  void render.setLoop(loop)
                }}
                onInstallGnomeExtension={() => {
                  void (async () => {
                    const result = await render.installExtension()
                    if (result.ok && result.reloginRequired) {
                      notifications.show({
                        title: 'Mise à jour installée',
                        message:
                          "Reconnectez-vous (fin de session puis login) pour que GNOME Shell charge la nouvelle version de l'extension.",
                        color: 'orange',
                        autoClose: 8000
                      })
                    } else if (result.ok) {
                      notifications.show({
                        title: 'Extension installée',
                        message:
                          "L'extension GNOME Shell Waypaper Engine est active. Relancez la détection des backends.",
                        color: 'teal',
                        autoClose: 5000
                      })
                      await render.detect()
                    } else {
                      notifications.show({
                        title: "Échec de l'installation",
                        message: result.error ?? 'Erreur inconnue.',
                        color: 'red',
                        autoClose: 6000
                      })
                    }
                  })()
                }}
              />
            )}
          </Box>
        </AppShell.Main>
      </AppShell>
    </Stack>
  )
}
