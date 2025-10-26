import axios from 'axios';

export const meta = {
  name: 'brat',
  version: '1.0.0',
  aliases: ['bratty'],
  description: 'Generate a Brat Image',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'image',
  type: 'anyone',
  cooldown: 5,
  guide: ['<text>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) return await usages();

  const text = args.join('');
  const loadingMsg = await response.reply(`🎨 *Generating Brat Text...*`, { parse_mode: 'Markdown' });

  try {
    const url = `${global.api.nekolabs}/canvas/brat/v1?text=${encodeURIComponent(text)}`;
    const res = await axios.get(url, { responseType: 'arraybuffer' });

    await response.editText(loadingMsg, `✨ *Here’s your Brat Text*`, { parse_mode: 'Markdown' });
    await response.photo(Buffer.from(res.data), { caption: `🖼️ *${text}*`, parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to generate logo: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
