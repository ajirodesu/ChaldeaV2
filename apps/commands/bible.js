import axios from 'axios';

export const meta = {
  name: 'bible',
  version: '1.0.1',
  aliases: ['verse', 'scripture'],
  description: 'Fetch Bible passages (e.g. "John 3:16", "Genesis 1"). Use --version or -v to choose translation (default kjv). If no query is provided, returns a random verse.',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 2,
  guide: [
    'John 3:16',
    '"John 3:16-18"',
    '/--version=web John 3:16',
    'Reply to a message that contains a passage reference with bible',
    'No args: returns a random verse'
  ]
};

/* Helpers */
function escapeMarkdown(text = '') {
  // minimal escaping for Markdown (not MarkdownV2)
  return String(text).replace(/([_*`[\]])/g, '\\$1');
}

function parseFlags(argsArray = []) {
  const args = argsArray.slice();
  const flags = { version: 'kjv' }; // default
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a) continue;
    // --version=web
    const longEq = a.match(/^--version=(.+)$/i);
    if (longEq) {
      flags.version = longEq[1];
      args[i] = null;
      continue;
    }
    // --version web
    const long = a.match(/^--version$/i);
    if (long && args[i + 1]) {
      flags.version = args[i + 1];
      args[i] = null;
      args[i + 1] = null;
      i++;
      continue;
    }
    // -v web
    const short = a.match(/^-v$/i);
    if (short && args[i + 1]) {
      flags.version = args[i + 1];
      args[i] = null;
      args[i + 1] = null;
      i++;
      continue;
    }
    // -v=web
    const shortEq = a.match(/^-v=(.+)$/i);
    if (shortEq) {
      flags.version = shortEq[1];
      args[i] = null;
      continue;
    }
  }

  const leftover = args.filter(Boolean).join(' ').trim();
  return { flags, text: leftover };
}

/* Build Bible API URL (bible-api.com) */
function buildBibleApiUrl(passage, version = 'kjv') {
  // bible-api accepts: https://bible-api.com/{passage}?translation={version}
  // encode passage safely
  const enc = encodeURIComponent(passage);
  const v = encodeURIComponent(String(version || '').trim());
  return `https://bible-api.com/${enc}?translation=${v}`;
}

/* Build BibleGateway URL for convenience button */
function buildGatewayUrl(passage, version = 'KJV') {
  const enc = encodeURIComponent(passage);
  const v = encodeURIComponent((version || 'KJV').toUpperCase());
  return `https://www.biblegateway.com/passage/?search=${enc}&version=${v}`;
}

/* Fetch a random verse reference from labs.bible.org
   Returns a string like "John 3:16" on success, or null on failure.
*/
async function fetchRandomReference() {
  try {
    const resp = await axios.get('https://labs.bible.org/api/?passage=random&type=json', { timeout: 8000 });
    // resp.data is an array like [{bookname, chapter, verse, text}]
    const arr = resp.data;
    if (Array.isArray(arr) && arr.length > 0) {
      const item = arr[0];
      if (item && item.bookname && item.chapter != null && item.verse != null) {
        return `${item.bookname} ${item.chapter}:${item.verse}`;
      }
    }
    return null;
  } catch (e) {
    console.warn('fetchRandomReference failed:', e && e.message ? e.message : e);
    return null;
  }
}

/* Main command */
export async function onStart({ bot, msg, args, response, usages }) {
  // parse flags and leftover text
  const parsed = parseFlags(args || []);
  let { flags, text } = parsed;
  const translation = flags.version || 'kjv';

  // If user replied to a message containing passage text, prefer that if user didn't supply args
  if (!text && msg.reply_to_message && (msg.reply_to_message.text || msg.reply_to_message.caption)) {
    // use the replied text as the query (trim to safe length)
    text = (msg.reply_to_message.text || msg.reply_to_message.caption || '').trim();
  }

  // If still no text -> fetch random verse reference
  let usedRandom = false;
  if (!text) {
    const randomRef = await fetchRandomReference();
    if (randomRef) {
      text = randomRef;
      usedRandom = true;
    } else {
      // if random fetch failed, show usage
      return usages();
    }
  }

  const loadingLabel = usedRandom ? '📖 Fetching a random verse...' : `📖 Looking up: ${text}`;
  const loading = await response.reply(`${loadingLabel}  (_${escapeMarkdown(translation)}_)`, { parse_mode: 'Markdown' });

  try {
    // call bible-api
    const url = buildBibleApiUrl(text, translation);
    const { data } = await axios.get(url, { timeout: 10000 });

    // bible-api returns either: { reference, verses: [...], text, translation_id, translation_name }
    const reference = data.reference || `${text}`;
    const translationName = data.translation_name || (translation || 'KJV').toUpperCase();
    let passageText = '';

    if (data.text && typeof data.text === 'string') {
      // some endpoints give aggregated 'text'
      passageText = data.text.trim();
    } else if (Array.isArray(data.verses) && data.verses.length) {
      // build from verses array
      // join verses, but include verse numbers for clarity
      passageText = data.verses.map(v => `${v.verse}. ${v.text.trim()}`).join('\n');
    } else {
      // fallback to raw text if any
      passageText = String(data).trim();
    }

    // Compose message
    const headerPrefix = usedRandom ? '🎯 *Random verse*' : '*Bible passage*';
    const header = `${headerPrefix}: *${escapeMarkdown(reference)}* — _${escapeMarkdown(translationName)}_\n\n`;
    const body = escapeMarkdown(passageText);
    let message = header + body;

    // If message too long for Telegram (safety margin), send as .txt document
    // Telegram bot API message limit is ~4096 characters for sendMessage; keep a margin
    const TG_LIMIT = 3800;
    const gatewayUrl = buildGatewayUrl(reference, translationName);

    if (message.length <= TG_LIMIT) {
      // send nicely with inline button to open on BibleGateway
      const replyMarkup = {
        inline_keyboard: [
          [{ text: 'Open on Bible Gateway', url: gatewayUrl }],
          // allow user to fetch the same passage in another translation quickly
          [{ text: 'Show in ESV', callback_data: `bible__translate__${encodeURIComponent(reference)}__ESV` }]
        ]
      };

      await response.editText(loading, message, { parse_mode: 'Markdown', reply_markup: replyMarkup });
      return;
    } else {
      // too long -> send as text file
      const txtBuffer = Buffer.from(`${reference} — ${translationName}\n\n${passageText}`, 'utf-8');
      const filename = `${reference.replace(/[^a-zA-Z0-9_\- ]/g, '_') || 'passage'}.txt`;
      await response.document(txtBuffer, { caption: `📖 ${escapeMarkdown(reference)} — _${escapeMarkdown(translationName)}_`, parse_mode: 'Markdown', filename });
      try { await response.delete(loading); } catch (e) {}
      return;
    }
  } catch (err) {
    // handle known API errors
    const status = err?.response?.status;
    const body = err?.response?.data;
    console.error('bible command error:', err && (err.message || err));

    if (status === 404 || (body && body.error)) {
      await response.editText(loading, `⚠️ Passage not found: *${escapeMarkdown(text)}*.\n\nExamples of valid queries:\n• John 3:16\n• Genesis 1\n• Psalm 23:1-6\n\nTry a different reference or check spelling.`, { parse_mode: 'Markdown' });
      return;
    }

    await response.editText(loading, `⚠️ Error fetching passage: ${escapeMarkdown(String(err?.message || err))}\nYou can try again or use a different translation with --version.`, { parse_mode: 'Markdown' });
  }
}
