import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'dev',
  version: '1.0.5',
  description: 'Manage bot developers (list/add/remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'dev',
  type: 'anyone',
  cooldown: 2,
  guide: [
    '- show this guide',
    'list - list developers',
    'add <uid> - add developer (or reply)',
    'remove <uid> - remove developer (or reply)'
  ]
};

const SETTINGS_PATH = global.settingsPath;

const ensureDirectory = () => {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
};

const normalizeId = (id) => {
  if (id === undefined || id === null) return null;
  const match = String(id).match(/-?\d+/);
  return match ? match[0] : null;
};

const buildUserName = (user) => {
  if (!user) return null;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  const baseName = fullName || (user.username ? `@${user.username}` : null);
  if (!baseName) return null;
  return user.username && !baseName.includes(user.username)
    ? `${baseName} (@${user.username})`
    : baseName;
};

const loadSettings = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return createDefaultSettings();
    }
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8') || '{}');
    if (!Array.isArray(settings.devID)) settings.devID = [];
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error?.message ?? error);
    return createDefaultSettings();
  }
};

const createDefaultSettings = () => {
  ensureDirectory();
  const defaultSettings = { devID: [] };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2));
  return defaultSettings;
};

const saveSettings = (settings) => {
  const existing = fs.existsSync(SETTINGS_PATH)
    ? JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8') || '{}')
    : {};
  existing.devID = Array.isArray(settings.devID) ? settings.devID.map(String) : [];
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(existing, null, 2));
};

const isDev = (settings, userId) => {
  if (!settings?.devID) return false;
  const normalizedId = normalizeId(userId);
  return settings.devID.map(String).includes(normalizedId);
};

const getUserDisplay = async (bot, userId, userObj = null) => {
  const uid = normalizeId(userId);
  if (!uid) return { name: null, id: null };
  if (userObj) {
    const name = buildUserName(userObj);
    if (name) return { name, id: uid };
  }
  try {
    const chat = await bot.getChat(uid);
    const name = buildUserName(chat);
    return { name, id: uid };
  } catch (error) {
    return { name: null, id: uid };
  }
};

const buildDevList = async (bot, settings) => {
  if (!settings?.devID?.length) {
    return `👑 No developers set.\n\nSettings: \`${SETTINGS_PATH}\``;
  }

  const entries = await Promise.all(
    settings.devID.map(async (id, index) => {
      const { name, id: uid } = await getUserDisplay(bot, id);
      const displayName = name || `\`${uid}\``;
      return `${index + 1}. ${displayName}`;
    })
  );

  return `👑 *Developer list:*\n\n${entries.join('\n')}`;
};

const handleList = async (bot, settings, response) => {
  const list = await buildDevList(bot, settings);
  return response.reply(list, { parse_mode: 'Markdown' });
};

const handleAddRemove = async (bot, msg, args, response, settings, action) => {
  const requesterId = msg.from?.id ?? msg.from?.user_id;
  if (!isDev(settings, requesterId)) {
    return response.reply('⚠️ Only developers can use this command.', { parse_mode: 'Markdown' });
  }

  const targetId = normalizeId(msg.reply_to_message?.from?.id ?? args[1]);
  if (!targetId) {
    return response.reply(`⚠️ Missing target. Use \`${action} <uid>\` or reply to a message.`, { parse_mode: 'Markdown' });
  }

  const isCurrentlyDev = isDev(settings, targetId);
  const display = await getUserDisplay(bot, targetId, msg.reply_to_message?.from);
  const userLabel = display.name ? `${display.name} (\`${display.id}\`)` : `\`${display.id}\``;

  if (action === 'add') {
    if (isCurrentlyDev) {
      return response.reply(`ℹ️ User ${userLabel} is already a developer.`, { parse_mode: 'Markdown' });
    }
    settings.devID = [...new Set([...(settings.devID || []), targetId].map(String))];
  } else {
    if (!isCurrentlyDev) {
      return response.reply(`ℹ️ User ${userLabel} is not a developer.`, { parse_mode: 'Markdown' });
    }
    settings.devID = (settings.devID || []).filter(id => String(id) !== targetId);
  }

  try {
    saveSettings(settings);
    const actionText = action === 'add' ? 'Added' : 'Removed';
    return response.reply(`✅ ${actionText} developer: ${userLabel}.`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return response.reply(`⚠️ Failed to save settings: ${error?.message ?? error}`, { parse_mode: 'Markdown' });
  }
};

export async function onStart({ bot, msg, args, response, usages }) {
  const settings = loadSettings();

  if (!args.length) {
    return usages();
  }

  const subcommand = args[0].toLowerCase();

  switch (subcommand) {
    case 'list':
      return handleList(bot, settings, response);

    case 'add':
    case 'remove':
      return handleAddRemove(bot, msg, args, response, settings, subcommand);

    default:
      const defaultGuide = meta.guide.join('\n');
      return response.reply(defaultGuide || '⚠️ Invalid subcommand.', { parse_mode: 'Markdown' });
  }
}
