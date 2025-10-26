import axios from 'axios';

export const meta = {
  name: 'dog',
  version: '1.0.0',
  aliases: ['dogpic', 'dogimage'],
  description: 'Send a random dog image from dog.ceo',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

const fetchDog = async () => {
  const { data } = await axios.get('https://dog.ceo/api/breeds/image/random', { headers: { Accept: 'application/json' } });
  return data?.message ?? null;
};

const keyboard = (msgId) => ({ inline_keyboard: [[{ text: '🔁', callback_data: JSON.stringify({ command: 'dog', messageId: msgId, args: ['refresh'] }) }]] });

export async function onStart({ bot, msg, chatId, response }) {
  const loading = await response.reply('🐶 *Fetching a random dog image...*', { parse_mode: 'Markdown' });
  try {
    const imageUrl = await fetchDog();
    if (!imageUrl) return await response.editText(loading, '⚠️ Could not retrieve a dog image from the API.', { parse_mode: 'Markdown' });

    const sent = await response.photo(imageUrl, {
      caption: '🐕 *Random Dog Image*',
      parse_mode: 'Markdown',
      reply_markup: keyboard(null)
    });

    try { await response.editMarkup(sent, keyboard(sent.message_id)); } catch (e) { console.error('editMarkup error:', e?.message || e); }
    await response.delete(loading);
  } catch (err) {
    await response.editText(loading, `⚠️ Failed to fetch dog image: ${err?.message || err}`, { parse_mode: 'Markdown' });
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== 'dog') return;
    const msg = callbackQuery.message;
    if (!payload.messageId || msg.message_id !== payload.messageId) return;

    const imageUrl = await fetchDog();
    if (!imageUrl) return void (await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching dog image.' }));

    await response.editMedia(
      { chatId: msg.chat.id, messageId: payload.messageId },
      { type: 'photo', media: imageUrl, caption: '🐕 *Random Dog Image*', parse_mode: 'Markdown' },
      { reply_markup: keyboard(payload.messageId) }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in dog callback:', err?.message || err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' }); } catch (_) {}
  }
}