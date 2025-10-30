import https from 'https';
import http from 'http';

/* QR command (no npm libs) */
export const meta = {
  name: 'qr',
  version: '1.0.0-no-deps',
  aliases: ['qrcode'],
  description: 'Generate a QR code (no npm packages). Reply to a text to use it, or pass text as args.',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 2,
  guide: [
    '<text>',
    '--size=512 --ecc=H --color=#000000 --bg=#ffffff --margin=1 <text>',
    'Reply to a text message with qr to generate for that text'
  ]
};

/* Helpers */
function safe(v) {
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}
function escapeMarkdown(text = '') {
  return String(text).replace(/([_*`[\]])/g, '\\$1');
}

/* Minimal flag parser (supports --size, --ecc, --color, --bg, --margin) */
function parseFlags(argsArray = []) {
  const args = argsArray.slice();
  const flags = {
    size: 512,
    ecc: 'M',
    color: '#000000',
    bg: '#ffffff',
    margin: 1
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a) continue;

    // --key=value
    const longEq = a.match(/^--(size|ecc|color|bg|margin)=(.+)$/i);
    if (longEq) {
      flags[longEq[1].toLowerCase()] = longEq[2];
      args[i] = null;
      continue;
    }

    // --key value
    const long = a.match(/^--(size|ecc|color|bg|margin)$/i);
    if (long) {
      const key = long[1].toLowerCase();
      const val = args[i + 1];
      if (val) {
        flags[key] = val;
        args[i] = null;
        args[i + 1] = null;
        i++;
      }
      continue;
    }

    // short -s value
    const short = a.match(/^-(s|e|c|b|m)$/i);
    if (short) {
      const map = { s: 'size', e: 'ecc', c: 'color', b: 'bg', m: 'margin' };
      const key = map[short[1].toLowerCase()];
      const val = args[i + 1];
      if (val) {
        flags[key] = val;
        args[i] = null;
        args[i + 1] = null;
        i++;
      }
      continue;
    }

    // -s=300
    const shortEq = a.match(/^-(s|e|c|b|m)=(.+)$/i);
    if (shortEq) {
      const map = { s: 'size', e: 'ecc', c: 'color', b: 'bg', m: 'margin' };
      flags[map[shortEq[1].toLowerCase()]] = shortEq[2];
      args[i] = null;
      continue;
    }
  }

  const leftover = args.filter(Boolean).join(' ').trim();

  // Normalize
  flags.size = Math.max(64, Math.min(2000, Number(flags.size) || 512));
  flags.ecc = String(flags.ecc || 'M').toUpperCase();
  if (!/^[LMQH]$/.test(flags.ecc)) flags.ecc = 'M';
  // Normalize hex colors to 6 hex without #
  const normHex = (h) => {
    if (!h) return '000000';
    let s = String(h).trim();
    if (s.startsWith('#')) s = s.slice(1);
    s = s.replace(/[^A-Fa-f0-9]/g, '');
    if (s.length === 3) s = s.split('').map(c => c + c).join('');
    if (s.length !== 6) return '000000';
    return s.toUpperCase();
  };
  flags.color = `#${normHex(flags.color)}`;
  flags.bg = `#${normHex(flags.bg)}`;
  flags.margin = Math.max(0, Number(flags.margin) || 1);

  return { flags, text: leftover };
}

/* Fetch an image URL into a Buffer using only built-in http/https */
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    try {
      const client = url.startsWith('https://') ? https : http;
      const req = client.get(url, (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          // follow redirect
          resolve(fetchBuffer(res.headers.location));
          return;
        }
        if (status !== 200) {
          reject(new Error(`HTTP ${status} when fetching QR image`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', (err) => reject(err));
      });
      req.on('error', (err) => reject(err));
      // timeout (avoid hanging)
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout fetching QR image'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

/* Build api.qrserver.com URL with parameters */
function buildQrUrl({ text, size, ecc, color, bg, margin }) {
  // api.qrserver.com accepts: size=WxH, data=..., ecc=H, color=R,G,B? or hex?
  // We'll use the documented params: size, data, ecc, color, bgcolor, margin
  // color/bg expects R,G,B or hex without '#'. api accepts hex without '#'.
  const sizeParam = `${size}x${size}`;
  const dataParam = encodeURIComponent(String(text));
  // color/bg: remove leading '#'
  const strip = (h) => (h && h.startsWith('#') ? h.slice(1) : h);
  const colorParam = strip(color);
  const bgParam = strip(bg);
  // margin map: use 'margin' param
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${sizeParam}&data=${dataParam}&ecc=${ecc}&color=${colorParam}&bgcolor=${bgParam}&margin=${margin}`;
  return url;
}

/* Main command */
export async function onStart({ bot, msg, args, response, usages }) {
  // Use replied text if user replied and didn't provide args
  const parsed = parseFlags(args || []);
  let { flags, text } = parsed;

  if (!text && msg.reply_to_message && (msg.reply_to_message.text || msg.reply_to_message.caption)) {
    text = msg.reply_to_message.text || msg.reply_to_message.caption;
  }

  if (!text) return usages();

  const loading = await response.reply('🔗 *Generating QR (no external libs)...*', { parse_mode: 'Markdown' });

  try {
    // Build QR image URL
    const qrUrl = buildQrUrl({
      text,
      size: flags.size,
      ecc: flags.ecc,
      color: flags.color,
      bg: flags.bg,
      margin: flags.margin
    });

    // Fetch into buffer (so Telegram won't need to fetch remote URL)
    const buffer = await fetchBuffer(qrUrl);

    // Build caption
    const captionLines = [
      `*QR code generated*`,
      '',
      `*Text:* ${escapeMarkdown(text.length > 200 ? text.slice(0, 197) + '...' : text)}`,
      `*Size:* ${flags.size}px`,
      `*ECC:* ${flags.ecc}`,
      `*Colors:* ${escapeMarkdown(flags.color)} on ${escapeMarkdown(flags.bg)}`,
      `*Margin:* ${flags.margin}`,
      '',
      '_Tip: scan with your phone camera or QR scanner._'
    ];
    const caption = captionLines.join('\n');

    // Send as photo (Telegram will compress for preview) — send buffer directly
    try {
      await response.photo(buffer, { caption, parse_mode: 'Markdown' });
    } catch (photoErr) {
      // If sending as photo fails, attempt to send as document (preserves bytes)
      try {
        await response.document(buffer, { caption, parse_mode: 'Markdown', filename: `qr.png` });
      } catch (docErr) {
        // fallback to text-only
        await response.editText(loading, `⚠️ Could not send QR image: ${escapeMarkdown(String(docErr?.message || docErr))}`, { parse_mode: 'Markdown' });
        return;
      }
    }

    // delete loading if possible
    try { await response.delete(loading); } catch (e) {}
  } catch (err) {
    console.error('qr (no-deps) error:', err);
    await response.editText(loading, `⚠️ Error generating QR: ${escapeMarkdown(String(err?.message || err))}`, { parse_mode: 'Markdown' });
  }
}
