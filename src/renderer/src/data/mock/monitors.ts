export interface DemoMonitor {
  id: string
  name: string
  width: number
  height: number
  scale: number
}

export const MOCK_MONITORS: DemoMonitor[] = [
  {
    id: 'monitor-0',
    name: 'DP-1',
    width: 2560,
    height: 1440,
    scale: 1
  },
  {
    id: 'monitor-1',
    name: 'HDMI-A-1',
    width: 1920,
    height: 1080,
    scale: 1
  }
]
