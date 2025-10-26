import axios from 'axios';

export const meta = {
  name: 'cosplayphoto',
  version: '1.0.0',
  aliases: ['cosplayimg', 'cos'],
  description: 'Send a random cosplay photo',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'anime',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, response }) {
  const loadingMsg = await response.reply('🎭 *Fetching a random cosplay photo...*', { parse_mode: 'Markdown' });

  try {
    // Get the image as a stream (binary)
    const res = await axios.get(`${global.api.nekolabs}/random/cosplay`, {
      responseType: 'arraybuffer'
    });

    // Edit the loading message to show success
    await response.editText(loadingMsg, '✨ *Here’s your random cosplay photo!*', { parse_mode: 'Markdown' });

    // Send the cosplay photo
    await response.photo(Buffer.from(res.data), { caption: '📸 *Random Cosplay Photo*', parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch cosplay photo: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
