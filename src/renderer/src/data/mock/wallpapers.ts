import type { Wallpaper } from '../wallpaper'

export const MOCK_WALLPAPERS: Wallpaper[] = [
  {
    id: 'wp-001',
    workshopId: '2922746564',
    title: 'Sakura Drift',
    author: 'KawaStudio',
    description: 'Pétales de cerisier animés sur fond de montagne',
    preview: '/mock/previews/wp-001.jpg',
    tags: ['nature', 'anime', 'calme'],
    sizeMb: 42,
    updatedAt: '2026-09-01',
    folder: '/mock/wp-001',
    type: 'video',
    content: {
      videoFile: 'sakura-drift.mp4',
      width: 1920,
      height: 1080,
      hasAudio: true
    }
  },
  {
    id: 'wp-002',
    workshopId: '2922746565',
    title: 'Neon Tokyo Loop',
    author: 'CyberFond',
    description: 'Rue de Tokyo sous la pluie néon, boucle 4K',
    preview: '/mock/previews/wp-002.jpg',
    tags: ['cyberpunk', 'ville', 'pluie'],
    sizeMb: 210,
    updatedAt: '2026-09-10',
    folder: '/mock',
    type: 'video',
    content: {
      videoFile: 'neon-tokyo.mp4',
      width: 3840,
      height: 2160,
      hasAudio: false
    }
  },
  {
    id: 'wp-003',
    workshopId: '2922746566',
    title: 'Synthwave Grid',
    author: 'RetroWaveLab',
    description: 'Grille rétro avec soleil dégradé',
    preview: '/mock/previews/wp-003.jpg',
    tags: ['synthwave', 'rétro', 'gpu'],
    sizeMb: 8,
    updatedAt: '2026-08-22',
    folder: '/mock',
    type: 'scene',
    content: {
      sceneFile: 'scene.pkg',
      width: 1920,
      height: 1080
    }
  },
  {
    id: 'wp-004',
    workshopId: '2922746567',
    title: 'Lofi Girl Room',
    author: 'ChillCorner',
    description: 'Chambre animée avec platine vinyle',
    preview: '/mock/previews/wp-004.jpg',
    tags: ['lofi', 'anime', 'musique'],
    sizeMb: 15,
    updatedAt: '2026-09-15',
    folder: '/mock',
    type: 'web',
    content: {
      entryFile: 'index.html',
      width: 1920,
      height: 1080
    }
  },
  {
    id: 'wp-005',
    workshopId: '2922746568',
    title: 'Aurora Borealis',
    author: 'SkyForge',
    description: 'Aurores boréales sur ciel étoilé',
    preview: '/mock/previews/wp-005.jpg',
    tags: ['nature', 'nuit', 'calme'],
    sizeMb: 95,
    updatedAt: '2026-07-30',
    folder: '/mock',
    type: 'video',
    content: {
      videoFile: 'aurora.mp4',
      width: 3840,
      height: 2160,
      hasAudio: false
    }
  },
  {
    id: 'wp-006',
    workshopId: '2922746569',
    title: 'Particle Reactor',
    author: 'Shadersmith',
    description: 'Réacteur à particules interactif (scène)',
    preview: '/mock/previews/wp-006.jpg',
    tags: ['abstrait', 'particules', 'gpu'],
    sizeMb: 12,
    updatedAt: '2026-09-18',
    folder: '/mock',
    type: 'scene',
    content: {
      sceneFile: 'reactor.pkg',
      width: 2560,
      height: 1440
    }
  },
  {
    id: 'wp-007',
    workshopId: '2922746570',
    title: 'Clockwork Gears',
    author: 'MechDeck',
    description: 'Engrenages animés en CSS pur',
    preview: '/mock/previews/wp-007.jpg',
    tags: ['mécanique', 'horloge'],
    sizeMb: 3,
    updatedAt: '2026-06-12',
    folder: '/mock',
    type: 'web',
    content: {
      entryFile: 'gears.html',
      width: 1920,
      height: 1080
    }
  },
  {
    id: 'wp-008',
    workshopId: '2922746571',
    title: 'Deep Ocean',
    author: 'AquaPixel',
    description: 'Fond marin avec rayons de lumière',
    preview: '/mock/previews/wp-008.jpg',
    tags: ['océan', 'calme', 'poisson'],
    sizeMb: 130,
    updatedAt: '2026-08-05',
    folder: '/mock',
    type: 'video',
    content: {
      videoFile: 'deep-ocean.mp4',
      width: 3840,
      height: 2160,
      hasAudio: true
    }
  },
  {
    id: 'wp-009',
    workshopId: '2922746572',
    title: 'Matrix Rain Terminal',
    author: 'HackerVision',
    description: 'Terminal vert défilant (application)',
    preview: '/mock/previews/wp-009.jpg',
    tags: ['matrix', 'terminal'],
    sizeMb: 20,
    updatedAt: '2026-05-20',
    folder: '/mock',
    type: 'application',
    content: {
      executable: 'matrix-terminal.exe'
    }
  },
  {
    id: 'wp-010',
    workshopId: '2922746573',
    title: 'Calme Absolu',
    author: 'KawaStudio',
    description: 'Playlist de wallpapers apaisants',
    preview: '/mock/previews/wp-010.jpg',
    tags: ['playlist', 'calme'],
    sizeMb: 0,
    updatedAt: '2026-09-20',
    folder: '/mock',
    type: 'playlist',
    content: {
      children: ['wp-001', 'wp-005', 'wp-008']
    }
  }
]
