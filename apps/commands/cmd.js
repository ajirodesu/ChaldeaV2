import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname equivalent for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use global.scripts if already set; otherwise, require it directly.
const scriptsUtils = global.scripts

/**
 * Helper: Unloads a command from the global cache and Node's require cache.
 * @param {string} commandName - Name of the command (without .js extension)
 * @param {string} commandsDir - Directory where command files are stored.
 */
function unloadCommand(commandName, commandsDir) {
  // Remove from global commands collection if loaded.
  if (global.chaldea.commands.has(commandName)) {
    global.chaldea.commands.delete(commandName);
  }
  // Remove the module from Node's require cache.
  const commandFile = path.join(commandsDir, `${commandName}.js`);
  try {
    delete require.cache[require.resolve(commandFile)];
  } catch (error) {
    // Module might not be cached.
  }
}

export const meta = {
  name: "cmd",
  aliases: [],
  prefix: "both",
  version: "1.0.0",
  author: "ShawnDesu",
  description: "Manage commands: install, delete, load, unload, loadall",
  guide: [
    "install <sourceFilePath> - Installs a new command",
    "delete <commandName>    - Deletes a command",
    "load <commandName>      - Loads a command",
    "unload <commandName>    - Unloads a command",
    "loadall                 - Loads all commands and events"
  ],
  cooldown: 5,
  type: "owner",
  category: "owner"
};

export async function onStart({ response, chatId, msg, args, usages }) {
  // Make sure an action is provided.
  if (!args[0]) return await usages();
  const action = args[0].toLowerCase();
  // Assume your command files are located in the same directory as this cmd file.
  const commandsDir = __dirname;

  switch (action) {
    case 'install': {
      // Usage: install <sourceFilePath>
      if (!args[1]) {
        return await response.reply("Please provide the source file path to install the command.");
      }
      const sourceFilePath = args[1];
      if (!await fs.pathExists(sourceFilePath)) {
        return await response.reply(`Source file does not exist at: ${sourceFilePath}`);
      }
      try {
        const fileName = path.basename(sourceFilePath);
        const destination = path.join(commandsDir, fileName);
        // Copy file without overwriting an existing command.
        await fs.copy(sourceFilePath, destination, { overwrite: false });
        // Validate the new command by requiring it.
        const moduleLoaded = require(destination);
        const commandModule = moduleLoaded.default || moduleLoaded;
        if (!commandModule.meta || !commandModule.onStart) {
          // Clean up if the module isn't valid
          await fs.remove(destination);
          return await response.reply("The installed command is invalid (missing meta or onStart). File was removed.");
        }
        // Add to global commands.
        global.chaldea.commands.set(commandModule.meta.name, commandModule);
        return await response.reply(`Command installed successfully: ${fileName}`);
      } catch (error) {
        console.error("Error installing command:", error);
        return await response.reply(`Error installing command: ${error.message}`);
      }
    }

    case 'delete': {
      // Usage: delete <commandName>
      if (!args[1]) {
        return await response.reply("Please provide the command name to delete.");
      }
      const commandName = args[1];
      try {
        const commandFile = path.join(commandsDir, `${commandName}.js`);
        if (!await fs.pathExists(commandFile)) {
          return await response.reply(`Command file not found: ${commandName}.js`);
        }
        // Unload and then remove the file.
        unloadCommand(commandName, commandsDir);
        await fs.remove(commandFile);
        return await response.reply(`Command deleted successfully: ${commandName}.js`);
      } catch (error) {
        console.error("Error deleting command:", error);
        return await response.reply(`Error deleting command: ${error.message}`);
      }
    }

    case 'load': {
      // Usage: load <commandName>
      if (!args[1]) {
        return await response.reply("Please provide the command name to load.");
      }
      const commandName = args[1];
      try {
        const commandFile = path.join(commandsDir, `${commandName}.js`);
        if (!await fs.pathExists(commandFile)) {
          return await response.reply(`Command file not found: ${commandName}.js`);
        }
        // Unload any cached version first.
        unloadCommand(commandName, commandsDir);
        const moduleLoaded = require(commandFile);
        const commandModule = moduleLoaded.default || moduleLoaded;
        if (!commandModule.meta || !commandModule.onStart) {
          return await response.reply("Loaded command is invalid (missing meta or onStart).");
        }
        global.chaldea.commands.set(commandModule.meta.name, commandModule);
        return await response.reply(`Command loaded successfully: ${commandModule.meta.name}`);
      } catch (error) {
        console.error("Error loading command:", error);
        return await response.reply(`Error loading command: ${error.message}`);
      }
    }

    case 'unload': {
      // Usage: unload <commandName>
      if (!args[1]) {
        return await response.reply("Please provide the command name to unload.");
      }
      const commandName = args[1];
      try {
        unloadCommand(commandName, commandsDir);
        return await response.reply(`Command unloaded successfully: ${commandName}`);
      } catch (error) {
        console.error("Error unloading command:", error);
        return await response.reply(`Error unloading command: ${error.message}`);
      }
    }

    case 'loadall': {
      // Usage: loadall
      try {
        // Make sure scriptsUtils is a function before calling it
        if (typeof scriptsUtils !== 'function') {
          return await response.reply("Error: scriptsUtils is not properly defined or imported.");
        }

        const errors = await scriptsUtils();
        if (errors && Object.keys(errors).length > 0) {
          return await response.reply(`Loaded all commands with some errors: ${JSON.stringify(errors)}`);
        }
        return await response.reply("All commands loaded successfully.");
      } catch (error) {
        console.error("Error loading all commands:", error);
        return await response.reply(`Error loading all commands: ${error.message}`);
      }
    }

    default: {
      return await response.reply("Unknown action. Valid actions: install, delete, load, unload, loadall.");
    }
  }
};