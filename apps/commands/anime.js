import axios from 'axios';

export const meta = {
  name: 'anime',
  version: '1.0.0',
  aliases: ['animephoto', 'animet'],
  description: 'Send a random anime photo',
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
    const res = await axios.get('http://pic.re/image', {
      responseType: 'arraybuffer'
    });

    // Edit the loading message to show success
    await response.editText(loadingMsg, `✨ *Here’s your random ${meta.name} image!*`, { parse_mode: 'Markdown' });

    // Send the image as a photo
    await response.photo(Buffer.from(res.data), { caption: `📸 *Random ${meta.name} Image*`, parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch ${meta.name} image: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
