import axios from 'axios';

export const meta = {
  name: 'ai',
  version: '1.0.0',
  aliases: [],
  description: 'Chat with AI powered by Nekolabs GPT-5',
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
        systemPrompt: 'You are a helpful assistant.',
        imageUrl,
        sessionId: 'neko'
      }
    });

    if (!data?.result) return response.editText(loading, '⚠️ No response from AI.', { parse_mode: 'Markdown' });

    await response.editText(loading, `💬 *AI Response:*\n\n${data.result}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}
