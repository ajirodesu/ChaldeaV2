import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'vip',
  version: '1.0.2',
  description: 'Manage VIP users (list/add/remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 2,
  guide: ['- show this guide', 'list - list VIPs', 'add <uid> - add VIP (or reply)', 'remove <uid> - remove VIP (or reply)']
};

const VIP_PATH = path.resolve(process.cwd(), 'setup', 'vip.json');
const SETTINGS_PATH = path.resolve(process.cwd(), 'setup', 'settings.json');

const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const loadVip = () => {
  try {
    if (!fs.existsSync(VIP_PATH)) {
      ensureDir(VIP_PATH);
      fs.writeFileSync(VIP_PATH, JSON.stringify({ uid: [] }, null, 2));
      return { uid: [] };
    }
    const vipObj = JSON.parse(fs.readFileSync(VIP_PATH));
    vipObj.uid = Array.isArray(vipObj.uid) ? vipObj.uid : [];
    return vipObj;
  } catch {
    ensureDir(VIP_PATH);
    fs.writeFileSync(VIP_PATH, JSON.stringify({ uid: [] }, null, 2));
    return { uid: [] };
  }
};

const saveVip = (vipObj) => {
  try {
    const existing = fs.existsSync(VIP_PATH) ? JSON.parse(fs.readFileSync(VIP_PATH)) : {};
    existing.uid = Array.isArray(vipObj.uid) ? vipObj.uid : [];
    fs.writeFileSync(VIP_PATH, JSON.stringify(existing, null, 2));
  } catch (err) {
    throw err;
  }
};

const loadOwners = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return null;
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH));
    return Array.isArray(settings.owner) ? settings.owner.map(String) : [];
  } catch {
    return null;
  }
};

const normalizeId = (id) => id ? String(id).match(/-?\d+/)?.[0] ?? null : null;

const isOwner = (ownerArray, userId) => Array.isArray(ownerArray) && ownerArray.map(String).includes(normalizeId(userId));

const buildName = (user) => {
  if (!user) return null;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || (user.username ? `@${user.username}` : null);
  return name && user.username && !name.includes(user.username) ? `${name} (@${user.username})` : name;
};

const getDisplayForId = async (bot, id, userObj) => {
  const uid = normalizeId(id);
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

const buildVipList = async (bot, vipObj) => {
  if (!vipObj?.uid?.length) return `👑 No VIPs set.\n\nVIP file: \`${VIP_PATH}\``;
  const lines = await Promise.all(vipObj.uid.map(async (id, i) => {
    const { name, id: uid } = await getDisplayForId(bot, id);
    return `${i + 1}. ${name || `\`${uid}\``}`;
  }));
  return `👑 *VIP list:*\n\n${lines.join('\n')}`;
};

export async function onStart({ bot, msg, args, response, usages }) {
  const vipData = loadVip();
  const owners = loadOwners();
  if (!args.length) return response.reply(typeof usages === 'function' ? await usages() : meta.guide.join('\n'), { parse_mode: 'Markdown' });

  const sub = args[0].toLowerCase();
  if (sub === 'list') return response.reply(await buildVipList(bot, vipData), { parse_mode: 'Markdown' });

  if (sub === 'add' || sub === 'remove') {
    if (!Array.isArray(owners)) return response.reply(`⚠️ Cannot verify owner: settings file missing/invalid at \`${SETTINGS_PATH}\`.`, { parse_mode: 'Markdown' });
    if (!isOwner(owners, msg.from?.id ?? msg.from?.user_id)) return response.reply('⚠️ Only owners can use this command.', { parse_mode: 'Markdown' });

    const targetId = normalizeId(msg.reply_to_message?.from?.id ?? args[1]);
    if (!targetId) return response.reply(`⚠️ Missing target. Use \`${sub} <uid>\` or reply to a message.`, { parse_mode: 'Markdown' });

    const isVip = vipData.uid.map(String).includes(String(targetId));
    const disp = await getDisplayForId(bot, targetId, msg.reply_to_message?.from);
    const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;

    if (sub === 'add') {
      if (isVip) return response.reply(`ℹ️ User ${who} is already a VIP.`, { parse_mode: 'Markdown' });
      vipData.uid = [...new Set([...vipData.uid, targetId].map(String))];
    } else {
      if (!isVip) return response.reply(`ℹ️ User ${who} is not a VIP.`, { parse_mode: 'Markdown' });
      vipData.uid = vipData.uid.filter(id => String(id) !== targetId);
    }

    try {
      saveVip(vipData);
      return response.reply(`✅ ${sub === 'add' ? 'Added' : 'Removed'} VIP: ${who}.`, { parse_mode: 'Markdown' });
    } catch (err) {
      return response.reply(`⚠️ Failed to save VIP file: ${err.message}`, { parse_mode: 'Markdown' });
    }
  }

  return response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
}