import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'vip',
  version: '1.0.3',
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

// Constants
const VIP_PATH = global.vipPath;
const SETTINGS_PATH = global.settingsPath;

// Utility Functions
const ensureDirectory = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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

// VIP Data Management
const loadVipData = () => {
  try {
    if (!fs.existsSync(VIP_PATH)) {
      ensureDirectory(VIP_PATH);
      const defaultData = { uid: [] };
      fs.writeFileSync(VIP_PATH, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }

    const data = JSON.parse(fs.readFileSync(VIP_PATH, 'utf8'));
    data.uid = Array.isArray(data.uid) ? data.uid : [];
    return data;
  } catch (error) {
    ensureDirectory(VIP_PATH);
    const defaultData = { uid: [] };
    fs.writeFileSync(VIP_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
};

const saveVipData = (vipData) => {
  const existing = fs.existsSync(VIP_PATH)
    ? JSON.parse(fs.readFileSync(VIP_PATH, 'utf8'))
    : {};

  existing.uid = Array.isArray(vipData.uid) ? vipData.uid : [];
  fs.writeFileSync(VIP_PATH, JSON.stringify(existing, null, 2));
};

// Owner Management
const loadOwners = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return null;

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    return Array.isArray(settings.owner) ? settings.owner.map(String) : [];
  } catch {
    return null;
  }
};

const isOwner = (ownerArray, userId) => {
  return Array.isArray(ownerArray) && 
         ownerArray.map(String).includes(normalizeId(userId));
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

const buildVipList = async (bot, vipData) => {
  if (!vipData?.uid?.length) {
    return `👑 No VIPs set.\n\nVIP file: \`${VIP_PATH}\``;
  }

  const entries = await Promise.all(
    vipData.uid.map(async (id, index) => {
      const { name, id: uid } = await getUserDisplay(bot, id);
      return `${index + 1}. ${name || `\`${uid}\``}`;
    })
  );

  return `👑 *VIP list:*\n\n${entries.join('\n')}`;
};

// Command Handlers
const handleList = async (bot, vipData, response) => {
  const list = await buildVipList(bot, vipData);
  return response.reply(list, { parse_mode: 'Markdown' });
};

const handleAddRemove = async (bot, msg, args, response, vipData, owners, action) => {
  // Verify owner permissions
  if (!Array.isArray(owners)) {
    return response.reply(
      `⚠️ Cannot verify owner: settings file missing/invalid at \`${SETTINGS_PATH}\`.`,
      { parse_mode: 'Markdown' }
    );
  }

  if (!isOwner(owners, msg.from?.id ?? msg.from?.user_id)) {
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

  // Check current VIP status
  const isCurrentlyVip = vipData.uid.map(String).includes(String(targetId));
  const display = await getUserDisplay(bot, targetId, msg.reply_to_message?.from);
  const userLabel = display.name 
    ? `${display.name} (\`${display.id}\`)` 
    : `\`${display.id}\``;

  // Handle add/remove logic
  if (action === 'add') {
    if (isCurrentlyVip) {
      return response.reply(
        `ℹ️ User ${userLabel} is already a VIP.`,
        { parse_mode: 'Markdown' }
      );
    }
    vipData.uid = [...new Set([...vipData.uid, targetId].map(String))];
  } else {
    if (!isCurrentlyVip) {
      return response.reply(
        `ℹ️ User ${userLabel} is not a VIP.`,
        { parse_mode: 'Markdown' }
      );
    }
    vipData.uid = vipData.uid.filter(id => String(id) !== targetId);
  }

  // Save changes
  try {
    saveVipData(vipData);
    return response.reply(
      `✅ ${action === 'add' ? 'Added' : 'Removed'} VIP: ${userLabel}.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    return response.reply(
      `⚠️ Failed to save VIP file: ${error.message}`,
      { parse_mode: 'Markdown' }
    );
  }
};

// Main Command Handler
export async function onStart({ bot, msg, args, response, usages }) {
  const vipData = loadVipData();
  const owners = loadOwners();

  // Show usage guide if no arguments
  if (!args.length) {
    const guide = typeof usages === 'function' ? await usages() : meta.guide.join('\n');
    return response.reply(guide, { parse_mode: 'Markdown' });
  }

  const subcommand = args[0].toLowerCase();

  // Route to appropriate handler
  switch (subcommand) {
    case 'list':
      return handleList(bot, vipData, response);

    case 'add':
    case 'remove':
      return handleAddRemove(bot, msg, args, response, vipData, owners, subcommand);

    default:
      return response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
  }
}