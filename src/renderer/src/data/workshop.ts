export const WORKSHOP_APP_ID = '431960'

export interface WorkshopFolder {
  value: string
  label: string
  path: string
}

export const DEFAULT_WORKSHOP_FOLDERS: WorkshopFolder[] = [
  {
    value: 'steam-native',
    label: 'Steam (standard)',
    path: '~/.local/share/Steam/steamapps/workshop/content/431960'
  },
  {
    value: 'steam-deb',
    label: 'Steam (paquet .deb)',
    path: '~/.steam/steam/steamapps/workshop/content/431960'
  },
  {
    value: 'steam-debian',
    label: 'Steam (debian-installation)',
    path: '~/.steam/debian-installation/steamapps/workshop/content/431960'
  },
  {
    value: 'steam-flatpak',
    label: 'Steam (Flatpak)',
    path: '~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/workshop/content/431960'
  },
  {
    value: 'steam-snap',
    label: 'Steam (Snap)',
    path: '~/snap/steam/common/.local/share/Steam/steamapps/workshop/content/431960'
  }
]
