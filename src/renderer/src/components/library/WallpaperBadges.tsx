import { Badge, Group, Tooltip } from '@mantine/core'
import {
  IconVideo,
  IconWorld,
  IconCube,
  IconPlaylist,
  IconAppWindow,
  IconAlertCircle,
  IconAlertTriangle
} from '@tabler/icons-react'
import type { Wallpaper, WallpaperType } from '../../data/wallpaper'
import { WALLPAPER_TYPE_META } from '../../data/wallpaper'
import { TYPE_VISUAL_META } from '../../data/filters'

const TYPE_ICONS = {
  video: IconVideo,
  world: IconWorld,
  cube: IconCube,
  playlist: IconPlaylist,
  app: IconAppWindow
} as const

function TypeBadge({ type }: { type: WallpaperType }) {
  const meta = WALLPAPER_TYPE_META[type]
  const visual = TYPE_VISUAL_META[type]
  const Icon = TYPE_ICONS[visual.icon]
  return (
    <Badge
      size="sm"
      variant="light"
      color={visual.badgeColor}
      leftSection={<Icon size={12} stroke={1.5} />}
    >
      {meta.label}
    </Badge>
  )
}

export function WallpaperBadges({ wallpaper }: { wallpaper: Wallpaper }) {
  const meta = WALLPAPER_TYPE_META[wallpaper.type]
  return (
    <Group gap={6}>
      <TypeBadge type={wallpaper.type} />
      {meta.support === 'partial' && (
        <Tooltip label={meta.supportExplanation} position="top" multiline maw={280} withinPortal>
          <Badge
            size="sm"
            variant="light"
            color="yellow"
            leftSection={<IconAlertTriangle size={12} stroke={1.5} />}
          >
            Support partiel
          </Badge>
        </Tooltip>
      )}
      {meta.support === 'unsupported' && (
        <Tooltip label={meta.supportExplanation} position="top" multiline maw={280} withinPortal>
          <Badge
            size="sm"
            variant="light"
            color="red"
            leftSection={<IconAlertCircle size={12} stroke={1.5} />}
          >
            Non supporté
          </Badge>
        </Tooltip>
      )}
    </Group>
  )
}

export default WallpaperBadges
