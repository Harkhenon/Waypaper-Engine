import { Stack, Text, Title } from '@mantine/core'
import TitleBar from './components/TitleBar'

export default function App() {
  return (
    <Stack gap={0} h="100%">
      <TitleBar />
      <Stack m="md" gap="xs">
        <Title order={3}>Waypaper Engine</Title>
        <Text size="sm" c="anthracite.1">
          Gestionnaire de wallpapers animés pour Linux (X11 &amp; Wayland)
        </Text>
      </Stack>
    </Stack>
  )
}
