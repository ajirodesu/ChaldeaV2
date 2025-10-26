import axios from 'axios';

export const meta = {
  name: 'advice',
  version: '1.0.0',
  aliases: ['tips'],
  description: 'Get a random piece of advice from adviceslip.com',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

const fetchAdvice = async () => {
  const r = await axios.get('https://api.adviceslip.com/advice', { headers: { Accept: 'application/json' } });
  return r.data?.slip?.advice ?? null;
};

const keyboard = (msgId) => ({
  inline_keyboard: [
    [
      {
        text: '🔁',
        callback_data: JSON.stringify({ command: 'advice', messageId: msgId, args: ['refresh'] })
      }
    ]
  ]
});

export async function onStart({ bot, msg, chatId, response }) {
  const loading = await response.reply('💬 *Fetching a piece of advice...*', { parse_mode: 'Markdown' });
  try {
    const advice = await fetchAdvice();
    if (!advice) return response.editText(loading, '⚠️ Could not retrieve advice from the API.', { parse_mode: 'Markdown' });

    await response.editText(loading, `💡 *Random Advice:*\n\n_${advice}_`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard(loading.message_id)
    });
  } catch (e) {
    await response.editText(loading, `⚠️ Failed to fetch advice: ${e.message}`, { parse_mode: 'Markdown' });
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== 'advice') return;
    const msg = callbackQuery.message;
    if (!payload.messageId || msg.message_id !== payload.messageId) return;

    const advice = await fetchAdvice();
    if (!advice) return bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching advice.' });

    await response.editText({ chatId: msg.chat.id, messageId: payload.messageId }, `💡 *Random Advice:*\n\n_${advice}_`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard(payload.messageId)
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in advice callback:', err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' }); } catch (_) {}
  }
}
