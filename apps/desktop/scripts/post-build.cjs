#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Post-build script to copy native modules and dependencies to daemon/node_modules
// This must run AFTER electron-builder but BEFORE code signing

const releaseDir = path.join(__dirname, '..', 'release');
const platform = process.platform;

let appPath;
if (platform === 'darwin') {
  // Find the .app directory
  const macDir = fs.readdirSync(releaseDir).find(f => f.startsWith('mac'));
  if (!macDir) {
    console.log('[post-build] No mac release directory found');
    process.exit(0);
  }
  const appName = fs.readdirSync(path.join(releaseDir, macDir)).find(f => f.endsWith('.app'));
  if (!appName) {
    console.log('[post-build] No .app found');
    process.exit(0);
  }
  appPath = path.join(releaseDir, macDir, appName, 'Contents', 'Resources');
} else {
  appPath = path.join(releaseDir, 'resources');
}

const unpackedModules = path.join(appPath, 'app.asar.unpacked', 'node_modules');
const daemonModules = path.join(appPath, 'daemon', 'node_modules');
const workspaceModules = path.join(__dirname, '..', '..', '..', 'node_modules');

console.log('[post-build] Copying native modules to daemon/node_modules');

// Create daemon/node_modules
fs.mkdirSync(daemonModules, { recursive: true });

// Copy native modules from unpacked (these are rebuilt for Electron)
const nativeModules = ['better-sqlite3', 'node-pty'];
for (const mod of nativeModules) {
  const src = path.join(unpackedModules, mod);
  const dest = path.join(daemonModules, mod);
  if (fs.existsSync(src)) {
    console.log(`[post-build] Copying ${mod} from unpacked`);
    copyDirSync(src, dest);
  }
}

// Copy JS-only dependencies from workspace
const jsDeps = ['bindings', 'file-uri-to-path'];
for (const mod of jsDeps) {
  const src = path.join(workspaceModules, mod);
  const dest = path.join(daemonModules, mod);
  if (fs.existsSync(src)) {
    console.log(`[post-build] Copying ${mod} from workspace`);
    copyDirSync(src, dest);
  }
}

console.log('[post-build] Done');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
