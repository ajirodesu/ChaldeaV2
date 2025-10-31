// mute.js
export const meta = {
  name: 'mute',
  version: '1.0.1',
  aliases: [],
  description: 'Temporarily mute a user from sending messages (reply to a user). Falls back to delete-enforcement in legacy groups.',
  author: 'JohnDev19',
  prefix: 'both',
  category: 'group',
  type: 'administrator',
  cooldown: 2,
  guide: [
    'Reply to a user with <minutes>',
    '10'
  ]
};

function safe(v) {
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

/**
 * Main command handler
 */
export async function onStart({ bot, msg, args, response, usages }) {
  // Must be used as a reply to a user's message
  if (!msg.reply_to_message || !msg.reply_to_message.from) {
    return usages();
  }

  const durationMin = Number(args?.[0]);
  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    return response.reply('❌ Invalid duration. Provide the number of minutes (positive integer). Example: mute 10');
  }

  const targetUser = msg.reply_to_message.from;
  const targetUserId = targetUser.id;
  const chatId = msg.chat.id;
  const chatType = msg.chat.type; // 'group' | 'supergroup' | 'private' etc.

  const loading = await response.reply(
    `🔇 Muting @${safe(targetUser.username || targetUser.first_name)} for ${durationMin} minute(s)...`,
    { parse_mode: 'HTML' }
  );

  // compute until_date (unix seconds)
  const until = Math.floor(Date.now() / 1000) + durationMin * 60;

  // ensure global store exists
  global.mutedUsers = global.mutedUsers || {};
  global.mutedUsers[targetUserId] = { chatId, until };

  // If this is a legacy "group", we cannot call restrictChatMember reliably.
  // Fall back to deletion-enforcement: setupMuteHandler will delete messages from muted users.
  if (chatType === 'group') {
    // Inform moderator about fallback and required bot permission
    await response.editText(
      loading,
      `<b>✅ Mute applied (fallback mode)</b>\n\nUser: @${safe(targetUser.username || targetUser.first_name)}\nDuration: ${durationMin} minute(s)\nMethod: delete-enforcement (legacy group)\n\nNote: This group is a legacy 'group'. Telegram only allows muting via API in supergroups. Your bot will delete messages from the muted user until the mute expires. Make sure the bot has permission to delete messages in this chat.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // For supergroups, try to perform a real restriction via restrictChatMember.
  try {
    await bot.restrictChatMember(chatId, targetUserId, {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_polls: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      until_date: until
    });

    // Successful supergroup mute
    try {
      const userPhotos = await bot.getUserProfilePhotos(targetUserId).catch(() => null);
      if (userPhotos && userPhotos.total_count && userPhotos.photos && userPhotos.photos.length) {
        const fileId = userPhotos.photos[0][userPhotos.photos[0].length - 1].file_id;
        await response.photo(fileId, {
          caption: `<b>✅ User Muted Successfully!</b>\n\nMuted User: @${safe(targetUser.username || targetUser.first_name)}\nDuration: ${durationMin} minute(s)\nMuted by: @${safe(msg.from.username || msg.from.first_name)}`,
          parse_mode: 'HTML',
          noReply: true
        });
      } else {
        await response.send(
          `<b>✅ User Muted Successfully!</b>\n\nMuted User: @${safe(targetUser.username || targetUser.first_name)}\nDuration: ${durationMin} minute(s)\nMuted by: @${safe(msg.from.username || msg.from.first_name)}`,
          { parse_mode: 'HTML', noReply: true }
        );
      }
    } catch (sendErr) {
      console.warn('mute: failed to send photo, sending text instead:', sendErr && sendErr.message ? sendErr.message : sendErr);
      await response.send(
        `<b>✅ User Muted Successfully!</b>\n\nMuted User: @${safe(targetUser.username || targetUser.first_name)}\nDuration: ${durationMin} minute(s)\nMuted by: @${safe(msg.from.username || msg.from.first_name)}`,
        { parse_mode: 'HTML', noReply: true }
      );
    }

    try { await response.delete(loading); } catch (e) { /* ignore */ }
    return;
  } catch (err) {
    // If restrictChatMember fails (maybe permissions or API), fallback to delete-enforcement.
    console.warn('restrictChatMember failed — falling back to deletion enforcement:', err && (err.message || err));
    await response.editText(
      loading,
      `<b>⚠️ Couldn't apply an official mute (supergroup API failed).</b>\n\nFalling back to delete-enforcement for @${safe(targetUser.username || targetUser.first_name)} for ${durationMin} minute(s).\n\nMake sure the bot has permission to delete messages in this chat.`,
      { parse_mode: 'HTML' }
    );
    return;
  }
}

/* ---------- setupMuteHandler(bot) ---------- */
/**
 * Call this once during bot startup to enforce deletion-based mutes for legacy groups
 * or when restrictChatMember is not possible. It will:
 *  - Delete messages from muted users (when mute is active)
 *  - Notify the chat about remaining time (best-effort)
 */
let _muteHandlerRegistered = false;
export function setupMuteHandler(bot) {
  if (_muteHandlerRegistered) return;
  _muteHandlerRegistered = true;

  bot.on('message', async (msg) => {
    try {
      if (!msg || !msg.from) return;
      global.mutedUsers = global.mutedUsers || {};
      const muteInfo = global.mutedUsers[msg.from.id];
      if (!muteInfo) return;

      const now = Math.floor(Date.now() / 1000);

      // If mute is expired -> cleanup
      if (muteInfo.until <= now) {
        delete global.mutedUsers[msg.from.id];
        return;
      }

      // Only apply enforcement in the same chat
      if (muteInfo.chatId !== msg.chat.id) return;

      // Attempt to delete the user's message
      try {
        await bot.deleteMessage(msg.chat.id, msg.message_id);
      } catch (delErr) {
        // ignore deletion errors (lack of rights etc.)
      }

      // Notify the chat (best-effort)
      const remaining = Math.ceil((muteInfo.until - now) / 60);
      try {
        await bot.sendMessage(msg.chat.id,
          `<b>🔇 You are currently muted!</b>\n\nRemaining mute time: ${remaining} minute(s)\nYou cannot send messages during this period.`,
          { parse_mode: 'HTML', reply_to_message_id: msg.message_id }
        );
      } catch (notifErr) {
        // ignore notify errors
      }
    } catch (e) {
      console.error('Error in setupMuteHandler message listener:', e && (e.message || e));
    }
  });
}
