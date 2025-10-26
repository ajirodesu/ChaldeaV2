import axios from 'axios';

export const meta = {
  name: 'ip',
  version: '1.0.0',
  aliases: ['ipinfo'],
  description: 'Get IP information',
  author: 'Prince',
  prefix: 'both',
  category: 'tools',
  type: 'anyone',
  cooldown: 5,
  guide: ['get <ip address>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (args[0] !== 'get' || !args[1]) {
    return await usages();
  }

  const ip = args[1];

  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = res.data;

    if (data.status === 'success') {
      const ipInfo = `
📍 *IP Information:*

*IP:* ${data.query || 'N/A'}
*🌍 Country:* ${data.country || 'N/A'}
*🏙️ Region:* ${data.regionName || 'N/A'}
*📍 City:* ${data.city || 'N/A'}
*📚 ISP:* ${data.isp || 'N/A'}
*🌐 Latitude:* ${data.lat || 'N/A'}
*🌐 Longitude:* ${data.lon || 'N/A'}
`;

      await response.reply(ipInfo, { parse_mode: 'Markdown' });
    } else {
      await response.reply(`❌ *Failed to retrieve IP information for* \`${ip}\`.`, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    await response.reply(`⚠️ *An error occurred:* \`${error.message}\``, { parse_mode: 'Markdown' });
  }
}
