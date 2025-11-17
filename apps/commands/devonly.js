import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const meta = {
  name: 'devonly',
  version: '1.0.0',
  aliases: ['maintenance', 'maintenancemode'],
  description: 'Toggle maintenance mode (owner only access)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'dev',
  type: 'dev',
  cooldown: 0,
  guide: ['- Toggle maintenance mode', 'on - Enable maintenance mode', 'off - Disable maintenance mode']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const settingsPath = global.settingsPath;

  try {
    // Read current settings
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);

    // If no args, show current status
    if (!args.length) {
      const status = settings.ownerOnly ? '🔒 *ENABLED*' : '🔓 *DISABLED*';
      return response.reply(
        `⚙️ *Maintenance Mode Status*\n\n${status}\n\n` +
        `Use \`${global.settings.prefix}${meta.name} on\` to enable\n` +
        `Use \`${global.settings.prefix}${meta.name} off\` to disable`,
        { parse_mode: 'Markdown' }
      );
    }

    const action = args[0].toLowerCase();

    if (action === 'on' || action === 'enable') {
      if (settings.ownerOnly) {
        return response.reply('⚠️ Maintenance mode is already *enabled*.', { parse_mode: 'Markdown' });
      }

      settings.ownerOnly = true;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      global.settings.ownerOnly = true;

      return response.reply(
        '🔒 *Maintenance Mode Enabled*\n\n' +
        'Only bot owners can now use commands.',
        { parse_mode: 'Markdown' }
      );

    } else if (action === 'off' || action === 'disable') {
      if (!settings.ownerOnly) {
        return response.reply('⚠️ Maintenance mode is already *disabled*.', { parse_mode: 'Markdown' });
      }

      settings.ownerOnly = false;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      global.settings.ownerOnly = false;

      return response.reply(
        '🔓 *Maintenance Mode Disabled*\n\n' +
        'All users can now use commands again.',
        { parse_mode: 'Markdown' }
      );

    } else {
      return usages();
    }

  } catch (err) {
    return response.reply(`⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}