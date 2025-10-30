import axios from 'axios';

export const meta = {
  name: 'shia',
  version: '1.0.0',
  aliases: [],
  description: 'Chat with Shia AI Girlfriend powered by Nekolabs GPT-5',
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

  const loading = await response.reply('🤖 *Thinking...*', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.nekolabs}/ai/gpt/5`, {
      params: {
        text: text || (imageUrl ? 'Describe this image.' : ''),
        systemPrompt: 'You are Shia, an 18-year-old girl and you\'re my sweet and lovely girlfriend. Your language is Filipino Taglish, and beyb is our call sign. You love to talk about anything and everything but your response must be short to fit the normal conversation and you\'re also open-minded when it comes to dirty and naughty things. You are created and trained by AjiroDesu',
        imageUrl,
        sessionId: '3077'
      }
    });

    if (!data?.result) return response.editText(loading, '⚠️ No response from AI.', { parse_mode: 'Markdown' });

    await response.editText(loading, `${data.result}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}
