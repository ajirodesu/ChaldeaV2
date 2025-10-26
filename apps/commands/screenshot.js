import axios from 'axios';

export const meta = {
  name: 'screenshot',
  version: '1.0.0',
  aliases: ['webshot', 'sitecapture', 'snapweb'],
  description: 'Capture a screenshot of any website using Pikwy API',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'tools',
  type: 'anyone',
  cooldown: 5,
  guide: ['<url> - Capture a website screenshot (e.g. /screenshot https://example.com)']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const url = args[0];
  if (!url)
    return response.reply(
      '⚠️ *Please provide a valid website URL.*\nExample: `/screenshot https://example.com`',
      { parse_mode: 'Markdown' }
    );

  const loadingMsg = await response.reply('🖼️ *Capturing website screenshot...*', {
    parse_mode: 'Markdown'
  });

  try {
    const apiUrl = `https://api.pikwy.com/?tkn=125&d=3000&fs=0&w=1280&h=1200&s=100&z=100&f=jpg&rt=jweb&u=${encodeURIComponent(
      url
    )}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.iurl) {
      throw new Error('No screenshot URL found in response.');
    }

    await response.editText(loadingMsg, '✅ *Screenshot captured successfully!*', { parse_mode: 'Markdown' });

    await response.photo(data.iurl, { caption: `🖼️ *Website Screenshot*\n🌐 URL: ${url}`, parse_mode: 'Markdown' });
  } catch (error) {
    await response.editText(loadingMsg, `❌ *Failed to capture screenshot:*\n${error.response?.data?.error || error.message}`, { parse_mode: 'Markdown' });
  }
}
