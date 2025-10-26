import axios from 'axios';

export const meta = {
  name: 'gpt',
  version: '1.0.0',
  aliases: ['g', 'ask', 'chat'],
  description: 'Simple GPT-5 command',
  author: 'Betadash API',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 3,
  guide: ['<prompt>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) return await usages();

  const prompt = args.join(' ');
  const loadingMsg = await response.reply(`🤖 Asking GPT: *${prompt}*...`, { parse_mode: 'Markdown' });

  try {
    const url = `${global.api.betadash}/gpt-5?ask=${encodeURIComponent(prompt)}`;
    const { data } = await axios.get(url, { timeout: 15000 });

    if (!data?.response) {
      return await response.editText(loadingMsg, '❌ Failed to get a response from GPT.', { parse_mode: 'Markdown' });
    }

    const final = `${data.response}`;
    return await response.editText(loadingMsg, final, { parse_mode: 'Markdown' });

  } catch (error) {
    const errText = error?.response?.status
      ? `⚠️ API error: received status ${error.response.status}`
      : `⚠️ An error occurred: ${error.message || 'Unknown error'}`;

    try {
      return await response.editText(loadingMsg, errText, { parse_mode: 'Markdown' });
    } catch {
      return await response.reply(errText, { parse_mode: 'Markdown' });
    }
  }
}
