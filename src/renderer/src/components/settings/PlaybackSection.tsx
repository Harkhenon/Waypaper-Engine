import { Badge, Group, Stack, Switch, Text } from '@mantine/core'
import { IconPlayerPause, IconPlayerPlay, IconVolume, IconVolumeOff } from '@tabler/icons-react'
import type { GnomeExtensionPlaybackState } from '../../../../preload/index'

interface PlaybackSectionProps {
  playback: GnomeExtensionPlaybackState | null
  gnomeExtensionActive: boolean
  onSetPaused: (paused: boolean) => void
  onSetMuted: (muted: boolean) => void
}

export function PlaybackSection({
  playback,
  gnomeExtensionActive,
  onSetPaused,
  onSetMuted
}: PlaybackSectionProps) {
  const running = Boolean(playback?.videoPath)

  if (!gnomeExtensionActive) {
    return (
      <Stack gap={4}>
        <Group justify="space-between">
          <Text fw={500}>Lecture</Text>
          <Badge size="sm" variant="light" color="anthracite.4">
            Indisponible
          </Badge>
        </Group>
        <Text size="xs" c="anthracite.3">
          Le backend GNOME Shell doit \u00eatre actif pour piloter la lecture.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text fw={500}>Lecture</Text>
        <Badge
          size="sm"
          variant="light"
          color={running ? (playback?.paused ? 'yellow' : 'teal') : 'anthracite.4'}
        >
          {running ? (playback?.paused ? 'En pause' : 'En lecture') : 'Inactif'}
        </Badge>
      </Group>
      <Text size="xs" c="anthracite.3">
        Contr\u00f4les applicables au wallpaper en cours de rendu sur tous les \u00e9crans.
      </Text>
      <Stack gap="xs" mt={4}>
        <Switch
          checked={Boolean(playback?.paused)}
          disabled={!running}
          onChange={(e) => onSetPaused(e.currentTarget.checked)}
          label={
            <Group gap={6} wrap="nowrap">
              {playback?.paused ? (
                <IconPlayerPlay size={14} stroke={1.5} />
              ) : (
                <IconPlayerPause size={14} stroke={1.5} />
              )}
              <Text size="sm">{playback?.paused ? 'Reprendre la lecture' : 'Mettre en pause'}</Text>
            </Group>
          }
        />
        <Switch
          checked={Boolean(playback?.muted)}
          disabled={!running}
          onChange={(e) => onSetMuted(e.currentTarget.checked)}
          label={
            <Group gap={6} wrap="nowrap">
              {playback?.muted ? (
                <IconVolumeOff size={14} stroke={1.5} />
              ) : (
                <IconVolume size={14} stroke={1.5} />
              )}
              <Text size="sm">{playback?.muted ? 'Son coup\u00e9' : 'Son actif'}</Text>
            </Group>
          }
        />
      </Stack>
    </Stack>
  )
}

export default PlaybackSection
