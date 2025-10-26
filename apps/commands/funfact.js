import axios from 'axios';

export const meta = {
  name: "funfact",
  version: "1.0.0",
  aliases: ["fact", "randomfact"],
  description: "Get a random fun fact to brighten your day!",
  author: "FunFactBotDev",
  prefix: "both",
  category: "random",
  type: "anyone",
  cooldown: 5,
  guide: ""
};

const API = 'https://uselessfacts.jsph.pl/random.json?language=en';

// Small helper to build the inline keyboard (keeps button feature intact)
const makeKeyboard = (messageId) => [
  [{
    text: '🔁',
    callback_data: JSON.stringify({
      command: 'funfact',
      messageId,
      args: ['refresh']
    })
  }]
];

// Fetch a fun fact from the API (returns string or throws)
async function fetchFunFact() {
  const { data } = await axios.get(API);
  return data?.text ?? null;
}

// Command entry: reply a loading message, fetch a fact, then replace text with the fact + button
export async function onStart({ response }) {
  const loadingMsg = await response.reply('🧠 *Fetching a fun fact...*', { parse_mode: 'Markdown' });
  try {
    const fact = await fetchFunFact();
    if (!fact) throw new Error('No fact from API');

    // Use the real message_id so the button's callback_data references the correct message
    const keyboard = makeKeyboard(loadingMsg.message_id);
    await response.editText(loadingMsg, `💡 *Did you know?*\n\n_${fact}_`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (err) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch fun fact: ${err.message}`, { parse_mode: 'Markdown' });
  }
}

// Callback handler for the refresh button
export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== 'funfact') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const fact = await fetchFunFact();
    if (!fact) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching fun fact.' });
      return;
    }

    const keyboard = makeKeyboard(payload.messageId);
    await response.editText(
      { chatId: callbackQuery.message.chat.id, messageId: payload.messageId },
      `💡 *Did you know?*\n\n_${fact}_`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('funfact callback error:', err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' }); }
    catch (e) { console.error('Failed to answer callback query:', e?.message); }
  }
}
