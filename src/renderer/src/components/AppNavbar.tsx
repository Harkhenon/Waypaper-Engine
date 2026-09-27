import { NavLink, Stack } from '@mantine/core'
import type { NavigationValue } from '../data/navigation'
import { NAVIGATION_ITEMS } from '../data/navigation'

interface AppNavbarProps {
  section: NavigationValue
  onSectionChange: (section: NavigationValue) => void
}

export function AppNavbar({ section, onSectionChange }: AppNavbarProps) {
  return (
    <Stack gap="xs" justify="flex-start" p="xs" h="100%">
      {NAVIGATION_ITEMS.map((item) => (
        <NavLink
          key={item.value}
          active={section === item.value}
          label={item.label}
          description={item.description}
          leftSection={<item.icon size={18} stroke={1.5} />}
          onClick={() => onSectionChange(item.value)}
        />
      ))}
    </Stack>
  )
}

export default AppNavbar
