import axios from 'axios';

export const meta = {
  name: 'girl',
  version: '1.1.0',
  aliases: ['woman', 'girlphoto'],
  description: 'Send a random girl photo by country (default: Japan)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['[country]', 'Available countries: japan (default), indonesia, korea, thailand, vietnam']
};

export async function onStart({ bot, msg, args, response }) {
  const countryList = ['japan', 'indonesia', 'korea', 'thailand', 'vietnam'];
  const country = (args[0]?.toLowerCase() || 'japan');
  const selected = countryList.includes(country) ? country : 'japan';

  const loadingMsg = await response.reply(`🎭 *Fetching a random ${selected.charAt(0).toUpperCase() + selected.slice(1)} girl photo...*`, { parse_mode: 'Markdown' });

  try {
    const res = await axios.get(`${global.api.nekolabs}/random/girl/${selected}`, { responseType: 'arraybuffer' });

    await response.editText(loadingMsg, `✨ *Here’s your random ${selected.charAt(0).toUpperCase() + selected.slice(1)} girl photo!*`, { parse_mode: 'Markdown' });

    await response.photo(Buffer.from(res.data), { caption: `📸 *Random ${selected.charAt(0).toUpperCase() + selected.slice(1)} Girl*`, parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch photo: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
