import axios from 'axios';

export const meta = {
  name: 'shoti',
  version: '1.0.0',
  aliases: ['tiktokshoti'],
  description: 'Send a random Shoti video',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 8,
  guide: ['']
};

export async function onStart({ bot, msg, response }) {
  const loadingMsg = await response.reply('📱 *Fetching a random Shoti video...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get(`https://betadash-shoti-yazky.vercel.app/shotizxx?apikey=shipazu`);
    const data = res.data;

    if (!data?.shotiurl) {
      return await response.editText(loadingMsg, '❌ Failed to fetch Shoti video.', { parse_mode: 'Markdown' });
    }

    const caption = `🎬 *${data.title}*\n👤 *${data.nickname}* (@${data.username})\n🌍 *Region:* ${data.region}\n📹 *Duration:* ${data.duration}s\n🎞️ *Total Videos:* ${data.total_vids.toLocaleString()}`;

    await response.editText(loadingMsg, '✨ *Uploading video...*', { parse_mode: 'Markdown' });

    await response.video(data.shotiurl, {
      caption,
      parse_mode: 'Markdown',
      thumb: data.cover_image
    });

    await response.editText(loadingMsg, '✅ *Video sent successfully!*', { parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch Shoti video: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
