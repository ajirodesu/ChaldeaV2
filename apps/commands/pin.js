export const meta = {
  name: 'pin',
  version: '1.0.0',
  aliases: [],
  description: 'Pin a replied message in the group.',
  author: 'JohnDev19',
  prefix: 'both',
  category: 'group',
  type: 'administrator',
  cooldown: 2,
  guide: [
    'Reply to a message with pin to pin it.',
    'Automatically pins the replied message in the group.'
  ]
};

export async function onStart({ bot, msg, args, response }) {
  // Ensure the command is used as a reply
  if (!msg.reply_to_message) {
    return response.reply('❌ Please reply to a message with this command to pin it.');
  }

  // Send temporary loading message
  const loading = await response.reply('📌 Pinning message...', { parse_mode: 'HTML' });

  try {
    // Pin the replied message
    await bot.pinChatMessage(msg.chat.id, msg.reply_to_message.message_id, {
      disable_notification: false
    });

    // Successfully pinned
    const pinnedBy = msg.from.username
      ? `@${msg.from.username}`
      : `${msg.from.first_name || 'Unknown'}`;

    await response.editText(
      loading,
      `<b>📌 Message Pinned Successfully!</b>\n\nPinned by: ${pinnedBy}`,
      {
        parse_mode: 'HTML',
        reply_to_message_id: msg.reply_to_message.message_id
      }
    );

    // Auto-delete the command message after 5 seconds
    setTimeout(async () => {
      try {
        await response.delete(msg.message_id);
      } catch {}
    }, 5000);

  } catch (error) {
    console.error('Pin Command Error:', error);

    const errMsg = String(error?.response?.body?.description || error?.message || error);

    if (errMsg.includes('not enough rights')) {
      return response.editText(loading, '🚫 Bot lacks permission to pin messages.');
    }

    if (errMsg.includes('can\'t pin a message')) {
      return response.editText(loading, '⚠️ This message cannot be pinned.');
    }

    await response.editText(
      loading,
      '❌ Failed to pin the message. Please try again later.'
    );
  }
}
