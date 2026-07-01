import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  screen,
  shell,
} from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { PortScanner } from './port-monitor'

let tray: Tray | null = null
let trayWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null
const scanner = new PortScanner()
let scanInterval: NodeJS.Timeout | null = null
let currentTheme = 'dark'

// Only use dev server if dist files don't exist (true development mode)
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html')
const isDev = !app.isPackaged && !fs.existsSync(distIndexPath)

function getDistPath(...segments: string[]) {
  return path.join(__dirname, '..', 'dist', ...segments)
}

function createTrayIcon(): Electron.NativeImage {
  // Create a simple colored icon for the tray (16x16)
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const cx = x - size / 2
      const cy = y - size / 2
      const dist = Math.sqrt(cx * cx + cy * cy)
      if (dist < size / 2 - 1) {
        canvas[idx] = 95     // R
        canvas[idx + 1] = 141 // G
        canvas[idx + 2] = 255 // B (#5a8dff)
        canvas[idx + 3] = 255 // A
      } else {
        canvas[idx + 3] = 0 // Transparent
      }
    }
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

function createTray() {
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('Ports - 端口监控')

  // Create tray popup window
  trayWindow = new BrowserWindow({
    width: 420,
    height: 580,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    trayWindow.loadURL('http://localhost:5173/tray.html')
  } else {
    trayWindow.loadFile(getDistPath('tray.html'))
  }

  trayWindow.on('blur', () => {
    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.hide()
    }
  })

  // Tray click handler
  tray.on('click', () => {
    if (!trayWindow || !tray) return

    if (trayWindow.isVisible()) {
      trayWindow.hide()
    } else {
      const trayBounds = tray.getBounds()
      const windowBounds = trayWindow.getBounds()
      const display = screen.getDisplayNearestPoint({
        x: trayBounds.x,
        y: trayBounds.y,
      })

      let x = Math.round(
        trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
      )
      let y = Math.round(trayBounds.y + trayBounds.height + 4)

      // Keep window within screen bounds
      x = Math.max(
        display.workArea.x,
        Math.min(x, display.workArea.x + display.workArea.width - windowBounds.width)
      )
      y = Math.max(
        display.workArea.y,
        Math.min(y, display.workArea.y + display.workArea.height - windowBounds.height)
      )

      trayWindow.setPosition(x, y)
      trayWindow.show()
      trayWindow.focus()
    }
  })

  // Tray context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createMainWindow()
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    title: 'Ports - 端口监控',
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: currentTheme === 'dark' ? '#1c1b20' : '#f5f1ea',
      symbolColor: currentTheme === 'dark' ? '#ffffff' : '#000000',
    },
    backgroundColor: currentTheme === 'dark' ? '#1c1b20' : '#f5f1ea',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/index.html')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(getDistPath('index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startScanning() {
  const doScan = async () => {
    const ports = await scanner.scan()
    // Send to tray window
    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.webContents.send('ports-update', ports)
    }
    // Send to main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ports-update', ports)
    }
  }

  doScan() // Initial scan
  scanInterval = setInterval(doScan, 2000) // Scan every 2 seconds
}

// IPC Handlers
function setupIPC() {
  ipcMain.handle('get-ports', async () => {
    return await scanner.scan()
  })

  ipcMain.handle('kill-process', async (_event, pid: number) => {
    return await scanner.killProcess(pid)
  })

  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('get-theme', () => {
    return currentTheme
  })

  ipcMain.handle('set-theme', (_event, theme: string) => {
    currentTheme = theme
    // Update main window title bar overlay if exists
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        (mainWindow as any).setTitleBarOverlay({
          color: theme === 'dark' ? '#1c1b20' : '#f5f1ea',
          symbolColor: theme === 'dark' ? '#ffffff' : '#000000',
        })
      } catch {
        // setTitleBarOverlay might not be available
      }
    }
  })

  ipcMain.handle('get-view-mode', (event) => {
    if (trayWindow && event.sender.id === trayWindow.webContents.id) {
      return 'tray'
    }
    return 'window'
  })
}

// App lifecycle
app.whenReady().then(() => {
  setupIPC()
  createTray()
  createMainWindow()
  startScanning()
})

app.on('window-all-closed', () => {
  // On Windows, don't quit when all windows are closed (keep tray alive)
  // User can quit from tray menu
})

app.on('before-quit', () => {
  if (scanInterval) {
    clearInterval(scanInterval)
  }
})

app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow()
  }
})
