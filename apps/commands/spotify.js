import axios from 'axios';

export const meta = {
  name: 'spotify',
  version: '1.0.1',
  aliases: ['spot', 'music'],
  description: 'Download Spotify songs by title',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'media',
  type: 'anyone',
  cooldown: 5,
  guide: ['<song name>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) return await usages();

  const query = args.join(' ');
  const loadingMsg = await response.reply(`🎵 Searching Spotify for *${query}*...`, { parse_mode: 'Markdown' });

  const fail = async (text) => {
    try { await response.editText(loadingMsg, text, { parse_mode: 'Markdown' }); }
    catch (e) { try { await response.delete(loadingMsg); } catch {} await response.reply(text, { parse_mode: 'Markdown' }); }
  };

  try {
    if (!global.api?.nekolabs) {
      return await fail('⚠️ Nekolabs API not configured. Set `global.api.nekolabs`.');
    }

    const res = await axios.get(`${global.api.nekolabs}/downloader/spotify/play/v1?q=${encodeURIComponent(query)}`, { timeout: 15000 });
    const data = res.data;

    if (!data?.success || !data?.result) {
      return await fail(`❌ Failed to fetch Spotify data for *${query}*. Please try again later.`);
    }

    const metadata = data.result.metadata ?? {};
    const title = metadata.title ?? 'Unknown';
    const artist = metadata.artist ?? 'Unknown';
    const duration = metadata.duration ?? 'Unknown';
    const cover = metadata.cover ?? null;
    const url = metadata.url ?? '';
    const downloadUrl = data.result.downloadUrl ?? data.result.download_url ?? null;

    const caption = [
      '🎧 *Spotify Song Found!*',
      '',
      `🎵 *Title:* ${title}`,
      `👤 *Artist:* ${artist}`,
      `⏱️ *Duration:* ${duration}`,
      `🔗 [Open in Spotify](${url || 'https://open.spotify.com'})`
    ].join('\n');

    try { await response.delete(loadingMsg); } catch (e) {}

    if (cover) await response.photo(cover, { caption, parse_mode: 'Markdown' });
    else await response.reply(caption, { parse_mode: 'Markdown' });

    if (downloadUrl) {
      await response.audio(downloadUrl, { title, performer: artist });
    } else {
      await response.reply('⚠️ Download URL not available for this track.', { parse_mode: 'Markdown' });
    }
  } catch (error) {
    const errText = error?.response?.data?.message
      ? `⚠️ API error: ${error.response.data.message}`
      : `⚠️ An error occurred: ${error.message}`;
    await fail(errText);
  }
}
