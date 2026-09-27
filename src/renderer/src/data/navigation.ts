import {
  IconLibrary,
  IconDeviceDesktop,
  IconSettings
} from '@tabler/icons-react'
import type { ComponentType } from 'react'

export type NavigationValue = 'library' | 'monitors' | 'settings'

export interface NavigationItem {
  value: NavigationValue
  label: string
  description: string
  icon: ComponentType<{ size?: number | string; stroke?: number }>
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    value: 'library',
    label: 'Bibliothèque',
    description: 'Wallpapers importés du Workshop',
    icon: IconLibrary
  },
  {
    value: 'monitors',
    label: 'Écrans',
    description: 'Moniteurs et lecture en cours',
    icon: IconDeviceDesktop
  },
  {
    value: 'settings',
    label: 'Paramètres',
    description: 'Configuration de Waypaper Engine',
    icon: IconSettings
  }
]
