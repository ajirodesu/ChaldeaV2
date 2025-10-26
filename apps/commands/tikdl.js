import axios from 'axios';

export const meta = {
  name: 'tiktok',
  version: '1.0.0',
  aliases: ['tikdl', 'ttdl'],
  description: 'Download TikTok videos without watermark',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'downloader',
  type: 'anyone',
  cooldown: 5,
  guide: ['<tiktok_url> - Download TikTok videos (no watermark)']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const tiktokUrl = args[0];
  if (!tiktokUrl)
    return usages();

  const loadingMsg = await response.reply('🎵 *Fetching TikTok video...*', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`);

    if (!data || !data.data?.play) {
      throw new Error('Invalid or unavailable TikTok video.');
    }

    const video = data.data;
    const caption = `🎬 *TikTok Downloader V2*\n\n📌 *Title:* ${video.title}\n👤 *Author:* ${video.author.nickname}\n⏱️ *Duration:* ${video.duration}s`;

    await response.editText(loadingMsg, '✅ *Video fetched successfully!*', { parse_mode: 'Markdown' });

    await response.video(video.play, { caption, thumb: video.cover, parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `❌ *Failed to fetch TikTok video:*\n${error.message}`, { parse_mode: 'Markdown' });
  }
}
