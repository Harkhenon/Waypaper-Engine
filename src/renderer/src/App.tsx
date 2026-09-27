import { useState } from 'react'
import { AppShell, Box, Stack } from '@mantine/core'
import TitleBar from './components/TitleBar'
import LibraryView from './components/library/LibraryView'
import MonitorsView from './components/monitors/MonitorsView'
import SettingsView from './components/settings/SettingsView'
import { NAVIGATION_ITEMS, type NavigationValue } from './data/navigation'
import AppNavbar from './components/AppNavbar'

import type { ComponentType } from 'react'

const VIEWS: Record<NavigationValue, ComponentType> = {
  library: LibraryView,
  monitors: MonitorsView,
  settings: SettingsView
}

export default function App() {
  const [section, setSection] = useState<NavigationValue>('library')
  const View = VIEWS[section]

  return (
    <Stack gap={0} h="100%" style={{ '-webkit-user-select': 'none' } as const}>
      <TitleBar />
      <AppShell
        navbar={{
          width: 220,
          breakpoint: 'sm'
        }}
        padding="md"
        h="calc(100vh - 36px)"
      >
        <AppNavbar section={section} onSectionChange={setSection} />
        <Box h="100%" style={{ overflowY: 'auto' }}>
          <View />
        </Box>
      </AppShell>
    </Stack>
  )
}

export { NAVIGATION_ITEMS }
