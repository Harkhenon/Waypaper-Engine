import { Box, Stack } from '@mantine/core'
import TitleBar from './components/TitleBar'
import LibraryView from './components/library/LibraryView'

export default function App() {
  return (
    <Stack gap={0} h="100%">
      <TitleBar />
      <Box p="md" style={{ flex: 1, overflowY: 'auto' }}>
        <LibraryView />
      </Box>
    </Stack>
  )
}
