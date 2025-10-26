import axios from 'axios';

export const meta = {
  name: 'pollinations',
  version: '1.0.0',
  aliases: ['polli', 'pollimg', 'genimg'],
  description: 'Generate an image using Pollinations AI.',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 5,
  guide: ['<prompt>', 'reply to a text message with pollinations']
};

export async function onStart({ bot, msg, args, response, usages }) {
  // Accept prompt via command args or reply-to-text
  const promptFromArgs = args && args.length ? args.join(' ') : '';
  const promptFromReply = msg.reply_to_message?.text ?? '';
  const prompt = (promptFromArgs || promptFromReply).trim();

  if (!prompt) {
    // Show usage help if no prompt provided
    return await usages();
  }

  const loadingMsg = await response.reply(`🎨 *Generating image for:* _${prompt}_\n\n*Model:* turbo\nPlease wait...`, { parse_mode: 'Markdown' });

  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo`;

    const imageRes = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60_000
    });

    // Edit loading message to success
    await response.editText(loadingMsg, `✨ *Image generated for:* _${prompt}_`, { parse_mode: 'Markdown' });

    // Send generated image as photo
    await response.photo(Buffer.from(imageRes.data), { caption: `🎨 *Prompt:* ${prompt}`, parse_mode: 'Markdown' });

  } catch (error) {
    // Try to edit the loading message with the error; fallback to plain reply if edit fails
    const errText = `⚠️ Image generation failed${error?.message ? `: ${error.message}` : '.'}`;
    try {
      await response.editText(loadingMsg, errText, { parse_mode: 'Markdown' });
    } catch (e) {
      await response.reply(errText, { parse_mode: 'Markdown' });
    }
  }
}
