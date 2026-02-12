const fs = require('fs');
const path = require('path');

// afterPack hook for electron-builder
// Copies native modules from app.asar.unpacked to daemon/node_modules
// so the daemon process can find them when running with ELECTRON_RUN_AS_NODE
exports.default = async function(context) {
  const { appOutDir, packager } = context;

  console.log('[afterPack] Starting native module copy...');

  // Determine paths based on platform
  let resourcesDir;
  if (packager.platform.name === 'mac') {
    resourcesDir = path.join(appOutDir, `${packager.appInfo.productFilename}.app`, 'Contents', 'Resources');
  } else {
    resourcesDir = path.join(appOutDir, 'resources');
  }

  const unpackedModules = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules');
  const daemonModules = path.join(resourcesDir, 'daemon', 'node_modules');
  const workspaceModules = path.join(__dirname, '..', '..', '..', 'node_modules');

  // Check if unpacked modules exist
  if (!fs.existsSync(unpackedModules)) {
    console.log('[afterPack] No unpacked node_modules found, skipping copy');
    return;
  }

  // Create daemon/node_modules directory
  fs.mkdirSync(daemonModules, { recursive: true });

  // Copy native modules (better-sqlite3, node-pty) from unpacked
  const nativeModules = ['better-sqlite3', 'node-pty'];
  for (const moduleName of nativeModules) {
    const srcPath = path.join(unpackedModules, moduleName);
    const destPath = path.join(daemonModules, moduleName);

    if (fs.existsSync(srcPath)) {
      console.log(`[afterPack] Copying ${moduleName} to daemon/node_modules`);
      copyDirSync(srcPath, destPath);
    } else {
      console.log(`[afterPack] ${moduleName} not found in unpacked modules`);
    }
  }

  // Copy JS-only dependencies from workspace
  const jsDeps = ['bindings', 'file-uri-to-path'];
  for (const moduleName of jsDeps) {
    const srcPath = path.join(workspaceModules, moduleName);
    const destPath = path.join(daemonModules, moduleName);

    if (fs.existsSync(srcPath)) {
      console.log(`[afterPack] Copying ${moduleName} from workspace`);
      copyDirSync(srcPath, destPath);
    } else {
      console.log(`[afterPack] ${moduleName} not found in workspace`);
    }
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
