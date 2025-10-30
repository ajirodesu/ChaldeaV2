export const meta = {
  name: 'stalk',
  version: '1.0.3',
  aliases: ['whois', 'info'],
  description: 'Show public Telegram info for a user (by reply, id, @username, or yourself if no arg provided).',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 3,
  guide: [
    '[reply]',
    '[ ID 123456789 ]',
    '[ @someuser ]',
    'No args shows info about the invoking user'
  ]
};

function safe(v) {
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

function escapeMarkdown(text = '') {
  return String(text).replace(/([_*`[\]])/g, '\\$1');
}

export async function onStart({ bot, msg, args, response, usages }) {
  // No longer require args/reply — default to the invoking user when nothing is provided
  const loading = await response.reply('🔎 *Fetching user info...*', { parse_mode: 'Markdown' });

  try {
    let targetUser = null;
    let targetId = null;
    let chatData = null;
    let profilePhotoFileId = null; // prefer file_id
    let profilePhotoUrl = null;    // fallback URL
    let photos = null;
    let chatMember = null;

    // 1) If replying to a message, prefer replied user's object
    if (msg.reply_to_message && msg.reply_to_message.from) {
      targetUser = msg.reply_to_message.from;
      targetId = targetUser.id;
    } else if (args.length) {
      // 2) parse argument (username or numeric id)
      const raw = args[0].trim();
      if (raw.startsWith('@')) {
        try {
          chatData = await bot.getChat(raw);
          targetId = chatData.id;
          targetUser = {
            id: chatData.id,
            first_name: chatData.first_name || '',
            last_name: chatData.last_name || '',
            username: chatData.username || '',
            is_bot: chatData.is_bot || false,
            language_code: chatData.language_code
          };
        } catch (e) {
          await response.editText(
            loading,
            `⚠️ Could not find user with username *${escapeMarkdown(raw)}*.\n\nTips:\n- Check the username (include @).\n- The bot may not have access to that user if they never interacted with the bot.`,
            { parse_mode: 'Markdown' }
          );
          return;
        }
      } else if (/^\d+$/.test(raw)) {
        targetId = Number(raw);
      } else {
        await response.editText(
          loading,
          '⚠️ Invalid identifier. Use a numeric user id, @username, reply to a message, or run without args to stalk yourself.',
          { parse_mode: 'Markdown' }
        );
        return;
      }
    } else {
      // 3) No args and no reply -> default to invoking user
      targetUser = msg.from;
      targetId = msg.from.id;
    }

    if (!targetId) {
      await response.editText(loading, '⚠️ Unable to resolve the target user id.', { parse_mode: 'Markdown' });
      return;
    }

    // If we don't have a user object, try to fetch it via getChat (best-effort)
    if (!targetUser) {
      try {
        chatData = await bot.getChat(targetId);
        targetUser = {
          id: chatData.id,
          first_name: chatData.first_name || '',
          last_name: chatData.last_name || '',
          username: chatData.username || '',
          is_bot: chatData.is_bot || false,
          language_code: chatData.language_code
        };
      } catch (e) {
        targetUser = { id: targetId };
      }
    }

    // Try to fetch profile photos (best-effort)
    try {
      photos = await bot.getUserProfilePhotos(targetId, { offset: 0, limit: 1 });
    } catch {
      photos = null;
    }

    if (photos && photos.total_count && photos.photos && photos.photos.length) {
      try {
        const sizes = photos.photos[0];
        const largest = sizes[sizes.length - 1];
        // Prefer sending the photo by file_id (no HTTP fetch required).
        profilePhotoFileId = largest.file_id;

        // Also attempt to get the file_path as a fallback (but we won't rely on it).
        try {
          const file = await bot.getFile(largest.file_id).catch(() => null);
          if (file && file.file_path) {
            profilePhotoUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
          }
        } catch {
          profilePhotoUrl = null;
        }
      } catch {
        profilePhotoFileId = null;
        profilePhotoUrl = null;
      }
    }

    // Try to get chat-level data (bio/description)
    if (!chatData) {
      try {
        chatData = await bot.getChat(targetId).catch(() => null);
      } catch {
        chatData = null;
      }
    }

    // If we are inside a group where the command was run, try to getChatMember
    try {
      if (msg.chat && msg.chat.id) {
        chatMember = await bot.getChatMember(msg.chat.id, targetId).catch(() => null);
      }
    } catch {
      chatMember = null;
    }

    // Build output text
    const nameParts = [targetUser?.first_name, targetUser?.last_name].filter(Boolean);
    const displayName = nameParts.length ? nameParts.join(' ') : `User ${targetId}`;
    const usernameText = targetUser?.username ? `@${safe(targetUser.username)}` : '—';
    const isBotText = targetUser?.is_bot !== undefined ? safe(targetUser.is_bot) : '—';
    const language = safe(targetUser?.language_code ?? chatData?.language_code ?? '—');
    const bio = chatData?.bio ?? chatData?.description ?? null;
    const photosCount = photos ? photos.total_count || 0 : 0;

    const lines = [
      `*User info for* ${escapeMarkdown(displayName)}`,
      '',
      `*ID:* ${safe(targetId)}`,
      `*Name:* ${escapeMarkdown(displayName)}`,
      `*Username:* ${escapeMarkdown(usernameText)}`,
      `*Is bot:* ${escapeMarkdown(isBotText)}`,
      `*Language:* ${escapeMarkdown(language)}`
    ];

    if (bio) {
      lines.push(`*Bio:* ${escapeMarkdown(bio)}`);
    }

    if (chatMember && chatMember.status) {
      lines.push(`*Chat status:* ${escapeMarkdown(chatMember.status)}`);
      if (chatMember.user && typeof chatMember.user.is_bot !== 'undefined') {
        lines.push(`*Member is bot:* ${escapeMarkdown(String(chatMember.user.is_bot))}`);
      }
    }

    lines.push(`*Profile photos:* ${photosCount}`);
    lines.push('');
    lines.push('_Note: This command shows only public/accessible Telegram info. It cannot access phone numbers, last-seen, location, or private messages._');

    const infoText = lines.join('\n');

    // Send result: prefer to send photo by file_id (avoids "failed to get HTTP URL content")
    if (profilePhotoFileId) {
      try {
        await response.photo(profilePhotoFileId, { caption: infoText, parse_mode: 'Markdown' });
        try { await response.delete(loading); } catch (e) {}
        return;
      } catch (photoErr) {
        // If sending by file_id fails, fall through to try URL or send text
        console.warn('sending profile photo by file_id failed:', photoErr && photoErr.message ? photoErr.message : photoErr);
      }
    }

    // If no usable file_id, try sending by file URL (best-effort), but handle the specific Telegram URL fetch error.
    if (profilePhotoUrl) {
      try {
        await response.photo(profilePhotoUrl, { caption: infoText, parse_mode: 'Markdown' });
        try { await response.delete(loading); } catch (e) {}
        return;
      } catch (urlErr) {
        const msgText = String(urlErr?.message || urlErr || '');
        // Common Telegram HTTP fetch failure
        if (msgText.includes('failed to get HTTP URL content')) {
          await response.editText(
            loading,
            `${infoText}\n\n⚠️ Profile photo could not be delivered because Telegram failed to fetch the image URL. Showing text info instead.`,
            { parse_mode: 'Markdown' }
          );
          return;
        }
        // other errors -> fall back to showing text
        console.warn('sending profile photo by URL failed:', urlErr);
      }
    }

    // If no photo available or photo sending failed, just edit loading to final text
    await response.editText(loading, infoText, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('stalk command error:', err);
    await response.editText(loading, `⚠️ Error while fetching info: ${escapeMarkdown(err?.message || String(err))}`, { parse_mode: 'Markdown' });
  }
}
