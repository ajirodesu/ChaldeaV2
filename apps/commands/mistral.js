import axios from 'axios';

export const meta = {
  name: 'mistral',
  version: '1.0.0',
  aliases: ['mst'],
  description: 'Chat with Mistral (mistral-small-3.1-24b)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 3,
  guide: ['<message>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) return usages();
  const q = args.join(' ');
  const load = await response.reply('🤖 Thinking...', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.nekolabs}/ai/cf/mistral-small-3.1-24b`, {
      params: { text: q }
    });

    if (!data?.success || !data?.result)
      return response.editText(load, '⚠️ No valid response from Mistral.', { parse_mode: 'Markdown' });

    const out = String(data.result);
    if (out.length > 4000) {
      await response.editText(load, `💬 Response (truncated):\n\n${out.slice(0, 4000)}...`, { parse_mode: 'Markdown' });
      return response.document(Buffer.from(out, 'utf8'), { filename: 'mistral-response.txt' });
    }

    await response.editText(load, `💬 Mistral:\n\n${out}`, { parse_mode: 'Markdown' });
  } catch (e) {
    await response.editText(load, `⚠️ Error: ${e.message}`, { parse_mode: 'Markdown' });
  }
}
