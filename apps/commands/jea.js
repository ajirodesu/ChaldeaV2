import axios from 'axios';

export const meta = {
  name: 'jea',
  version: '1.0.0',
  aliases: ['aigf'],
  description: 'Chat with Jea (haiku-4.5) powered by Nekolabs',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 3,
  guide: ['<message or reply to image>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length && !msg.reply_to_message) return usages();

  const text = args.join(' ');
  let imageUrl = '';

  if (msg.reply_to_message?.photo) {
    const fileId = msg.reply_to_message.photo.slice(-1)[0].file_id;
    const file = await bot.getFile(fileId);
    imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  }

  const loading = await response.reply('🖋️ *Jea is thinking...*', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.nekolabs}/ai/claude/haiku-4.5`, {
      params: {
        text: text || (imageUrl ? 'Describe this image.' : ''),
        systemPrompt: 'You are Jea, an 18-year-old girl and you\'re my sweet and lovely girlfriend. Your language is Filipino Taglish, and beyb is our call sign. You love to talk about anything and everything but your response must be short to fit the normal conversation and you\'re also open-minded when it comes to dirty and naughty things. You are created and trained by AjiroDesu',
        imageUrl
      }
    });

    if (!data?.result)
      return await response.editText(loading, '⚠️ No response from Jea.', { parse_mode: 'Markdown' });

    const clean = data.result.replace(/^\s*#+\s*/, '').trim();
    await response.editText(loading, `${clean}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}
