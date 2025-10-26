import axios from 'axios';

export const meta = {
  name: 'tempmail',
  version: '1.0.0',
  aliases: ['genmail', 'tempemail'],
  description: 'Generate a temporary email address using TempMail API',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'tools',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const loadingMsg = await response.reply('📬 *Generating a temporary email address...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.post('https://api.internal.temp-mail.io/api/v3/email/new', {}, {
      headers: { Accept: 'application/json' }
    });

    const email = res.data?.email;

    if (!email) {
      await response.editText(loadingMsg, '⚠️ Could not generate a temporary email address.', { parse_mode: 'Markdown' });
      return;
    }

    const text = `✉️ *Temporary Email Generated!*\n\n📧 *Email:* \`${email}\`\n\n⚠️ *Note:* This email address is temporary. Do not use it for important accounts.`;

    // Edit loading message to success message
    await response.editText(loadingMsg, '✅ *Temp email generated successfully!*', { parse_mode: 'Markdown' });

    // Send email info
    await response.reply(text, { parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to generate temp email: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
