import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

function isWaylandSession(): boolean {
  if (process.env['WAYLAND_DISPLAY']) return true
  const sessionType = process.env['XDG_SESSION_TYPE']
  return sessionType === 'wayland'
}

function disableVulkanOnWayland(): void {
  if (isWaylandSession()) {
    app.commandLine.appendSwitch('disable-features', 'Vulkan')
  }
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

disableVulkanOnWayland()

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
