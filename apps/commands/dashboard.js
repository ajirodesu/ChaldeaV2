import { v4 as uuidv4 } from 'uuid';

export const meta = {
  name: 'dashboard',
  version: '1.0.0',
  aliases: [],
  description: 'Generate a one-time key to access the bot dashboard',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Utility',
  type: 'dev',  // Restrict to owners if needed
  cooldown: 5,
  guide: ['Generate dashboard access key']
};

export async function onStart({ bot, msg, args, response, usages }) {

  const key = uuidv4().replace(/-/g, '');  // Generate unique key without dashes
  global.chaldea.keys.add(key);

  // Format the key as inline-code in Markdown so it appears monospace when sent to users
  const message = `🔑 *Dashboard Access Key Generated:*\n\n\`${key}\`\n\n_Enter this key on the website to access the dashboard. This is a one-time key._`;

  return response.reply(message, { parse_mode: 'Markdown' });
}
