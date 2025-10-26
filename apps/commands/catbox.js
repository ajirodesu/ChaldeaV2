import axios from 'axios';
import FormData from 'form-data';

export const meta = {
  name: 'catbox',
  version: '1.0.0',
  aliases: ['catboxupload', 'uploadfile', 'catboxuploader'],
  description: 'Upload a file or image to Catbox.moe',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'tools',
  type: 'anyone',
  cooldown: 5,
  guide: ['<file_link> - Upload a file to Catbox.moe using a direct URL']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const fileLink = args[0];
  if (!fileLink)
    return response.reply('⚠️ *Please provide a valid file link to upload.*', {
      parse_mode: 'Markdown'
    });

  const loadingMsg = await response.reply('📤 *Uploading your file to Catbox.moe...*', {
    parse_mode: 'Markdown'
  });

  try {
    const form = new FormData();
    form.append('reqtype', 'urlupload');
    form.append('url', fileLink);

    const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders()
    });

    if (!data.startsWith('http')) {
      await response.editText(loadingMsg, '❌ *Upload failed. Please try again.*', { parse_mode: 'Markdown' });
      return;
    }

    await response.editText(loadingMsg, '✅ *Upload successful!*', { parse_mode: 'Markdown' });

    await response.reply(`📦 *File Uploaded to Catbox.moe*\n\n🔗 *URL:* ${data}`, { parse_mode: 'Markdown' });
  } catch (error) {
    await response.editText(loadingMsg, `⚠️ *Failed to upload file:*\n${error.response?.data?.error || error.message}`, { parse_mode: 'Markdown' });
  }
}
