import axios from 'axios';

export const meta = {
  name: 'shoti',
  version: '1.0.0',
  aliases: ['shoti-random', 'shotirandom'],
  description: 'Fetch a random Shoti item (video) and send it with metadata.',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Random',
  type: 'anyone',
  cooldown: 4,
  guide: ['No args required']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const loading = await response.reply('🔎 *Fetching random Shoti...*', { parse_mode: 'Markdown' });

  try {
    // API endpoint provided by you
    const apiUrl = `${global.api.jonell}/api//shoti?fbclid=IwY2xjawN6tPdleHRuA2FlbQIxMQBzcnRjBmFwcF9pZAwzNTA2ODU1MzE3MjgAAR60SQ6DJyTXKyiQqVfEUOWpi0Kbrwoz2ndU1TRvg19c11vKqloh2JtrdbOOXA_aem_oD4K7p3JVF46BJ0NtztYSQ`;

    const { data } = await axios.get(apiUrl, { timeout: 30000 });

    // Expected JSON shape (example you provided):
    // { username, description, region, thumbnail, downloadUrl }
    if (!data) {
      await response.editText(loading, '⚠️ No data returned from Shoti API.', { parse_mode: 'Markdown' });
      return;
    }

    const username = data.username || 'Unknown';
    const description = data.description || '';
    const region = data.region ? `Region: ${data.region}` : '';
    const thumb = data.thumbnail || null;
    const videoUrl = data.downloadUrl || data.downloadurl || data.video || null;

    const captionParts = [
      `👤 *${username}*`,
      description ? `\n\n${description}` : '',
      region ? `\n\n${region}` : ''
    ];
    const caption = captionParts.join('').trim();

    if (videoUrl) {
      // Try sending the video by remote URL
      try {
        await response.video(videoUrl, { caption: caption || '🔗 Video', parse_mode: 'Markdown' });

        // Optionally send thumbnail first if available (non-blocking)
        // but avoid cluttering chat — only send thumbnail if no caption or user prefers it.
        await response.delete(loading);
        return;
      } catch (sendErr) {
        // Sending remote video failed — fall back to sending link + thumbnail
        // continue to fallback below
        // (do not return; handle fallback)
      }
    }

    // Fallback: if thumbnail exists, send it with caption and the download link
    if (thumb || videoUrl) {
      if (thumb) {
        await response.photo(thumb, {
          caption: `${caption}\n\n🔗 ${videoUrl || 'No download link available'}`,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        });
      } else {
        // No thumb, just edit loading to show link and metadata
        await response.editText(
          loading,
          `${caption}\n\n🔗 ${videoUrl || 'No download link available'}`,
          { parse_mode: 'Markdown', disable_web_page_preview: false }
        );
        return;
      }

      await response.delete(loading);
      return;
    }

    // If nothing usable returned
    await response.editText(loading, '⚠️ Received unexpected response from Shoti API.', { parse_mode: 'Markdown' });

  } catch (err) {
    const errMsg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
    await response.editText(loading, `⚠️ Error fetching Shoti: ${errMsg}`, { parse_mode: 'Markdown' });
  }
}
