import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'owner',
  version: '1.0.4',
  description: 'Manage bot owners (list/add/remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'owner',
  type: 'anyone',
  cooldown: 2,
  guide: [
    '- show this guide',
    'list - list owners',
    'add <uid> - add owner (or reply)',
    'remove <uid> - remove owner (or reply)'
  ]
};

// Constants
const SETTINGS_PATH = global.settingsPath;

// Utility Functions
const ensureDirectory = () => {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
};

const normalizeId = (id) => {
  return id ? String(id).match(/-?\d+/)?.[0] ?? null : null;
};

const buildUserName = (user) => {
  if (!user) return null;

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  const name = fullName || (user.username ? `@${user.username}` : null);

  return name && user.username && !name.includes(user.username)
    ? `${name} (@${user.username})`
    : name;
};

// Settings Management
const loadSettings = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      ensureDirectory();
      const defaultSettings = { owner: [] };
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    settings.owner = Array.isArray(settings.owner) ? settings.owner : [];
    return settings;
  } catch (error) {
    ensureDirectory();
    const defaultSettings = { owner: [] };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
};

const saveSettings = (settings) => {
  const existing = fs.existsSync(SETTINGS_PATH)
    ? JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
    : {};

  existing.owner = Array.isArray(settings.owner) ? settings.owner : [];
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(existing, null, 2));
};

const isOwner = (settings, userId) => {
  return settings?.owner?.map(String).includes(normalizeId(userId)) ?? false;
};

// User Display Functions
const getUserDisplay = async (bot, userId, userObj = null) => {
  const uid = normalizeId(userId);
  if (!uid) return { name: null, id: null };

  if (userObj) {
    const name = buildUserName(userObj);
    if (name) return { name, id: uid };
  }

  try {
    const chat = await bot.getChat(uid);
    return { name: buildUserName(chat) || null, id: uid };
  } catch {
    return { name: null, id: uid };
  }
};

const buildOwnerList = async (bot, settings) => {
  if (!settings?.owner?.length) {
    return `👑 No owners set.\n\nSettings: \`${SETTINGS_PATH}\``;
  }

  const entries = await Promise.all(
    settings.owner.map(async (id, index) => {
      const { name, id: uid } = await getUserDisplay(bot, id);
      return `${index + 1}. ${name || `\`${uid}\``}`;
    })
  );

  return `👑 *Owner list:*\n\n${entries.join('\n')}`;
};

// Command Handlers
const handleList = async (bot, settings, response) => {
  const list = await buildOwnerList(bot, settings);
  return response.reply(list, { parse_mode: 'Markdown' });
};

const handleAddRemove = async (bot, msg, args, response, settings, action) => {
  // Verify owner permissions
  if (!isOwner(settings, msg.from?.id ?? msg.from?.user_id)) {
    return response.reply(
      '⚠️ Only owners can use this command.',
      { parse_mode: 'Markdown' }
    );
  }

  // Get target user ID
  const targetId = normalizeId(msg.reply_to_message?.from?.id ?? args[1]);
  if (!targetId) {
    return response.reply(
      `⚠️ Missing target. Use \`${action} <uid>\` or reply to a message.`,
      { parse_mode: 'Markdown' }
    );
  }

  // Check current owner status
  const isCurrentlyOwner = isOwner(settings, targetId);
  const display = await getUserDisplay(bot, targetId, msg.reply_to_message?.from);
  const userLabel = display.name 
    ? `${display.name} (\`${display.id}\`)` 
    : `\`${display.id}\``;

  // Handle add/remove logic
  if (action === 'add') {
    if (isCurrentlyOwner) {
      return response.reply(
        `ℹ️ User ${userLabel} is already an owner.`,
        { parse_mode: 'Markdown' }
      );
    }
    settings.owner = [...new Set([...settings.owner, targetId].map(String))];
  } else {
    if (!isCurrentlyOwner) {
      return response.reply(
        `ℹ️ User ${userLabel} is not an owner.`,
        { parse_mode: 'Markdown' }
      );
    }
    settings.owner = settings.owner.filter(id => String(id) !== targetId);
  }

  // Save changes
  try {
    saveSettings(settings);
    return response.reply(
      `✅ ${action === 'add' ? 'Added' : 'Removed'} owner: ${userLabel}.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    return response.reply(
      `⚠️ Failed to save settings: ${error.message}`,
      { parse_mode: 'Markdown' }
    );
  }
};

// Main Command Handler
export async function onStart({ bot, msg, args, response, usages }) {
  const settings = loadSettings();

  // Show usage guide if no arguments
  if (!args.length) {
    const guide = typeof usages === 'function' ? await usages() : meta.guide.join('\n');
    return response.reply(guide, { parse_mode: 'Markdown' });
  }

  const subcommand = args[0].toLowerCase();

  // Route to appropriate handler
  switch (subcommand) {
    case 'list':
      return handleList(bot, settings, response);

    case 'add':
    case 'remove':
      return handleAddRemove(bot, msg, args, response, settings, subcommand);

    default:
      return response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
  }
}