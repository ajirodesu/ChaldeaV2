import fs from 'fs';
import path from 'path';

const cacheDir = path.join(process.cwd(), 'apps/temp');

let clearTimeoutId = null;

/**
 * Creates the cache directory if it doesn't exist.
 * Throws an error if creation fails critically.
 */
export const create = async () => {
  try {
    await fs.promises.mkdir(cacheDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating cache directory: ${err.message}`);
    try {
      await fs.promises.access(cacheDir);
    } catch {
      throw new Error(`Failed to ensure cache directory exists: ${err.message}`);
    }
  }
};

/**
 * Clears all files in the cache directory.
 * Recreates the directory if it's missing.
 */
export const clear = async () => {
  try {
    const files = await fs.promises.readdir(cacheDir);
    if (files.length) {
      const deletePromises = files.map(async (file) => {
        const filePath = path.join(cacheDir, file);
        try {
          await fs.promises.unlink(filePath);
          return file;
        } catch (err) {
          console.error(`Error deleting file ${filePath}: ${err.message}`);
          return null;
        }
      });

      const deletedFiles = (await Promise.all(deletePromises)).filter(Boolean);
      if (deletedFiles.length) {
        console.log(`${deletedFiles.length} cache files cleared`);
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('Cache directory missing. Recreating it.');
      await create();
    } else {
      console.error(`Error clearing cache: ${err.message}`);
    }
  }
};

/**
 * Watches the cache directory for changes and clears it after a 30-second debounce.
 * Retries on watcher errors.
 */
export const watch = async () => {
  try {
    await create();
    const watcher = fs.watch(cacheDir, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        if (clearTimeoutId) {
          clearTimeout(clearTimeoutId);
        }
        clearTimeoutId = setTimeout(async () => {
          try {
            const files = await fs.promises.readdir(cacheDir);
            if (files.length) {
              console.log(`${files.length} cache files detected. Clearing now.`);
              await clear();
            }
          } catch (err) {
            console.error(`Error reading cache directory: ${err.message}`);
          }
        }, 30000);
      }
    });

    watcher.on('error', (err) => {
      console.error(`Watcher error: ${err.message}. Restarting watcher.`);
      watcher.close();
      setTimeout(watch, 5000);
    });
  } catch (err) {
    console.error(`Error setting up watcher: ${err.message}`);
    setTimeout(watch, 5000);
  }
};

(async () => {
  try {
    await create();
    await watch();
  } catch (err) {
    console.error(`Initialization failed: ${err.message}`);
    process.exit(1);
  }
})();
