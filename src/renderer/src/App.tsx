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
import type { Wallpaper } from './data/wallpaper'
import type { NavigationValue } from './data/navigation'

export default function App() {
  const [section, setSection] = useState<NavigationValue>('library')
  const workshop = useWorkshop()
  const render = useRender()

  const handleSetWallpaper = (wallpaper: Wallpaper): void => {
    void (async () => {
      const result = await render.set({
        wallpaperId: wallpaper.id,
        folder: wallpaper.folder
      })
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
      <AppShell
        navbar={{ width: 220, breakpoint: 'sm' }}
        padding="md"
      >
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
              />
            )}
            {section === 'monitors' && <MonitorsView />}
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
              />
            )}
          </Box>
        </AppShell.Main>
      </AppShell>
    </Stack>
  )
}
