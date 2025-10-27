import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

/**
 * Helper: Unloads a command from the global cache
 */
function unloadCommand(commandName) {
  if (global.chaldea.commands.has(commandName)) {
    global.chaldea.commands.delete(commandName);
  }
}

export async function onStart({ response, args, usages }) {
  if (!args[0]) return await usages();

  const action = args[0].toLowerCase();
  const commandsDir = __dirname;

  switch (action) {
    case 'install': {
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

        await fs.copy(sourceFilePath, destination, { overwrite: false });

        // Validate by importing
        const moduleUrl = `file://${destination}?t=${Date.now()}`;
        const commandModule = await import(moduleUrl);

        if (!commandModule.meta || !commandModule.onStart) {
          await fs.remove(destination);
          return await response.reply("The installed command is invalid (missing meta or onStart). File was removed.");
        }

        global.chaldea.commands.set(commandModule.meta.name, commandModule);
        return await response.reply(`Command installed successfully: ${fileName}`);
      } catch (error) {
        console.error("Error installing command:", error);
        return await response.reply(`Error installing command: ${error.message}`);
      }
    }

    case 'delete': {
      if (!args[1]) {
        return await response.reply("Please provide the command name to delete.");
      }

      const commandName = args[1];
      try {
        const commandFile = path.join(commandsDir, `${commandName}.js`);
        if (!await fs.pathExists(commandFile)) {
          return await response.reply(`Command file not found: ${commandName}.js`);
        }

        unloadCommand(commandName);
        await fs.remove(commandFile);
        return await response.reply(`Command deleted successfully: ${commandName}.js`);
      } catch (error) {
        console.error("Error deleting command:", error);
        return await response.reply(`Error deleting command: ${error.message}`);
      }
    }

    case 'load': {
      if (!args[1]) {
        return await response.reply("Please provide the command name to load.");
      }

      const commandName = args[1];
      try {
        const commandFile = path.join(commandsDir, `${commandName}.js`);
        if (!await fs.pathExists(commandFile)) {
          return await response.reply(`Command file not found: ${commandName}.js`);
        }

        unloadCommand(commandName);

        const moduleUrl = `file://${commandFile}?t=${Date.now()}`;
        const commandModule = await import(moduleUrl);

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
      if (!args[1]) {
        return await response.reply("Please provide the command name to unload.");
      }

      const commandName = args[1];
      try {
        unloadCommand(commandName);
        return await response.reply(`Command unloaded successfully: ${commandName}`);
      } catch (error) {
        console.error("Error unloading command:", error);
        return await response.reply(`Error unloading command: ${error.message}`);
      }
    }

    case 'loadall': {
      try {
        if (typeof global.scripts !== 'function') {
          return await response.reply("Error: scriptsUtils is not properly defined.");
        }

        const errors = await global.scripts();
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
}