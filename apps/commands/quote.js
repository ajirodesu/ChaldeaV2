import axios from 'axios';

export const meta = {
  name: 'quote',
  version: '1.0.0',
  aliases: ['inspire', 'quotes'],
  description: 'Get a random inspirational quote from DummyJSON',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

const API = 'https://dummyjson.com/quotes/random';

// helper: build keyboard with refresh button (retains messageId)
const makeKeyboard = (messageId) => [[
  {
    text: '🔁',
    callback_data: JSON.stringify({ command: 'quote', messageId, args: ['refresh'] })
  }
]];

async function fetchQuote() {
  const { data } = await axios.get(API, { headers: { Accept: 'application/json' } });
  return data ?? null;
}

export async function onStart({ response }) {
  const loading = await response.reply('💭 *Fetching an inspirational quote...*', { parse_mode: 'Markdown' });

  try {
    const data = await fetchQuote();
    const quote = data?.quote;
    const author = data?.author;

    if (!quote || !author) throw new Error('No quote returned');

    const text = `📜 *Quote of the Moment:*\n\n_"${quote}"_\n\n— *${author}*`;

    // use real message id immediately so button references the correct message
    await response.editText(loading, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: makeKeyboard(loading.message_id) }
    });
  } catch (err) {
    // fallback quote on error
    const fallbackQuote = "Life is what happens when you're busy making other plans.";
    const fallbackAuthor = "John Lennon";
    await response.editText(
      loading,
      `⚠️ Failed to fetch quote. Here's a fallback:\n\n_"${fallbackQuote}"_\n\n— *${fallbackAuthor}*`,
      { parse_mode: 'Markdown' }
    );
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== 'quote') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const data = await fetchQuote();
    const quote = data?.quote;
    const author = data?.author;

    if (!quote || !author) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching quote.' });
      return;
    }

    const text = `📜 *Quote of the Moment:*\n\n_"${quote}"_\n\n— *${author}*`;

    await response.editText(
      { chatId: callbackQuery.message.chat.id, messageId: payload.messageId },
      text,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: makeKeyboard(payload.messageId) } }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in quote callback:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr?.message || innerErr);
    }
  }
}
