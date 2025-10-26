import axios from 'axios';

export const meta = {
  name: 'balogo',
  version: '1.0.0',
  aliases: [],
  description: 'Generate a Blue Archive style logo image',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'image',
  type: 'anyone',
  cooldown: 5,
  guide: ['<text1> | <text2>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const text = args.join(' ');
  if (!text.includes('|')) return await usages();

  const [text1, text2] = text.split('|').map(t => t.trim());
  if (!text1 || !text2) return await usages();

  const loadingMsg = await response.reply(`🎨 *Generating Blue Archive logo...*`, { parse_mode: 'Markdown' });

  try {
    const url = `${global.api.nekolabs}/canvas/ba-logo?textL=${encodeURIComponent(text1)}&textR=${encodeURIComponent(text2)}`;
    const res = await axios.get(url, { responseType: 'arraybuffer' });

    await response.editText(loadingMsg, `✨ *Here’s your Blue Archive logo!*`, { parse_mode: 'Markdown' });
    await response.photo(Buffer.from(res.data), { caption: `🖼️ *${text1} ${text2}*`, parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to generate logo: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
