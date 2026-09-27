import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

function isWaylandSession(): boolean {
  if (process.env['WAYLAND_DISPLAY']) return true
  const sessionType = process.env['XDG_SESSION_TYPE']
  return sessionType === 'wayland'
}

function configureDisplayBackend(): void {
  const forceNativeWayland = process.env['WAYPAPER_NATIVE_WAYLAND'] === '1'
  const wayland = isWaylandSession()

  if (!wayland) {
    console.log('[waypaper] session X11 : backend natif x11')
    return
  }

  if (forceNativeWayland) {
    console.log('[waypaper] session Wayland : backend natif demandé (WAYPAPER_NATIVE_WAYLAND=1)')
    app.commandLine.appendSwitch('use-angle', 'gl')
    app.commandLine.appendSwitch('disable-features', 'Vulkan,VulkanFromANGLE,DefaultANGLEVulkan')
    app.commandLine.appendSwitch('disable-vulkan-surface')
    app.commandLine.appendSwitch('disable-vulkan-native-surface')
    return
  }

  console.log('[waypaper] session Wayland : bascule UI sur XWayland (ozone x11)')
  app.commandLine.appendSwitch('ozone-platform', 'x11')
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 600,
    minWidth: 900,
    show: false,
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

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

configureDisplayBackend()

void app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
