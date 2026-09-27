import { Box, Center } from '@mantine/core'
import {
  IconVideo,
  IconWorld,
  IconCube,
  IconPlaylist,
  IconAppWindow
} from '@tabler/icons-react'
import type { Wallpaper } from '../../data/wallpaper'
import { TYPE_VISUAL_META } from '../../data/filters'

const PREVIEW_ICONS = {
  video: IconVideo,
  world: IconWorld,
  cube: IconCube,
  playlist: IconPlaylist,
  app: IconAppWindow
} as const

export function WallpaperPreview({ wallpaper }: { wallpaper: Wallpaper }) {
  const visual = TYPE_VISUAL_META[wallpaper.type]
  const Icon = PREVIEW_ICONS[visual.icon]

  return (
    <Box
      h={140}
      style={{
        background: `linear-gradient(135deg, var(--mantine-color-${visual.gradientFrom.replace('.', '-')}), var(--mantine-color-${visual.gradientTo.replace('.', '-')}))`
      }}
    >
      <Center h="100%">
        <Icon size={48} stroke={1} color="rgba(255,255,255,0.85)" />
      </Center>
    </Box>
  )
}

export default WallpaperPreview
