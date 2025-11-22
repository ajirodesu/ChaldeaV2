import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { create, clear } from './cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize and clear the cache
 */
const cacheReady = (async () => {
  await create();
  await clear();
})();

/**
 * Validates a module has required properties
 * @param {Object} module - The module to validate
 * @param {string} moduleType - Type of the module ('command' or 'event')
 * @throws {Error} If module is invalid
 */
function validateModule(module, moduleType) {
  if (!module) {
    throw new Error('No export found in module');
  }
  if (!module.meta) {
    throw new Error('Missing meta property in module');
  }
  if (!module.meta.name || typeof module.meta.name !== 'string') {
    throw new Error('Missing or invalid meta.name in module');
  }
  if (moduleType === 'command' && module.meta.aliases) {
    if (!Array.isArray(module.meta.aliases) || !module.meta.aliases.every(alias => typeof alias === 'string')) {
      throw new Error('Invalid meta.aliases in command module');
    }
    const aliasesSet = new Set(module.meta.aliases);
    if (aliasesSet.size !== module.meta.aliases.length) {
      throw new Error('Duplicate aliases in command module');
    }
    if (aliasesSet.has(module.meta.name)) {
      throw new Error('Command name is also an alias in module');
    }
  }
  if (!module.onStart) {
    throw new Error('Missing onStart method in module');
  }
}

/**
 * Loads modules from a directory into a collection
 * @param {string} directory - Directory path to load from
 * @param {string} moduleType - Type of modules being loaded ('command' or 'event')
 * @param {Map} collection - Collection to store loaded modules
 * @param {Object} log - The log module for logging
 * @returns {Object} Object containing any errors encountered
 */
async function loadDirectory(directory, moduleType, collection, log) {
  const errors = {};
  const usedIdentifiers = new Set();
  const logger = moduleType === 'command' ? log.commands : log.events;
  const loadingMessage = moduleType === 'command' ? 'LOADING COMMANDS' : 'LOADING EVENTS';

  console.log(chalk.blue(loadingMessage));

  try {
    const files = await fs.readdir(directory);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    for (const file of jsFiles) {
      try {
        const modulePath = path.join(directory, file);
        const cacheBuster = `?update=${Date.now()}`;
        const module = await import(`file://${modulePath}${cacheBuster}`);
        const moduleExport = module.default || module;

        // validate the module as before
        validateModule(moduleExport, moduleType);

        // Validate identifiers and store full meta without trimming.
        if (moduleType === 'command') {
          const { name, aliases = [] } = moduleExport.meta;
          if (usedIdentifiers.has(name)) {
            throw new Error(`Duplicate command name "${name}"`);
          }
          for (const alias of aliases) {
            if (usedIdentifiers.has(alias)) {
              throw new Error(`Duplicate alias "${alias}" for command "${name}"`);
            }
          }
          usedIdentifiers.add(name);
          aliases.forEach(alias => usedIdentifiers.add(alias));
        } else {
          const { name } = moduleExport.meta;
          if (usedIdentifiers.has(name)) {
            throw new Error(`Duplicate event name "${name}"`);
          }
          usedIdentifiers.add(name);
        }

        // store the full module (with full meta) in the collection keyed by name
        collection.set(moduleExport.meta.name, moduleExport);

        // Log successful load
        logger(`Loaded "${moduleExport.meta.name}"`);
      } catch (error) {
        const errorMsg = `Error loading ${moduleType} "${file}": ${error.message}`;
        log.error(errorMsg);
        errors[file] = error;
      }
    }
  } catch (error) {
    const errorMsg = `Error reading ${moduleType} directory "${directory}": ${error.message}`;
    log.error(errorMsg);
    errors.directory = error;
  }

  return errors;
}

/**
 * Loads all commands and events from their respective directories
 * @param {Object} log - The log module for logging
 * @returns {Object|false} Object containing errors if any occurred, false otherwise
 */
export async function scripts(log) {
  await cacheReady;

  if (!log) {
    const configPath = path.join(process.cwd(), 'core', 'utility', 'config.json');
    const configLog = JSON.parse(await fs.readFile(configPath, 'utf8'));
    log = {
      commands: (message) => console.log(`${chalk.blue(configLog.cmd)} - ${message}`),
      events: (message) => console.log(`${chalk.blue(configLog.evnts)} - ${message}`),
      error: (message) => console.log(`${chalk.red(configLog.err)} - ${message}`),
    };
  }

  const errors = {};
  const commandsPath = path.join(process.cwd(), 'apps', 'commands');
  const eventsPath = path.join(process.cwd(), 'apps', 'events');

  // Clear existing collections before reloading
  global.chaldea.commands.clear();
  global.chaldea.events.clear();

  const commandErrors = await loadDirectory(commandsPath, 'command', global.chaldea.commands, log);
  log.commands(`Loaded ${global.chaldea.commands.size} commands successfully`);
  console.log('');

  const eventErrors = await loadDirectory(eventsPath, 'event', global.chaldea.events, log);
  log.events(`Loaded ${global.chaldea.events.size} events successfully`);

  Object.assign(errors, commandErrors, eventErrors);

  if (Object.keys(errors).length > 0) {
    log.error(`Errors occurred during utils loading: ${JSON.stringify(errors, null, 2)}`);
  }

  return Object.keys(errors).length === 0 ? false : errors;
}