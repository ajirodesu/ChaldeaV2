import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'owner',
  version: '1.0.3',
  description: 'Manage bot owners (list/add/remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'owner',
  type: 'anyone',
  cooldown: 2,
  guide: ['- show this guide', 'list - list owners', 'add <uid> - add owner (or reply)', 'remove <uid> - remove owner (or reply)']
};

const SETTINGS_PATH = path.resolve(process.cwd(), 'setup', 'settings.json');

const ensureDir = () => fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });

const loadSettings = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      ensureDir();
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ owner: [] }, null, 2));
      return { owner: [] };
    }
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH));
    settings.owner = Array.isArray(settings.owner) ? settings.owner : [];
    return settings;
  } catch {
    ensureDir();
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ owner: [] }, null, 2));
    return { owner: [] };
  }
};

const saveSettings = (settings) => {
  try {
    const existing = fs.existsSync(SETTINGS_PATH) ? JSON.parse(fs.readFileSync(SETTINGS_PATH)) : {};
    existing.owner = Array.isArray(settings.owner) ? settings.owner : [];
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(existing, null, 2));
  } catch (err) {
    throw err;
  }
};

const normalizeId = (id) => id ? String(id).match(/-?\d+/)?.[0] ?? null : null;

const isOwner = (settings, userId) => settings?.owner?.map(String).includes(normalizeId(userId)) ?? false;

const buildName = (user) => {
  if (!user) return null;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || (user.username ? `@${user.username}` : null);
  return name && user.username && !name.includes(user.username) ? `${name} (@${user.username})` : name;
};

const getDisplayForId = async (bot, userId, userObj) => {
  const uid = normalizeId(userId);
  if (!uid) return { name: null, id: null };
  if (userObj) {
    const name = buildName(userObj);
    if (name) return { name, id: uid };
  }
  try {
    const chat = await bot.getChat(uid);
    return { name: buildName(chat) || null, id: uid };
  } catch {
    return { name: null, id: uid };
  }
};

const buildOwnerList = async (bot, settings) => {
  if (!settings?.owner?.length) return `👑 No owners set.\n\nSettings: \`${SETTINGS_PATH}\``;
  const lines = await Promise.all(settings.owner.map(async (id, i) => {
    const { name, id: uid } = await getDisplayForId(bot, id);
    return `${i + 1}. ${name || `\`${uid}\``}`;
  }));
  return `👑 *Owner list:*\n\n${lines.join('\n')}`;
};

export async function onStart({ bot, msg, args, response, usages }) {
  const settings = loadSettings();
  if (!args.length) return response.reply(typeof usages === 'function' ? await usages() : meta.guide.join('\n'), { parse_mode: 'Markdown' });

  const sub = args[0].toLowerCase();
  if (sub === 'list') return response.reply(await buildOwnerList(bot, settings), { parse_mode: 'Markdown' });

  if (sub === 'add' || sub === 'remove') {
    if (!isOwner(settings, msg.from?.id ?? msg.from?.user_id)) {
      return response.reply('⚠️ Only owners can use this command.', { parse_mode: 'Markdown' });
    }

    const targetId = normalizeId(msg.reply_to_message?.from?.id ?? args[1]);
    if (!targetId) return response.reply(`⚠️ Missing target. Use \`${sub} <uid>\` or reply to a message.`, { parse_mode: 'Markdown' });

    const alreadyOwner = isOwner(settings, targetId);
    const disp = await getDisplayForId(bot, targetId, msg.reply_to_message?.from);
    const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;

    if (sub === 'add') {
      if (alreadyOwner) return response.reply(`ℹ️ User ${who} is already an owner.`, { parse_mode: 'Markdown' });
      settings.owner = [...new Set([...settings.owner, targetId].map(String))];
    } else {
      if (!alreadyOwner) return response.reply(`ℹ️ User ${who} is not an owner.`, { parse_mode: 'Markdown' });
      settings.owner = settings.owner.filter(id => String(id) !== targetId);
    }

    try {
      saveSettings(settings);
      return response.reply(`✅ ${sub === 'add' ? 'Added' : 'Removed'} owner: ${who}.`, { parse_mode: 'Markdown' });
    } catch (err) {
      return response.reply(`⚠️ Failed to save settings: ${err.message}`, { parse_mode: 'Markdown' });
    }
  }

  return response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
}