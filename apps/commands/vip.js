import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'vip',
  version: '1.0.4',
  description: 'Manage VIP users (list/add/remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 2,
  guide: [
    '- show this guide',
    'list - list VIPs',
    'add <uid> - add VIP (or reply)',
    'remove <uid> - remove VIP (or reply)'
  ]
};

const VIP_PATH = global.vipPath;
const SETTINGS_PATH = global.settingsPath;

const ensureDirectory = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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

const loadVipData = () => {
  try {
    if (!fs.existsSync(VIP_PATH)) {
      return createDefaultVipData();
    }
    const data = JSON.parse(fs.readFileSync(VIP_PATH, 'utf8') || '{}');
    if (!Array.isArray(data.uid)) data.uid = [];
    return data;
  } catch (error) {
    console.error('Error loading VIP data:', error.message);
    return createDefaultVipData();
  }
};

const createDefaultVipData = () => {
  ensureDirectory(VIP_PATH);
  const defaultData = { uid: [] };
  fs.writeFileSync(VIP_PATH, JSON.stringify(defaultData, null, 2));
  return defaultData;
};

const saveVipData = (vipData) => {
  const existing = fs.existsSync(VIP_PATH)
    ? JSON.parse(fs.readFileSync(VIP_PATH, 'utf8') || '{}')
    : {};
  existing.uid = Array.isArray(vipData.uid) ? vipData.uid : [];
  fs.writeFileSync(VIP_PATH, JSON.stringify(existing, null, 2));
};

const isVip = (vipData, userId) => {
  if (!vipData?.uid) return false;
  const normalizedId = normalizeId(userId);
  return vipData.uid.map(String).includes(normalizedId);
};

// ONLY read devID — no fallbacks
const loadDevelopers = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      console.warn('Settings file not found:', SETTINGS_PATH);
      return [];
    }
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8') || '{}');
    return Array.isArray(settings.devID) ? settings.devID.map(String) : [];
  } catch (error) {
    console.error('Error loading developers:', error.message);
    return [];
  }
};

const isDeveloper = (devArray, userId) => {
  if (!Array.isArray(devArray)) return false;
  const normalizedId = normalizeId(userId);
  return devArray.map(String).includes(normalizedId);
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

const buildVipList = async (bot, vipData) => {
  if (!vipData?.uid?.length) {
    return `👑 No VIPs set.\n\nVIP file: \`${VIP_PATH}\``;
  }
  const entries = await Promise.all(
    vipData.uid.map(async (id, index) => {
      const { name, id: uid } = await getUserDisplay(bot, id);
      const displayName = name || `\`${uid}\``;
      return `${index + 1}. ${displayName}`;
    })
  );
  return `👑 *VIP list:*\n\n${entries.join('\n')}`;
};

const handleList = async (bot, vipData, response) => {
  const list = await buildVipList(bot, vipData);
  return response.reply(list, { parse_mode: 'Markdown' });
};

const handleAddRemove = async (bot, msg, args, response, vipData, devs, action) => {
  if (!Array.isArray(devs)) {
    return response.reply(`⚠️ Cannot verify developer: settings file missing/invalid at \`${SETTINGS_PATH}\`.`, { parse_mode: 'Markdown' });
  }

  const requesterId = msg.from?.id ?? msg.from?.user_id;
  if (!isDeveloper(devs, requesterId)) {
    return response.reply('⚠️ Only developers can use this command.', { parse_mode: 'Markdown' });
  }

  const targetId = normalizeId(msg.reply_to_message?.from?.id ?? args[1]);
  if (!targetId) {
    return response.reply(`⚠️ Missing target. Use \`${action} <uid>\` or reply to a message.`, { parse_mode: 'Markdown' });
  }

  const isCurrentlyVip = isVip(vipData, targetId);
  const display = await getUserDisplay(bot, targetId, msg.reply_to_message?.from);
  const userLabel = display.name ? `${display.name} (\`${display.id}\`)` : `\`${display.id}\``;

  if (action === 'add') {
    if (isCurrentlyVip) {
      return response.reply(`ℹ️ User ${userLabel} is already a VIP.`, { parse_mode: 'Markdown' });
    }
    vipData.uid = [...new Set([...(vipData.uid || []), targetId].map(String))];
  } else {
    if (!isCurrentlyVip) {
      return response.reply(`ℹ️ User ${userLabel} is not a VIP.`, { parse_mode: 'Markdown' });
    }
    vipData.uid = (vipData.uid || []).filter(id => String(id) !== targetId);
  }

  try {
    saveVipData(vipData);
    const actionText = action === 'add' ? 'Added' : 'Removed';
    return response.reply(`✅ ${actionText} VIP: ${userLabel}.`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error saving VIP data:', error);
    return response.reply(`⚠️ Failed to save VIP file: ${error.message}`, { parse_mode: 'Markdown' });
  }
};

export async function onStart({ bot, msg, args, response, usages }) {
  const vipData = loadVipData();
  const devs = loadDevelopers();

  if (!args.length) {
    return usages();
  }

  const subcommand = args[0].toLowerCase();

  switch (subcommand) {
    case 'list':
      return handleList(bot, vipData, response);

    case 'add':
    case 'remove':
      return handleAddRemove(bot, msg, args, response, vipData, devs, subcommand);

    default:
      const defaultGuide = meta.guide.join('\n');
      return response.reply(defaultGuide || '⚠️ Invalid subcommand.', { parse_mode: 'Markdown' });
  }
}
