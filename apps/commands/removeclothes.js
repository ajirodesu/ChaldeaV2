import axios from 'axios';

export const meta = {
  name: 'removeclothes',
  version: '1.0.0',
  aliases: ['rc', 'undress'],
  description: 'Undress a person in the images (Nekolabs)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'vip',
  type: 'vip',
  cooldown: 3,
  guide: ['<image url> or reply to an image']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const argUrl = args.join(' ').trim();
  let imageUrl = argUrl || '';

  if (!imageUrl && msg.reply_to_message?.photo) {
    const fileId = msg.reply_to_message.photo.slice(-1)[0].file_id;
    const file = await bot.getFile(fileId);
    imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  }

  if (!imageUrl) return usages();

  const loading = await response.reply('🖼️ Processing image...', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.nekolabs}/tools/convert/remove-clothes`, {
      params: { imageUrl }
    });

    if (!data?.success || !data?.result) {
      return response.editText(loading, '⚠️ Failed to convert image.', { parse_mode: 'Markdown' });
    }

    // send resulting image URL as a photo (Telegram will fetch it)
    await response.editText(loading, '✅ Done — sending image...', { parse_mode: 'Markdown' });
    await response.photo(data.result, { caption: '✨ Undress Result' });
  } catch (e) {
    await response.editText(loading, `⚠️ Error: ${e.message}`, { parse_mode: 'Markdown' });
  }
}
