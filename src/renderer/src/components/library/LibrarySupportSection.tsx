import { Accordion, Badge, Grid, Group, Stack, Text, Tooltip } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import type { ExtensionMonitorInfo } from '../../../../preload/index'
import {
  WALLPAPER_TYPES,
  WALLPAPER_TYPE_META,
  type SupportLevel,
  type Wallpaper
} from '../../data/wallpaper'
import WallpaperCard from './WallpaperCard'

interface LibrarySupportSectionProps {
  wallpapers: Wallpaper[]
  monitors: ExtensionMonitorInfo[]
  onSet: (wallpaper: Wallpaper, monitorIndex?: number | null) => void
}

const SECTIONS: { level: SupportLevel; label: string; color: string }[] = [
  { level: 'supported', label: 'Compatibles', color: 'teal' },
  { level: 'partial', label: 'Partiellement supportés', color: 'yellow' },
  { level: 'unsupported', label: 'Non supportés', color: 'red' }
]

const typesForLevel = (level: SupportLevel) =>
  WALLPAPER_TYPES.filter((t) => WALLPAPER_TYPE_META[t].support === level)

const sectionExplanation = (level: SupportLevel) => (
  <Stack gap={6}>
    {typesForLevel(level).map((t) => (
      <Text key={t} size="xs">
        <Text size="xs" fw={600} component="span">
          {WALLPAPER_TYPE_META[t].label} —{' '}
        </Text>
        {WALLPAPER_TYPE_META[t].supportExplanation}
      </Text>
    ))}
  </Stack>
)

export function LibrarySupportSection({ wallpapers, monitors, onSet }: LibrarySupportSectionProps) {
  return (
    <Accordion multiple variant="separated">
      {SECTIONS.map((section) => {
        const cards = wallpapers.filter(
          (w) => WALLPAPER_TYPE_META[w.type].support === section.level
        )
        return (
          <Accordion.Item key={section.level} value={section.level}>
            <Accordion.Control>
              <Group gap="sm" wrap="nowrap" h={26}>
                <Text fw={600} size="sm">
                  {section.label}
                </Text>
                <Badge size="sm" variant="light" color={section.color}>
                  {cards.length}
                </Badge>
                {section.level !== 'supported' && (
                  <Tooltip
                    label={sectionExplanation(section.level)}
                    multiline
                    maw={340}
                    position="top"
                    withinPortal
                  >
                    <Badge
                      size="sm"
                      variant="light"
                      color={section.color}
                      circle
                      styles={{ root: { display: 'inline-flex', alignItems: 'center' } }}
                    >
                      <IconInfoCircle size={12} stroke={1.5} style={{ display: 'block' }} />
                    </Badge>
                  </Tooltip>
                )}
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              {cards.length === 0 ? (
                <Text size="sm" c="anthracite.3">
                  Aucun wallpaper dans cette catégorie.
                </Text>
              ) : (
                <Grid gap="md">
                  {cards.map((wallpaper) => (
                    <Grid.Col key={wallpaper.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                      <WallpaperCard wallpaper={wallpaper} onSet={onSet} monitors={monitors} />
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        )
      })}
    </Accordion>
  )
}

export default LibrarySupportSection
