import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { DEFAULT_PORT, DEFAULT_VITE_PORT } from '@potato-cannon/shared'

// Set app name for dock/taskbar (must be before app is ready)
app.setName('Potato Cannon')

let daemonProcess: ChildProcess | null = null

// Handle folder picker dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
})

/**
 * Start the daemon process.
 *
 * Dev mode: The daemon must already be running (started via `pnpm dev:daemon`
 * in a terminal). Electron in dev is just a browser window wrapper — it doesn't
 * manage the daemon lifecycle. This avoids all native module ABI conflicts
 * since the daemon runs under the user's normal Node.js.
 *
 * Production mode: Spawns the bundled daemon using Electron's own binary with
 * ELECTRON_RUN_AS_NODE=1. Native modules are rebuilt for Electron's ABI by
 * electron-builder and copied into the bundle by copy-native-modules.cjs.
 */
async function startDaemon(): Promise<void> {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development'

  // In dev mode, don't spawn — just verify the daemon is reachable.
  if (isDev) {
    return
  }

  // --- Production only below ---

  const bundledDaemonDir = path.join(process.resourcesPath, 'daemon')

  // _modules needs to be accessible as node_modules for ESM resolution.
  // On Linux (AppImage), the filesystem is read-only, so we create a temp directory
  // with symlinks. On Mac/Windows, we can symlink directly inside the bundle.
  let daemonDir: string
  if (process.platform === 'linux') {
    const tempDaemonDir = path.join(app.getPath('temp'), 'potato-cannon-daemon')
    if (fs.existsSync(tempDaemonDir)) {
      fs.rmSync(tempDaemonDir, { recursive: true })
    }
    fs.mkdirSync(tempDaemonDir, { recursive: true })

    for (const entry of fs.readdirSync(bundledDaemonDir)) {
      if (entry === '_modules') continue
      fs.symlinkSync(
        path.join(bundledDaemonDir, entry),
        path.join(tempDaemonDir, entry)
      )
    }

    fs.symlinkSync(
      path.join(bundledDaemonDir, '_modules'),
      path.join(tempDaemonDir, 'node_modules')
    )
    console.log('[electron] Created temp daemon directory with node_modules symlink')
    daemonDir = tempDaemonDir
  } else {
    // Mac/Windows: bundle filesystem is writable, symlink directly
    const modulesPath = path.join(bundledDaemonDir, '_modules')
    const nodeModulesPath = path.join(bundledDaemonDir, 'node_modules')
    if (fs.existsSync(modulesPath) && !fs.existsSync(nodeModulesPath)) {
      try {
        fs.symlinkSync(modulesPath, nodeModulesPath, 'junction')
        console.log('[electron] Created node_modules symlink for ESM resolution')
      } catch (err) {
        console.error('[electron] Failed to create node_modules symlink:', err)
      }
    }
    daemonDir = bundledDaemonDir
  }

  const daemonPath = path.join(daemonDir, 'bin', 'potato-cannon.js')

  // Use Electron's binary with ELECTRON_RUN_AS_NODE=1 so native modules
  // (rebuilt for Electron's ABI by electron-builder) load correctly.
  const nodePath = process.execPath
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1'
  }

  // On Linux, pass the frontend path explicitly since the daemon runs from a
  // temp dir where relative paths back to the AppImage won't resolve.
  if (process.platform === 'linux') {
    ;(env as Record<string, string>).POTATO_FRONTEND_DIST = path.join(process.resourcesPath, 'frontend')
  }

  console.log(`[electron] Starting daemon: ${nodePath} ${daemonPath} start`)

  // On Linux, use --preserve-symlinks so Node.js resolves modules relative
  // to the symlink paths (temp dir with node_modules) rather than the real paths
  // (read-only AppImage where only _modules exists).
  const nodeArgs = (process.platform === 'linux')
    ? ['--preserve-symlinks', '--preserve-symlinks-main', daemonPath, 'start']
    : [daemonPath, 'start']

  daemonProcess = spawn(nodePath, nodeArgs, {
    cwd: daemonDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  daemonProcess.stdout?.on('data', (data) => {
    console.log(`[daemon] ${data}`)
  })

  daemonProcess.stderr?.on('data', (data) => {
    console.error(`[daemon] ${data}`)
  })

  daemonProcess.on('error', (err) => {
    console.error(`[daemon] error:`, err)
  })

  // Give daemon a moment to start
  await new Promise(r => setTimeout(r, 2000))
}

async function waitForHealth(): Promise<boolean> {
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${DEFAULT_PORT}/health`)
      if (response.ok) return true
    } catch {
      // Retry
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

function createWindow() {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development'

  // Icon path differs between dev and prod
  // Dev: __dirname is apps/desktop/out/main/, icon is in apps/desktop/build/
  // Prod: icon is bundled with the app
  const iconPath = isDev
    ? path.join(__dirname, '..', '..', 'build', 'icon.png')
    : path.join(process.resourcesPath, 'icon.png')

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117'
  })

  // Set dock icon on macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(iconPath)
  }

  // In dev: load from Vite dev server (which proxies API to daemon)
  // In prod: load from daemon (which serves static files)
  const url = isDev
    ? `http://localhost:${DEFAULT_VITE_PORT}`
    : `http://localhost:${DEFAULT_PORT}`

  win.loadURL(url)
}

app.whenReady().then(async () => {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development'

  try {
    await startDaemon()
    const healthy = await waitForHealth()
    if (!healthy) {
      const message = isDev
        ? 'Could not connect to daemon.\n\nStart it first with: pnpm dev:daemon'
        : 'Could not start daemon'
      dialog.showErrorBox('Startup Error', message)
      app.quit()
      return
    }
    createWindow()
  } catch (err) {
    dialog.showErrorBox('Startup Error', String(err))
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  if (daemonProcess) {
    daemonProcess.kill()
  }
})
