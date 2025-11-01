import axios from 'axios';

export const meta = {
  name: 'sing',
  version: '1.0.0',
  aliases: [],
  description: 'Search and download YouTube audio',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Media',
  type: 'anyone',
  cooldown: 3,
  guide: ['<query> or +<YouTube link>']
};

function isValidYouTubeUrl(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return pattern.test(url);
}

async function downloadAndSendAudio(response, videoUrl, listMessageId) {
  const loading = await response.reply('📥 *Downloading audio...*', { parse_mode: 'Markdown' });

  try {
    const { data: downloadData } = await axios.get(`${global.api.nekolabs}/downloader/youtube/v1`, {
      params: {
        url: videoUrl,
        format: 'mp3'
      }
    });

    if (!downloadData.success || !downloadData.result.downloadUrl) {
      return response.editText(loading, '⚠️ Failed to get download link.', { parse_mode: 'Markdown' });
    }

    await response.editText(loading, '📤 *Sending audio...*', { parse_mode: 'Markdown' });
    await response.audio(downloadData.result.downloadUrl, { caption: downloadData.result.title });
    await response.delete(loading.message_id);
    if (listMessageId) {
      await response.delete(listMessageId);
    }

  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) return usages();

  const firstArg = args[0];
  if (firstArg.startsWith('+') && isValidYouTubeUrl(firstArg.slice(1))) {
    const videoUrl = firstArg.slice(1);
    return await downloadAndSendAudio(response, videoUrl);
  } else if (isValidYouTubeUrl(firstArg)) {
    return response.reply('ℹ️ To download from link, please add "+" before the link. Example: +https://www.youtube.com/watch?v=...', { parse_mode: 'Markdown' });
  }

  const query = args.join(' ');
  const loading = await response.reply('🔍 *Searching for audio...*', { parse_mode: 'Markdown' });

  try {
    const { data: searchData } = await axios.get(`${global.api.nekolabs}/discovery/youtube/search`, {
      params: { q: query }
    });

    if (!searchData.success || !searchData.result || !searchData.result.length) {
      return response.editText(loading, '⚠️ No audio found.', { parse_mode: 'Markdown' });
    }

    const results = searchData.result.slice(0, 5);
    let listText = '🎵 *Search Results:*\n\n';
    results.forEach((video, index) => {
      listText += `${index + 1}. **${video.title}**\n🔹 Channel: ${video.channel}\n⏱️ Duration: ${video.duration}\n🔗 ${video.url}\n\n`;
    });
    listText += 'Reply with a number to download the audio (e.g., 1).';

    const listMessage = await response.editText(loading, listText, { parse_mode: 'Markdown' });

    global.chaldea.replies.set(listMessage.message_id, {
      meta: { name: meta.name },
      results
    });

  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}

export async function onReply({ bot, response, msg, args, data }) {
  args = args || (msg.text ? msg.text.trim().split(/\s+/) : []);

  if (args.length === 0) {
    return response.reply('⚠️ Please reply with a number.', { parse_mode: 'Markdown' });
  }

  const selected = parseInt(args[0], 10);
  if (isNaN(selected) || selected < 1 || selected > data.results.length) {
    return response.reply('⚠️ Invalid selection. Reply with a valid number.', { parse_mode: 'Markdown' });
  }

  const video = data.results[selected - 1];
  await downloadAndSendAudio(response, video.url, msg.reply_to_message.message_id);

  // Clean up reply data
  global.chaldea.replies.delete(msg.reply_to_message.message_id);
}