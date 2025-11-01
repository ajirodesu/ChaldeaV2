import axios from 'axios';

export const meta = {
  name: 'play',
  version: '1.0.0',
  aliases: ['song', 'ytplay'],
  description: 'Play or download YouTube music (via Nekolabs)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Downloader',
  type: 'anyone',
  cooldown: 5,
  guide: ['<song name> — e.g. play Dandelions']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const query = args.join(' ').trim();
  if (!query) return usages();

  const loading = await response.reply('🎵 Searching YouTube...');
  try {
    const { data } = await axios.get(`${global.api.nekolabs}/downloader/youtube/play/v1`, {
      params: { q: query }
    });

    if (!data?.success || !data?.result)
      return response.editText(loading, '❌ No result found.');

    const { metadata, downloadUrl } = data.result;
    const caption = `🎧 *${metadata.title}*\n📺 Channel: ${metadata.channel}\n🕒 Duration: ${metadata.duration}\n🔗 [Watch on YouTube](${metadata.url})`;

    await response.photo(metadata.cover, { caption, parse_mode: 'Markdown' });
    await response.audio(downloadUrl, { title: metadata.title, performer: metadata.channel });
    await response.delete(loading);
  } catch (e) {
    await response.editText(loading, `⚠️ Error: ${e.message}`);
  }
}
