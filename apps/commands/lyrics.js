import axios from 'axios';

export const meta = {
  name: 'lyrics',
  version: '1.0.0',
  aliases: ['lyric', 'songlyrics'],
  description: 'Fetch song lyrics using the Popcat lyrics API',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'media',
  type: 'anyone',
  cooldown: 5,
  guide: ['<song name> - Get the lyrics for the given song (e.g. /lyrics never gonna give you up)']
};

/** Split long text into chunks safe for Telegram messages */
function splitChunks(text, size = 3500) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

/** Escape text for safe HTML usage in Telegram messages */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) return await usages();

  const songQuery = args.join(' ');
  // Use response.reply for the loading message as requested
  const loadingMsg = await response.reply(`🎵 *Fetching lyrics for:* _${songQuery}_`, { parse_mode: 'Markdown' });

  try {
    const res = await axios.get('https://api.popcat.xyz/v2/lyrics', {
      params: { song: songQuery }
    });

    const data = res.data;
    if (!data) {
      await response.editText(loadingMsg, '⚠️ No response from lyrics API.', { parse_mode: 'Markdown' });
      return;
    }

    if (data.error) {
      const errMsg = data.message?.error || data.message || 'Unknown error from lyrics API.';
      await response.editText(loadingMsg, `⚠️ Failed to fetch lyrics: ${errMsg}`, { parse_mode: 'Markdown' });
      return;
    }

    const message = data.message || {};
    const title = message.title || message.name || songQuery;
    const author = message.author || message.artist || message.singer || 'Unknown';
    const lyrics = message.lyrics || message.lyric || message.lyrics_body || '';

    if (!lyrics) {
      await response.editText(loadingMsg, '⚠️ Lyrics not found for that song.', { parse_mode: 'Markdown' });
      return;
    }

    // Edit the loading message to show success (still using bot.editMessageText)
    await response.editText(loadingMsg, `💬 *Lyrics found:*\n*${title}* — _${author}_`, { parse_mode: 'Markdown' });

    // Split lyrics into chunks and send each chunk using response.reply (as requested)
    const chunks = splitChunks(lyrics, 3500);
    for (let i = 0; i < chunks.length; i++) {
      const header = i === 0 ? `🎵 <b>${escapeHtml(title)}</b> — <i>${escapeHtml(author)}</i>\n\n` : '';
      const text = header + `<pre>${escapeHtml(chunks[i])}</pre>`;
      // Use response.reply for each chunk so messages follow the same reply-style flow
      await response.reply(text, { parse_mode: 'HTML' });
    }
  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch lyrics: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
