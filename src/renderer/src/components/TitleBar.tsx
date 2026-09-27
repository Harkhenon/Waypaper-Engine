import { useEffect, useState } from 'react'
import { ActionIcon, Group, Text, Box, Divider } from '@mantine/core'
import { IconMinimize, IconMaximize, IconRestore, IconX, IconPhoto } from '@tabler/icons-react'

export function TitleBar() {
  const api = window.api
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    return api.window.onMaximizedChange(setMaximized)
  }, [api])

  return (
    <Box
      className="titlebar-drag"
      h={36}
      px="sm"
      bg="anthracite.8"
      onDoubleClick={() => api.window.toggleMaximize()}
    >
      <Group justify="space-between" h="100%" wrap="nowrap">
        <Group gap={6} h="100%">
          <IconPhoto size={16} stroke={1.5} />
          <Text size="sm" fw={500} c="anthracite.1">
            Waypaper Engine
          </Text>
        </Group>

        <Group gap={4} className="titlebar-no-drag" h="100%">
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
            aria-label={maximized ? 'Réduire la fenêtre' : 'Agrandir la fenêtre'}
            onClick={() => api.window.toggleMaximize()}
          >
            {maximized ? (
              <IconRestore size={16} stroke={1.5} />
            ) : (
              <IconMaximize size={16} stroke={1.5} />
            )}
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
