import { ActionIcon, Group, Text, Box, Divider } from '@mantine/core'
import { IconMinimize, IconMaximize, IconX, IconPhoto } from '@tabler/icons-react'

const titleBarStyle = {
  '-webkit-app-region': 'drag',
  '-webkit-user-select': 'none'
} as const

const controlsStyle = {
  '-webkit-app-region': 'no-drag'
} as const

export function TitleBar() {
  const api = window.api

  return (
    <Box style={titleBarStyle} h={36} px="sm" bg="anthracite.8">
      <Group justify="space-between" h="100%" wrap="nowrap">
        <Group gap={6} h="100%">
          <IconPhoto size={16} stroke={1.5} />
          <Text size="sm" fw={500} c="anthracite.1">
            Waypaper Engine
          </Text>
        </Group>

        <Group gap={4} style={controlsStyle} h="100%">
          <ActionIcon
            variant="subtle"
            c="anthracite.1"
            aria-label="Réduire"
            onClick={() => api.window.minimize()}
          >
            <IconMinimize size={16} stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            c="anthracite.1"
            aria-label="Maximiser"
            onClick={() => api.window.toggleMaximize()}
          >
            <IconMaximize size={16} stroke={1.5} />
          </ActionIcon>
          <Divider orientation="vertical" />
          <ActionIcon
            variant="subtle"
            c="red.4"
            aria-label="Fermer"
            onClick={() => api.window.close()}
          >
            <IconX size={16} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  )
}

export default TitleBar
