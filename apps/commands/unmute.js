// unmute.js
export const meta = {
  name: 'unmute',
  version: '1.0.1',
  aliases: [],
  description: 'Remove mute restriction for a user (reply to the user). Works on supergroups (official) or falls back to delete-enforcement cleanup in legacy groups.',
  author: 'JohnDev19',
  prefix: 'both',
  category: 'group',
  type: 'administrator',
  cooldown: 2,
  guide: [
    'Reply to a user with: unmute',
    'Removes mute whether it was applied via API (supergroup) or fallback deletion enforcement.'
  ]
};

function safe(v) {
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

export async function onStart({ bot, msg, args, response, usages }) {
  if (!msg.reply_to_message || !msg.reply_to_message.from) {
    return usages();
  }

  const targetUser = msg.reply_to_message.from;
  const targetUserId = targetUser.id;
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;

  const loading = await response.reply(`🔊 Unmuting @${safe(targetUser.username || targetUser.first_name)}...`, { parse_mode: 'HTML' });

  // remove from global store if present (always do this)
  global.mutedUsers = global.mutedUsers || {};
  if (global.mutedUsers[targetUserId]) delete global.mutedUsers[targetUserId];

  // If it's a legacy group, we already removed the deletion-enforcement entry
  if (chatType === 'group') {
    await response.editText(
      loading,
      `<b>✅ Unmuted (fallback)</b>\n\nUser: @${safe(targetUser.username || targetUser.first_name)}\nMethod: deletion-enforcement removed (legacy group)\n\nNote: This group is a legacy 'group'. Official mute APIs are only available in supergroups.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // For supergroups, try to restore send permissions via restrictChatMember
  try {
    await bot.restrictChatMember(chatId, targetUserId, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true
    });

    // Try to display profile photo with caption; fallback to text
    try {
      const userPhotos = await bot.getUserProfilePhotos(targetUserId).catch(() => null);
      if (userPhotos && userPhotos.total_count && userPhotos.photos && userPhotos.photos.length) {
        const fileId = userPhotos.photos[0][userPhotos.photos[0].length - 1].file_id;
        await response.photo(fileId, {
          caption: `<b>✅ User Unmuted Successfully!</b>\n\nUnmuted User: @${safe(targetUser.username || targetUser.first_name)}\nUnmuted by: @${safe(msg.from.username || msg.from.first_name)}`,
          parse_mode: 'HTML',
          noReply: true
        });
      } else {
        await response.send(
          `<b>✅ User Unmuted Successfully!</b>\n\nUnmuted User: @${safe(targetUser.username || targetUser.first_name)}\nUnmuted by: @${safe(msg.from.username || msg.from.first_name)}`,
          { parse_mode: 'HTML', noReply: true }
        );
      }
    } catch (sendErr) {
      console.warn('unmute: failed to send photo, sending text instead:', sendErr && sendErr.message ? sendErr.message : sendErr);
      await response.send(
        `<b>✅ User Unmuted Successfully!</b>\n\nUnmuted User: @${safe(targetUser.username || targetUser.first_name)}\nUnmuted by: @${safe(msg.from.username || msg.from.first_name)}`,
        { parse_mode: 'HTML', noReply: true }
      );
    }

    // Notify the user (best-effort)
    try {
      await bot.sendMessage(chatId,
        `<b>🔊 Good news!</b>\n\n@${safe(targetUser.username || targetUser.first_name)}, you have been unmuted and can now send messages in the group.`,
        { parse_mode: 'HTML', reply_to_message_id: msg.reply_to_message.message_id }
      );
    } catch (notifErr) {
      // ignore
    }

    try { await response.delete(loading); } catch (e) { /* ignore */ }
    return;
  } catch (err) {
    // Fallback: if API fails, we already cleared global.mutedUsers; inform and log
    console.warn('restrictChatMember (unmute) failed — cleaned up fallback store:', err && (err.message || err));
    await response.editText(
      loading,
      `<b>✅ Unmuted (best-effort)</b>\n\nUser: @${safe(targetUser.username || targetUser.first_name)}\nNote: Could not update official permissions via API. If the user still cannot send messages, please check the group type/permissions and try again.`,
      { parse_mode: 'HTML' }
    );
    return;
  }
}
