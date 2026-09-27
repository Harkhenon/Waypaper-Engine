import { Badge, Group, Stack, Switch, Text } from '@mantine/core'
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconRepeat,
  IconVolume,
  IconVolumeOff
} from '@tabler/icons-react'
import type { GnomeExtensionPlaybackState } from '../../../../preload/index'

interface PlaybackSectionProps {
  playback: GnomeExtensionPlaybackState | null
  gnomeExtensionActive: boolean
  onSetPaused: (paused: boolean) => void
  onSetMuted: (muted: boolean) => void
  onSetLoop: (loop: boolean) => void
}

export function PlaybackSection({
  playback,
  gnomeExtensionActive,
  onSetPaused,
  onSetMuted,
  onSetLoop
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
          Le backend GNOME Shell doit être actif pour piloter la lecture.
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
        Contrôles applicables à l’ensemble des wallpapers en cours de rendu.
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
              <Text size="sm">{playback?.muted ? 'Son coupé' : 'Son actif'}</Text>
            </Group>
          }
        />
        <Switch
          checked={playback?.loop ?? true}
          onChange={(e) => onSetLoop(e.currentTarget.checked)}
          label={
            <Group gap={6} wrap="nowrap">
              <IconRepeat size={14} stroke={1.5} />
              <Text size="sm">Lecture en boucle</Text>
            </Group>
          }
        />
      </Stack>
    </Stack>
  )
}

export default PlaybackSection
