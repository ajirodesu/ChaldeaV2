import axios from 'axios';

export const meta = {
  name: "joke",
  version: "1.0.0",
  aliases: ["telljoke", "randomjoke"],
  description: "Get a random joke to make you laugh!",
  author: "JokeBotDev",
  prefix: "both",
  category: "random",
  type: "anyone",
  cooldown: 5,
  guide: ""
};

const API = 'https://official-joke-api.appspot.com/random_joke';

// Build inline keyboard with a refresh button that carries the original messageId
const makeKeyboard = (messageId) => [[{
  text: '🔁',
  callback_data: JSON.stringify({ command: 'joke', messageId, args: ['refresh'] })
}]];

async function fetchJoke() {
  const { data } = await axios.get(API);
  const { setup, punchline } = data || {};
  return setup && punchline ? `${setup}\n\n${punchline}` : null;
}

export async function onStart({ response }) {
  const loadingMsg = await response.reply('😂 *Fetching a random joke...*', { parse_mode: 'Markdown' });
  try {
    const joke = await fetchJoke();
    if (!joke) throw new Error('No joke from API');

    // Use the real message_id immediately so the button points to the correct message
    await response.editText(loadingMsg, `🤣 *Here's a joke:*\n\n_${joke}_`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: makeKeyboard(loadingMsg.message_id) }
    });
  } catch (err) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch joke: ${err.message}`, { parse_mode: 'Markdown' });
  }
}

export async function onCallback({ bot, callbackQuery, payload }) {
  try {
    if (payload?.command !== 'joke') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const joke = await fetchJoke();
    if (!joke) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching joke.' });
      return;
    }

    await bot.editMessageText(`🤣 *Here's a joke:*\n\n_${joke}_`, {
      chat_id: callbackQuery.message.chat.id,
      message_id: payload.messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: makeKeyboard(payload.messageId) }
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('joke callback error:', err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' }); }
    catch (e) { console.error('Failed to answer callback query:', e?.message); }
  }
}
