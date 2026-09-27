import { useState } from 'react'
import { AppShell, Box, Stack } from '@mantine/core'
import TitleBar from './components/TitleBar'
import AppNavbar from './components/AppNavbar'
import LibraryView from './components/library/LibraryView'
import MonitorsView from './components/monitors/MonitorsView'
import SettingsView from './components/settings/SettingsView'
import { useWorkshop } from './hooks/useWorkshop'
import type { NavigationValue } from './data/navigation'

export default function App() {
  const [section, setSection] = useState<NavigationValue>('library')
  const workshop = useWorkshop()

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
              <LibraryView items={workshop.items} scanning={workshop.scanning} />
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
              />
            )}
          </Box>
        </AppShell.Main>
      </AppShell>
    </Stack>
  )
}
