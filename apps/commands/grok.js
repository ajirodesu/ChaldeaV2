import axios from 'axios';

export const meta = {
  name: 'grok',
  version: '1.0.0',
  aliases: ['grk', 'xai'],
  description: 'Chat with Grok (v4) powered by Nekolabs',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 3,
  guide: ['<message>']
};

export async function onStart({ args, response, usages }) {
  if (!args.length) return usages();

  const prompt = args.join(' ');
  const loading = await response.reply('🧠 *Grok is thinking...*', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.nekolabs}/ai/grok/4`, {
      params: { prompt },
      timeout: 15000
    });

    if (!data?.result)
      return await response.editText(loading, '⚠️ No response from Grok.', { parse_mode: 'Markdown' });

    const clean = data.result.replace(/^\s*#+\s*/, '').trim();
    await response.editText(loading, `💬 *Grok:*\n\n${clean}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}
