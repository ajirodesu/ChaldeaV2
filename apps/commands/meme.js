import axios from 'axios';

export const meta = {
  name: "meme",
  aliases: ["memes", "randommeme"],
  prefix: "both",
  version: "1.0.0",
  author: "ShawnDesu",
  description: "Sends a random meme.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "fun"
};

const API = "https://meme-api.com/gimme/memes";

// builds inline keyboard (preserves original gameMessageId key)
const makeKeyboard = (messageId) => [[{
  text: "🔁",
  callback_data: JSON.stringify({
    command: "meme",
    gameMessageId: messageId,
    args: ["refresh"]
  })
}]];

async function fetchMeme() {
  const { data } = await axios.get(API);
  return data || null;
}

export async function onStart({ response }) {
  try {
    const meme = await fetchMeme();
    if (!meme) throw new Error('No meme returned');

    // send photo with placeholder keyboard (null messageId)
    const sent = await response.photo(meme.url, {
      caption: meme.title || '',
      reply_markup: { inline_keyboard: makeKeyboard(null) }
    });

    // update keyboard with real message id
    try {
      await response.editMarkup(sent, { inline_keyboard: makeKeyboard(sent.message_id) });
    } catch (err) {
      console.error('Failed to update inline keyboard:', err?.message || err);
    }
  } catch (err) {
    console.error('Error fetching/sending meme:', err?.message || err);
    return response.reply("An error occurred while fetching the meme.");
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== "meme") return;
    if (!payload.gameMessageId || callbackQuery.message.message_id !== payload.gameMessageId) return;

    const meme = await fetchMeme();
    if (!meme) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Error fetching meme." });
      return;
    }

    // replace media while keeping the refresh button
    await response.editMedia(
      { chatId: callbackQuery.message.chat.id, messageId: payload.gameMessageId },
      { type: "photo", media: meme.url, caption: meme.title || '' },
      { reply_markup: { inline_keyboard: makeKeyboard(payload.gameMessageId) } }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in meme callback:', err?.message || err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." });
    } catch (e) {
      console.error('Failed to answer callback query:', e?.message || e);
    }
  }
}
