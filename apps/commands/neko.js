import axios from 'axios';

export const meta = {
  name: 'neko',
  version: '1.0.0',
  aliases: ['nekophoto', 'nekoimg'],
  description: 'Send a random neko image',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'anime',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, response }) {
  const loadingMsg = await response.reply(`🎭 *Fetching a random ${meta.name} image...*`, { parse_mode: 'Markdown' });

  try {
    // Get JSON from nekos.best
    const { data } = await axios.get('https://nekos.best/api/v2/neko');
    const imageUrl = data?.results?.[0]?.url;
    if (!imageUrl) throw new Error('No image returned by API.');

    // Fetch image as binary
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    // Edit loading message to success
    await response.editText(loadingMsg, `✨ *Here’s your random ${meta.name} image!*`, { parse_mode: 'Markdown' });

    // Send the image
    await response.photo(Buffer.from(imageRes.data), {
      caption: `📸 *Random ${meta.name} Image*`,
      parse_mode: 'Markdown'
    });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch ${meta.name} image: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
