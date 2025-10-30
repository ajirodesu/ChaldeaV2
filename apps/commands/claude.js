import axios from 'axios';

export const meta = {
  name: 'claude',
  version: '1.0.0',
  aliases: ['cld', 'haiku'],
  description: 'Chat with Claude (haiku-4.5) powered by Nekolabs',
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

  const loading = await response.reply('🖋️ *Claude is thinking...*', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.nekolabs}/ai/claude/haiku-4.5`, {
      params: {
        text: text || (imageUrl ? 'Describe this image.' : ''),
        systemPrompt: 'You are a helpful assistant.',
        imageUrl
      }
    });

    if (!data?.result)
      return await response.editText(loading, '⚠️ No response from Claude.', { parse_mode: 'Markdown' });

    const clean = data.result.replace(/^\s*#+\s*/, '').trim();
    await response.editText(loading, `💬 *Claude:*\n\n${clean}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}
