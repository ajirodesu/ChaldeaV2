import axios from 'axios';

export const meta = {
  name: 'ai4img',
  version: '1.0.0',
  aliases: ['ai4image'],
  description: 'Generate anime-style images from a prompt (powered by AryChauhann API)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'anime',
  type: 'anyone',
  cooldown: 5,
  guide: ['<prompt>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  // Require a prompt or a replied message as input
  if (!args.length && !msg.reply_to_message) return usages();

  const prompt = args.join(' ') || 'sakura';

  // Send a loading message while generating
  const loading = await response.reply('🎨 *Generating image...*', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`${global.api.aryan}/api/ai4image`, {
      params: { prompt }
    });

    if (!data?.status || !data?.result || !data.result.image_link) {
      return response.editText(loading, '⚠️ No image returned from the API.', { parse_mode: 'Markdown' });
    }

    // Send the generated image without editing the loading message
    await response.photo(data.result.image_link, {
      caption: `🖼 *Prompt:* ${prompt}`,
      parse_mode: 'Markdown'
    });

    // Remove the loading message on success
    try { await response.delete(loading); } catch (e) { /* ignore delete errors */ }

  } catch (err) {
    // Edit the loading message only on errors
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}
