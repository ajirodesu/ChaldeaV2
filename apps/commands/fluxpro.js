import axios from 'axios';

export const meta = {
  name: 'fluxpro',
  version: '1.1.0',
  aliases: ['flux', 'flux-pro'],
  description: 'Generate images using Nekolabs Flux Pro endpoint (supports prompt + ratio).',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 5,
  guide: ['<prompt or reply to image>', '--ratio=1:1', '-r 1:1', '--raw (return JSON)']
};

function extractRatioAndPrompt(args) {
  let ratio = '1:1';
  let raw = false;
  const cleaned = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--raw') {
      raw = true;
      continue;
    }
    // --ratio=1:1 or -r=1:1 or ratio:1:1
    const mEq = a.match(/^(--ratio=|-r=|ratio:)(.+)$/i);
    if (mEq) {
      ratio = mEq[2];
      continue;
    }
    // --ratio 1:1 or -r 1:1
    if ((a === '--ratio' || a === '-r') && args[i + 1]) {
      ratio = args[i + 1];
      i++; // skip next
      continue;
    }
    cleaned.push(a);
  }

  return { prompt: cleaned.join(' ').trim(), ratio, raw };
}

export async function onStart({ bot, msg, args, response, usages }) {
  // parse ratio and flags from args
  const { prompt: parsedPrompt, ratio, raw } = extractRatioAndPrompt(args);

  // if no prompt and no reply, show usages
  if (!parsedPrompt && !msg.reply_to_message) return usages();

  let imageUrl = '';
  if (msg.reply_to_message?.photo) {
    try {
      const fileId = msg.reply_to_message.photo.slice(-1)[0].file_id;
      const file = await bot.getFile(fileId);
      imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    } catch (err) {
      // non-fatal: warn user but continue
      await response.reply('⚠️ Could not fetch replied image. Proceeding without the image.');
    }
  }

  const prompt = parsedPrompt || (imageUrl ? 'Describe this image.' : '');
  const loading = await response.reply('🤖 *Generating with Flux Pro...*', { parse_mode: 'Markdown' });

  try {
    const payload = {
      prompt,
      ratio,
      imageUrl: imageUrl || undefined,
      sessionId: `flux-pro-${Date.now()}`
    };

    const { data } = await axios.post(`${global.api.nekolabs}/ai/flux/pro`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });

    if (!data) {
      return await response.editText(loading, '⚠️ No response from Flux Pro.', { parse_mode: 'Markdown' });
    }

    if (raw) {
      // send raw JSON as a file
      const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2));
      await response.editText(loading, '✅ Generated — sending raw JSON result...', { parse_mode: 'Markdown' });
      await response.document(jsonBuffer, { filename: 'fluxpro-result.json', contentType: 'application/json' });
      try { await response.delete(loading); } catch (e) {}
      return;
    }

    if (!data.success || !data.result) {
      const errMsg = data.error || 'Flux Pro returned an unexpected result.';
      return await response.editText(loading, `⚠️ Error: ${errMsg}`, { parse_mode: 'Markdown' });
    }

    const resultUrl = data.result;
    const captionParts = [`*Flux Pro Result*`, `Prompt: ${prompt}`, `Ratio: ${ratio}`];
    if (data.timestamp) captionParts.push(`Time: ${data.timestamp}`);
    if (data.responseTime) captionParts.push(`ResponseTime: ${data.responseTime}`);
    const caption = captionParts.join('\n');

    await response.editText(loading, '✅ Generated — sending image...', { parse_mode: 'Markdown' });

    // send the resulting image by URL (Telegram accepts remote URL)
    await response.photo(resultUrl, { caption, parse_mode: 'Markdown' });

    // cleanup loading message
    try { await response.delete(loading); } catch (e) { /* fallback silently */ }
  } catch (err) {
    await response.editText(loading, `⚠️ Request failed: ${err.message}`, { parse_mode: 'Markdown' });
  }
}
