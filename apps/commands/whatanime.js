import axios from 'axios';

export const meta = {
  name: 'whatanime',
  version: '1.0.0',
  aliases: ['wa', 'animefinder'],
  description: 'Find anime & character from an image (Nekolabs)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Tools',
  type: 'anyone',
  cooldown: 3,
  guide: ['<image url> or reply to an image']
};

export async function onStart({ bot, msg, args, response, usages }) {
  let imageUrl = args.join(' ').trim();

  if (!imageUrl && msg.reply_to_message?.photo) {
    try {
      const fileId = msg.reply_to_message.photo.slice(-1)[0].file_id;
      const file = await bot.getFile(fileId);
      imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    } catch (e) {
      // fail silently and let usages() handle missing image
    }
  }

  if (!imageUrl) return usages();

  const load = await response.reply('🔎 Searching anime...', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.nekolabs}/tools/anime-finder`, {
      params: { imageUrl }
    });

    if (!data?.success || !data?.result)
      return response.editText(load, '⚠️ No match found or API error.', { parse_mode: 'Markdown' });

    const r = data.result;
    let out = `🎬 *${r.anime || 'Unknown'}*\n👤 *Character:* ${r.character || '—'}\n📚 *Genres:* ${r.genres || '—'}\n📅 *Premiere:* ${r.premiere || '—'}\n🏭 *Production:* ${r.production || '—'}\n\n*Description:*\n${r.description || '—'}\n\n*Synopsis:*\n${r.synopsis || '—'}`;

    if (Array.isArray(r.references) && r.references.length) {
      out += '\n\n*References:*';
      r.references.forEach(ref => {
        if (ref.site && ref.url) out += `\n[${ref.site}](${ref.url})`;
      });
    }

    if (out.length > 4000) {
      await response.editText(load, '✅ Found — sending details as a file.');
      return response.document(Buffer.from(out, 'utf8'), { filename: 'whatanime-result.txt' });
    }

    await response.editText(load, out, { parse_mode: 'Markdown', disable_web_page_preview: false });
  } catch (e) {
    await response.editText(load, `⚠️ Error: ${e.message || e.toString()}`, { parse_mode: 'Markdown' });
  }
}
