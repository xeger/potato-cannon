const fs = require('fs');
const path = require('path');

// afterPack hook for electron-builder
// Copies native modules from app.asar.unpacked to daemon/node_modules
// so the daemon process can find them when running with ELECTRON_RUN_AS_NODE
exports.default = async function(context) {
  const { appOutDir, packager } = context;

  // Determine paths based on platform
  let resourcesDir;
  if (packager.platform.name === 'mac') {
    resourcesDir = path.join(appOutDir, `${packager.appInfo.productFilename}.app`, 'Contents', 'Resources');
  } else {
    resourcesDir = path.join(appOutDir, 'resources');
  }

  const unpackedModules = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules');
  const daemonModules = path.join(resourcesDir, 'daemon', 'node_modules');

  // Check if unpacked modules exist
  if (!fs.existsSync(unpackedModules)) {
    console.log('[afterPack] No unpacked node_modules found, skipping copy');
    return;
  }

  // Create daemon/node_modules directory
  fs.mkdirSync(daemonModules, { recursive: true });

  // Copy native modules (better-sqlite3, node-pty)
  const modulesToCopy = ['better-sqlite3', 'node-pty'];

  for (const moduleName of modulesToCopy) {
    const srcPath = path.join(unpackedModules, moduleName);
    const destPath = path.join(daemonModules, moduleName);

    if (fs.existsSync(srcPath)) {
      console.log(`[afterPack] Copying ${moduleName} to daemon/node_modules`);
      copyDirSync(srcPath, destPath);
    } else {
      console.log(`[afterPack] ${moduleName} not found in unpacked modules`);
    }
  }

  // Also copy bindings package which is needed by better-sqlite3
  const bindingsPath = path.join(unpackedModules, 'bindings');
  if (fs.existsSync(bindingsPath)) {
    console.log('[afterPack] Copying bindings to daemon/node_modules');
    copyDirSync(bindingsPath, path.join(daemonModules, 'bindings'));
  }

  // Copy file-uri-to-path which bindings depends on
  const fileUriPath = path.join(unpackedModules, 'file-uri-to-path');
  if (fs.existsSync(fileUriPath)) {
    console.log('[afterPack] Copying file-uri-to-path to daemon/node_modules');
    copyDirSync(fileUriPath, path.join(daemonModules, 'file-uri-to-path'));
  }

  console.log('[afterPack] Native modules copied successfully');
};

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
