import type { DisplayBackend, Monitor, PlaybackState } from '../display'

export const MOCK_MONITORS: Monitor[] = [
  {
    id: 'monitor-0',
    name: 'DP-1',
    width: 2560,
    height: 1440,
    refreshRate: 144,
    scale: 1
  },
  {
    id: 'monitor-1',
    name: 'HDMI-A-1',
    width: 1920,
    height: 1080,
    refreshRate: 60,
    scale: 1
  }
]

export const MOCK_PLAYBACK_STATES: PlaybackState[] = [
  {
    monitorId: 'monitor-0',
    wallpaperId: 'wp-002',
    status: 'running',
    fps: 30
  },
  {
    monitorId: 'monitor-1',
    wallpaperId: 'wp-007',
    status: 'paused',
    fps: 0,
    pausedAt: '2026-09-27T12:00:00Z'
  }
]

export const MOCK_ACTIVE_BACKEND: DisplayBackend = 'wlroots'
