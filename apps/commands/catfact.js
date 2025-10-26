import axios from 'axios';

export const meta = {
  name: 'catfact',
  version: '1.0.0',
  aliases: ['catfacts'],
  description: 'Get a random cat fact from catfact.ninja',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

const keyboard = (msgId) => ({
  inline_keyboard: [[{
    text: '🔁',
    callback_data: JSON.stringify({ command: 'catfact', messageId: msgId, args: ['refresh'] })
  }]]
});

async function fetchFact() {
  const { data } = await axios.get('https://catfact.ninja/fact', { headers: { Accept: 'application/json' } });
  return data?.fact ?? null;
}

export async function onStart({ bot, msg, args, response, usages }) {
  const loading = await response.reply('🐾 *Fetching a cat fact...*', { parse_mode: 'Markdown' });
  try {
    const fact = await fetchFact();
    if (!fact) return await response.editText(loading, '⚠️ Could not retrieve a cat fact from the API.', { parse_mode: 'Markdown' });

    await response.editText(loading, `✨ *Cat Fact:*\n\n_${fact}_`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard(loading.message_id)
    });
  } catch (err) {
    await response.editText(loading, `⚠️ Failed to fetch cat fact: ${err.message}`, { parse_mode: 'Markdown' });
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== 'catfact') return;
    const msg = callbackQuery.message;
    if (!payload.messageId || msg.message_id !== payload.messageId) return;

    const fact = await fetchFact();
    if (!fact) return void (await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching cat fact.' }));

    await response.editText({ chatId: msg.chat.id, messageId: payload.messageId }, `✨ *Cat Fact:*\n\n_${fact}_`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard(payload.messageId)
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in catfact callback:', err?.message || err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' }); } catch (_) {}
  }
}
