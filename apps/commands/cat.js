import axios from 'axios';

export const meta = {
  name: 'cat',
  version: '1.0.0',
  aliases: ['catphoto'],
  description: 'Send a random cat photo',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, response }) {
  const loadingMsg = await response.reply(`🎭 *Fetching a random ${meta.name} photo...*`, { parse_mode: 'Markdown' });

  try {
    // Get the image as a stream (binary)
    const res = await axios.get(`${global.api.nekolabs}/random/cat`, {
      responseType: 'arraybuffer'
    });

    // Edit the loading message to show success
    await response.editText(loadingMsg, `✨ *Here’s your random ${meta.name} photo!*`, { parse_mode: 'Markdown' });

    // Send the cosplay photo
    await response.photo(Buffer.from(res.data), { caption: `📸 *Random ${meta.name} Photo*`, parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch ${meta.name} photo: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
