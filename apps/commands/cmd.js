import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const meta = {
  name: "cmd",
  aliases: [],
  prefix: "both",
  version: "1.0.0",
  author: "ShawnDesu",
  description: "Manage commands: install, delete, load, unload, loadall",
  guide: [
    "install <url> <command file name> - Download and install a command file from a url",
    "delete <commandName>              - Deletes a command",
    "load <commandName>                - Loads a command",
    "unload <commandName>              - Unloads a command",
    "loadall                           - Loads all commands and events"
  ],
  cooldown: 5,
  type: "dev",
  category: "dev"
};

/**
 * Helper: Unloads a command from the global cache
 */
function unloadCommand(commandName) {
  if (global.chaldea.commands.has(commandName)) {
    global.chaldea.commands.delete(commandName);
  }
}

/**
 * Helper: Downloads content from a URL
 */
function downloadFromUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: Status code ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

export async function onStart({ response, args, usages }) {
  if (!args[0]) return await usages();

  const action = args[0].toLowerCase();
  const commandsDir = __dirname;

  switch (action) {
    case 'install': {
      if (args.length !== 3) {
        return await response.reply("Provide exactly: install <url> <command file name>");
      }

      const url = args[1];
      if (!url.match(/^https?:\/\//)) {
        return await response.reply("Invalid URL provided.");
      }
      const commandName = args[2];
      let destination, content;

      try {
        content = await downloadFromUrl(url);
      } catch (error) {
        return await response.reply(`Error downloading from URL: ${error.message}`);
      }

      destination = path.join(commandsDir, `${commandName}.js`);

      if (await fs.pathExists(destination)) {
        return await response.reply(`Command already exists: ${commandName}.js`);
      }

      try {
        await fs.writeFile(destination, content, 'utf8');

        // Import to validate
        const moduleUrl = `file://${destination}?t=${Date.now()}`;
        const commandModule = await import(moduleUrl);

        if (!commandModule.meta || !commandModule.onStart) {
          await fs.remove(destination);
          return await response.reply("The command is invalid (missing meta or onStart).");
        }

        if (commandModule.meta.name !== commandName) {
          await fs.remove(destination);
          return await response.reply(`Mismatch: Meta.name is "${commandModule.meta.name}", but provided name is "${commandName}".`);
        }

        // Unload if somehow already in cache
        unloadCommand(commandName);

        global.chaldea.commands.set(commandName, commandModule);
        return await response.reply(`Command installed successfully: ${commandName}.js`);
      } catch (error) {
        if (await fs.pathExists(destination)) {
          await fs.remove(destination);
        }
        console.error("Error installing command:", error);
        let errorMessage = `Error installing command: ${error.message}`;
        if (error instanceof SyntaxError) {
          errorMessage += ". Make sure the code is valid JavaScript (not TypeScript; remove type annotations if present).";
        }
        return await response.reply(errorMessage);
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

        if (commandModule.meta.name !== commandName) {
          return await response.reply(`Mismatch: File suggests command name "${commandName}", but meta.name is "${commandModule.meta.name}".`);
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
          return await response.reply("Error: scripts is not properly defined.");
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