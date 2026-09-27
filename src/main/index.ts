import { app, shell, BrowserWindow, dialog, ipcMain, protocol, net } from 'electron'
import { detectWorkshopFolders, readConfig, scanWorkshopFolder, writeConfig } from './workshop'
import { detectBackends, setActiveBackend, setWallpaper, stopWallpaper } from './render'
import { join } from 'path'
import { pathToFileURL } from 'url'
import type { SetWallpaperPayload } from '../shared/render'
import { is } from '@electron-toolkit/utils'

function isWaylandSession(): boolean {
  if (process.env['WAYLAND_DISPLAY']) return true
  const sessionType = process.env['XDG_SESSION_TYPE']
  return sessionType === 'wayland'
}

function configureDisplayBackend(): void {
  if (process.platform === 'linux') {
    app.commandLine.appendSwitch('gtk-version', '3')
  }

  if (!isWaylandSession()) {
    console.log('[waypaper] session X11 : backend natif x11')
    return
  }

  if (process.env['WAYPAPER_FORCE_XWAYLAND'] === '1') {
    console.log('[waypaper] session Wayland : XWayland demandé (WAYPAPER_FORCE_XWAYLAND=1)')
    app.commandLine.appendSwitch('ozone-platform', 'x11')
    return
  }

  console.log('[waypaper] session Wayland : backend natif Wayland')
  app.commandLine.appendSwitch('use-angle', 'gl')
  app.commandLine.appendSwitch('disable-features', 'Vulkan,VulkanFromANGLE,DefaultANGLEVulkan')
  app.commandLine.appendSwitch('disable-vulkan-surface')
  app.commandLine.appendSwitch('disable-vulkan-native-surface')
}

ipcMain.handle('workshop:get-folder', () => readConfig())

ipcMain.handle('workshop:set-folder', async (_event, folder: string | null) => {
  await writeConfig({ folder })
  return folder
})

ipcMain.handle('workshop:pick-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: "Choisir le dossier de contenu Wallpaper Engine (431960)",
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('workshop:detect-folders', () => detectWorkshopFolders())

ipcMain.on('workshop:open-steam-store', () => {
  void shell.openExternal('steam://store/431960')
})

ipcMain.handle('workshop:scan', async () => {
  let config = await readConfig()
  if (!config.folder) {
    const detected = await detectWorkshopFolders()
    if (detected.length > 0) {
      config = { folder: detected[0].path }
      await writeConfig(config)
    }
  }
  if (!config.folder) {
    return { folder: null, items: [] as Awaited<ReturnType<typeof scanWorkshopFolder>> }
  }
  try {
    const items = await scanWorkshopFolder(config.folder)
    return { folder: config.folder, items }
  } catch (error) {
    console.error('[waypaper] scan Workshop échoué :', error)
    return { folder: config.folder, items: [] as Awaited<ReturnType<typeof scanWorkshopFolder>> }
  }
})

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 600,
    minWidth: 900,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#2b2f31',
    title: 'Waypaper Engine',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  ipcMain.handle('render:detect', () => detectBackends())
  ipcMain.handle('render:set-active', (_event, backendId: string | null) => setActiveBackend(backendId))
  ipcMain.handle('render:set', (_event, payload: SetWallpaperPayload) => setWallpaper(payload))
  ipcMain.handle('render:stop', () => stopWallpaper())

  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })
  ipcMain.on('window:close', () => win.close())

  win.on('maximize', () => win.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win.webContents.send('window:maximized', false))

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return
    const isF12 = input.key === 'F12'
    const isCmdOptI =
      process.platform === 'darwin' && input.meta && input.alt && input.key.toLowerCase() === 'i'
    const isCtrlShiftI =
      process.platform !== 'darwin' && input.control && input.shift && input.key.toLowerCase() === 'i'
    if (isF12 || isCmdOptI || isCtrlShiftI) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools()
      }
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const MEDIA_SCHEME = 'waypaper-media'

protocol.registerSchemesAsPrivileged([
  {
    scheme: MEDIA_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
  }
])

function registerMediaProtocol(): void {
  protocol.handle(MEDIA_SCHEME, (request) => {
    const filePath = decodeURIComponent(new URL(request.url).pathname)
    return net.fetch(pathToFileURL(filePath).toString())
  })
}

configureDisplayBackend()

if (process.env['WAYPAPER_DISABLE_GPU'] === '1') {
  console.log('[waypaper] WAYPAPER_DISABLE_GPU=1 : accélération GPU désactivée')
  app.disableHardwareAcceleration()
}

app.on('child-process-gone', (_event, details) => {
  console.error('[waypaper] process enfant terminé :', JSON.stringify(details, null, 2))
})

app.on('render-process-gone', (_event, _wc, details) => {
  console.error('[waypaper] process renderer terminé :', JSON.stringify(details, null, 2))
})

void app.whenReady().then(() => {
  registerMediaProtocol()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
