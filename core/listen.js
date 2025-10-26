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

      if (msg.chat.type !== 'private') {
        const assignedIndex = Math.abs(chatId) % bot.totalBots;
        if (bot.index !== assignedIndex) {
          return;
        }
      }

      const handlersPath = path.join(__dirname, 'handle');
      const files = fs.readdirSync(handlersPath);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const fullPath = path.join(handlersPath, file);
          const handlerModule = await import(`file://${fullPath}?update=${Date.now()}`);
          const handlerName = path.basename(file, '.js');
          const handler = handlerModule[handlerName];

          if (typeof handler === 'function') {
            await handler({ bot, msg, chatId, userId, response });
          } else {
            console.warn(`Handler ${file} does not export a function named "${handlerName}".`);
          }
        }
      }
    } catch (error) {
      console.error('Error in message handler:', error);
    }
  });
}
