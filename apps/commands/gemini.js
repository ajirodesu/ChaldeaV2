import axios from 'axios';

export const meta = {
  name: 'gemini',
  version: '1.1.0',
  aliases: ['gemi', 'g25'],
  description: 'Use Gemini 2.5-flash for text or image understanding.',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 3,
  guide: [
    '<text> — Send a message to Gemini',
    'Or reply to an image to describe it (no text required).',
    'What is this image? (reply to an image)'
  ]
};

// Helper: get image URL from replied message
async function getReplyImageUrl(bot, msg) {
  if (!msg.reply_to_message) return null;
  if (msg.reply_to_message.photo) {
    const fileId = msg.reply_to_message.photo.slice(-1)[0].file_id;
    const file = await bot.getFile(fileId);
    return `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  }
  if (msg.reply_to_message.text && /^https?:\/\//i.test(msg.reply_to_message.text.trim())) {
    return msg.reply_to_message.text.trim().split(/\s+/)[0];
  }
  return null;
}

export async function onStart({ bot, msg, args, response, usages }) {
  try {
    const raw = args.join(' ').trim();
    const repliedToImage = Boolean(
      msg.reply_to_message?.photo ||
      (msg.reply_to_message?.text && /^https?:\/\//i.test(msg.reply_to_message.text))
    );

    if (!raw && !repliedToImage) return usages();

    const text = raw || (repliedToImage ? 'Describe this image.' : '');
    const imageUrl = await getReplyImageUrl(bot, msg);
    const sessionId = String(msg.from?.id ?? `user_${Date.now()}`);

    // Built-in system prompt (no user input)
    const systemPrompt = 'You are Gemini 2.5-flash, a helpful and intelligent assistant. Provide concise, accurate, and friendly responses.';

    const loading = await response.reply('💫 *Contacting Gemini (2.5-flash)...*', { parse_mode: 'Markdown' });

    const params = { text, sessionId, systemPrompt };
    if (imageUrl) params.imageUrl = imageUrl;

    const apiUrl = `${global.api.nekolabs}/ai/gemini/2.5-flash/v2`;
    const { data } = await axios.get(apiUrl, { params, timeout: 120000 });

    const answer = data?.result ?? data?.answer ?? data?.data ?? null;
    if (!answer && typeof data === 'string')
      return await response.editText(loading, `💬 ${data}`, { parse_mode: 'Markdown' });

    if (!answer)
      return await response.editText(loading, '⚠️ No response from Gemini.', { parse_mode: 'Markdown' });

    await response.editText(
      loading,
      `💬 *Gemini (2.5-flash) Response:*\n\n${answer}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    const msgErr = err?.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
      : err.message;
    await response.reply(`⚠️ Error: ${msgErr}`, { parse_mode: 'Markdown' });
  }
}
