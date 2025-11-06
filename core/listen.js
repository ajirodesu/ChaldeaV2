import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { R } from './system/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function listen(bot) {
  bot.on('message', async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const response = new R(bot, msg);

      // Sharding logic for multi-bot setup
      if (msg.chat.type !== 'private') {
        const assignedIndex = Math.abs(chatId) % bot.totalBots;
        if (bot.index !== assignedIndex) return;
      }

      // Check ownership and maintenance mode
      const isOwner = global.settings.owner?.includes(String(userId)) || false;
      const maintenanceMode = global.settings.ownerOnly === true;

      // Get prefix(es)
      const prefixes = Array.isArray(global.settings.prefix) 
        ? global.settings.prefix 
        : [global.settings.prefix || '/'];

      // Load and execute handlers
      const handlersPath = path.join(__dirname, 'handle');
      const files = fs.readdirSync(handlersPath).filter(f => f.endsWith('.js'));

      for (const file of files) {
        const fullPath = path.join(handlersPath, file);
        const handlerModule = await import(`file://${fullPath}?update=${Date.now()}`);
        const handlerName = path.basename(file, '.js');
        const handler = handlerModule[handlerName];

        if (typeof handler !== 'function') {
          console.warn(`Handler ${file} does not export a function named "${handlerName}".`);
          continue;
        }

        // Always run event handler (reactions, joins, leaves, etc.)
        if (handlerName === 'event') {
          await handler({ bot, msg, chatId, userId, response });
          continue;
        }

        // Handle command detection and maintenance mode
        if (handlerName === 'command') {
          const text = (msg.text || msg.caption || '').trim();
          if (!text) continue;

          const firstWord = text.split(' ')[0];

          // Maintenance mode: block non-owners from ALL commands
          if (maintenanceMode && !isOwner) {
            // Check if message starts with prefix (even without command name)
            const startsWithPrefix = prefixes.some(prefix => 
              prefix && text.toLowerCase().startsWith(prefix.toLowerCase())
            );

            // Check if it's a valid command
            const isCommand = checkIfCommand(firstWord, prefixes);

            // Show maintenance mode if:
            // 1. It's a valid command, OR
            // 2. Message starts with prefix (even if just "/")
            if (isCommand || startsWithPrefix) {
              await response.photo(
                'https://docs.madrasthemes.com/front/wp-content/uploads/sites/14/2019/11/info16-out-2.png',
                {
                  caption:
                    '🔧 *Maintenance Mode*\n\n' +
                    'The bot is currently under maintenance.\n' +
                    'Only bot owners can use commands at this time.\n\n' +
                    'Please try again later.',
                  parse_mode: 'Markdown'
                }
              );
              return; // Stop processing
            }
            continue; // Not a command, skip command handler
          }

          // Normal operation: run command handler
          await handler({ bot, msg, chatId, userId, response });
          return; // Stop after processing command
        }

        // Run other handlers
        await handler({ bot, msg, chatId, userId, response });
      }
    } catch (error) {
      console.error('Error in message handler:', error);
    }
  });
}

/**
 * Check if the first word is a valid command (with or without prefix)
 * @param {string} firstWord - First word of the message
 * @param {string[]} prefixes - Array of valid prefixes
 * @returns {boolean} - True if it's a valid command
 */
function checkIfCommand(firstWord, prefixes) {
  const { commands } = global.chaldea || {};
  if (!commands || commands.size === 0) return false;

  // Remove @BotUsername suffix if present
  const cleanWord = firstWord.split('@')[0].toLowerCase();

  // Check each registered command
  for (const [cmdName, cmdData] of commands) {
    const aliases = cmdData.meta?.aliases || [];
    const allNames = [cmdName.toLowerCase(), ...aliases.map(a => a.toLowerCase())];

    // Check without prefix (no-prefix commands)
    if (allNames.includes(cleanWord)) {
      return true;
    }

    // Check with each prefix
    for (const prefix of prefixes) {
      if (!prefix) continue;

      // Remove prefix from word
      if (cleanWord.startsWith(prefix.toLowerCase())) {
        const cmdPart = cleanWord.slice(prefix.length);
        if (allNames.includes(cmdPart)) {
          return true;
        }
      }
    }
  }

  return false;
}