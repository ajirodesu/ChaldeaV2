import TelegramBot from 'node-telegram-bot-api';
import { listen } from '../listen.js';

/**
 * Initializes Telegram bots based on tokens defined in setup/states.json,
 * and DMs the configured developers (global.settings.devID) upon successful startup.
 *
 * @returns {TelegramBot[]} Array of initialized TelegramBot instances
 */
export const login = (log) => {
  const { timeZone = 'UTC' } = global.settings;

  // Only use global.settings.devID (no fallbacks). Normalize to string IDs.
  const devIds = Array.isArray(global.settings.devID) ? global.settings.devID.map(String) : [];
  global.settings.devID = devIds;

  const startTime = new Date().toLocaleString('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const tokens = global.states.tokens;
  if (!Array.isArray(tokens) || !tokens.length) {
    process.exit(1);
  }

  const bots = tokens.map((token, index) => {
    const bot = new TelegramBot(token, { polling: true });
    bot.index = index;
    bot.totalBots = tokens.length;
    return bot;
  });

  bots.forEach(bot => listen(bot, log));

  if (devIds.length) {
    const dmText =
      `*🤖  Chaldea Telegram Bot Startup Complete*\n` +
      `• *Instances:* ${bots.length}\n` +
      `• *Time:* ${startTime} (${timeZone})\n` +
      `• *Status:* All systems operational ✅`;

    const notifier = bots[0];
    devIds.forEach(devId => {
      notifier.sendMessage(devId, dmText, { parse_mode: 'Markdown' })
        .catch(() => { /* silently ignore DM failures */ });
    });
  }

  return bots;
};
