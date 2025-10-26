import axios from 'axios';

export const meta = {
  name: 'art',
  version: '1.0.0',
  aliases: ['arts', 'randomart', 'artwork'],
  description: 'Send a random artwork (public domain) from the Art Institute of Chicago',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 3,
  guide: []
};

const IIIF_BASE = 'https://www.artic.edu/iiif/2';
const BASE = 'https://api.artic.edu/api/v1/artworks';

const keyboard = (msgId) => ({ inline_keyboard: [[{ text: '🔁', callback_data: JSON.stringify({ command: 'art', messageId: msgId, args: ['refresh'] }) }]] });

async function fetchRandomArtwork() {
  const info = await axios.get(`${BASE}?limit=1`).then(r => r.data).catch(() => null);
  const total = info?.pagination?.total_pages ?? 1000;
  const max = Math.min(total, 5000);
  for (let i = 0; i < 5; i++) {
    const page = Math.floor(Math.random() * max) + 1;
    const res = await axios.get(`${BASE}?page=${page}&limit=1&fields=id,title,artist_display,date_display,image_id`).then(r => r.data).catch(() => null);
    const art = res?.data?.[0];
    if (art?.image_id) return {
      title: art.title || 'Untitled',
      artist: art.artist_display || 'Unknown',
      date: art.date_display || 'Unknown date',
      imageUrl: `${IIIF_BASE}/${art.image_id}/full/843,/0/default.jpg`
    };
  }
  return null;
}

export async function onStart({ bot, msg, args, response, usages }) {
  const loading = await response.reply('🖼️ Finding a random artwork for you...', { parse_mode: 'Markdown' });
  const safeDel = async (m) => { try { await response.delete(m); } catch (e) {} };

  try {
    const art = await fetchRandomArtwork();
    if (!art) {
      await safeDel(loading);
      return response.reply("❌ Sorry — couldn't find a random artwork right now. Try again in a bit.");
    }

    const caption = `🖼️ *${art.title}*\n👤 ${art.artist}\n📅 ${art.date}`;
    const sent = await response.photo(art.imageUrl, { caption, parse_mode: 'Markdown', reply_markup: keyboard(null) });

    try { await response.editMarkup(sent, keyboard(sent.message_id)); } catch (e) { console.error('Failed to update keyboard:', e?.message || e); }
    try { await safeDel(loading); } catch (e) {}
  } catch (error) {
    await safeDel(loading);
    const errText = error?.response?.status ? `⚠️ API error: received status ${error.response.status}` : `⚠️ An error occurred: ${error?.message || 'Unknown error'}`;
    await response.reply(errText);
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== 'art') return;
    const msg = callbackQuery.message;
    if (!payload.messageId || msg.message_id !== payload.messageId) return;

    const art = await fetchRandomArtwork();
    if (!art) return void (await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching artwork.' }));

    const caption = `🖼️ *${art.title}*\n👤 ${art.artist}\n📅 ${art.date}`;
    await response.editMedia(
      { chatId: msg.chat.id, messageId: payload.messageId },
      { type: 'photo', media: art.imageUrl, caption, parse_mode: 'Markdown' },
      { reply_markup: keyboard(payload.messageId) }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in art callback:', err?.message || err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' }); } catch (_) {}
  }
}
