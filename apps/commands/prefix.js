import fs from 'fs-extra';

/**
 * prefix command
 * - no args: shows current prefix
 * - one arg (single special character): owner-only change (persisted to global.settingsPath)
 */

export const meta = {
  name: 'prefix',
  version: '1.0.1',
  aliases: [],
  description: 'Show or change the bot command prefix (owners only for changes).',
  author: 'You',
  prefix: 'both',
  category: 'System',
  type: 'anyone',
  cooldown: 2,
  guide: ['[<new_prefix>]']
};

export async function onStart({ bot, msg, args, response, usages }) {
  // helpers
  const parseSenderId = () => String(msg.from?.id ?? msg.sender?.id ?? '');
  const isOwner = (id) => (global.settings?.devID || []).map(String).includes(String(id));
  const isSpecialCharacter = (s) => typeof s === 'string' && s.length === 1 && !/^[A-Za-z0-9\s]$/.test(s);

  const send = (text, opts = {}) => response.reply(text, { parse_mode: 'Markdown', ...opts });

  // show current prefix
  if (!args.length) {
    const current = String(global.settings?.prefix ?? '.');
    return send(`🔧 Current prefix: \`${current}\``);
  }

  // attempt to set new prefix
  const newPrefix = args[0];

  // validation: must be single special character (non-alphanumeric, non-space)
  if (!isSpecialCharacter(newPrefix)) {
    return send(
      '⚠️ Invalid prefix. The prefix must be **exactly one special character** (not a letter, number, or space).\n\n' +
      'Example: `!`, `#`, `$`, `%`'
    );
  }

  // permission check
  const senderId = parseSenderId();
  if (!isOwner(senderId)) {
    return send('⛔ Only the configured bot developers can change the prefix.');
  }

  // no-op check
  const oldPrefix = String(global.settings?.prefix ?? '.');
  if (oldPrefix === newPrefix) {
    return send(`ℹ️ The prefix is already set to \`${newPrefix}\`.`);
  }

  // persist change (atomic-ish, safe)
  try {
    // ensure settings object exists
    const currentSettings = { ...(global.settings || {}) };

    // update in-memory immediately so runtime reflects change
    currentSettings.prefix = newPrefix;
    global.settings = currentSettings;

    // ensure the file exists and write asynchronously
    await fs.ensureFile(global.settingsPath);
    await fs.writeFile(global.settingsPath, JSON.stringify(currentSettings, null, 2), 'utf8');

    return send(`✅ Prefix updated successfully: \`${oldPrefix}\` ➡️ \`${newPrefix}\``);
  } catch (err) {
    // rollback in-memory on failure
    try { global.settings.prefix = oldPrefix; } catch (e) { /* ignore */ }

    // return helpful error
    return send(`⚠️ Failed to save new prefix.\nError: \`${err.message}\``);
  }
}
