import { useState } from 'react'
import type { ComponentType } from 'react'
import { AppShell, Box, Stack } from '@mantine/core'
import TitleBar from './components/TitleBar'
import LibraryView from './components/library/LibraryView'
import MonitorsView from './components/monitors/MonitorsView'
import SettingsView from './components/settings/SettingsView'
import AppNavbar from './components/AppNavbar'
import type { NavigationValue } from './data/navigation'

const VIEWS: Record<NavigationValue, ComponentType> = {
  library: LibraryView,
  monitors: MonitorsView,
  settings: SettingsView
}

export default function App() {
  const [section, setSection] = useState<NavigationValue>('library')
  const View = VIEWS[section]

  return (
    <Stack gap={0} h="100%">
      <TitleBar />
      <AppShell
        navbar={{
          width: 220,
          breakpoint: 'sm'
        }}
        padding="md"
      >
        <AppShell.Navbar>
          <AppNavbar section={section} onSectionChange={setSection} />
        </AppShell.Navbar>
        <AppShell.Main h="calc(100vh - 36px)">
          <Box h="100%" style={{ overflowY: 'auto' }}>
            <View />
          </Box>
        </AppShell.Main>
      </AppShell>
    </Stack>
  )
}
