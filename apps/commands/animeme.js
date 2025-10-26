import axios from 'axios';

export const meta = {
  name: "animeme",
  aliases: ["animememe"],
  prefix: "both",
  version: "1.0.0",
  author: "ShawnDesu",
  description: "Sends a random anime meme.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "anime"
};

const fetchAnimeme = async () => {
  const { data } = await axios.get("https://meme-api.com/gimme/animemes");
  return data || null;
};

const keyboard = (msgId) => ({
  inline_keyboard: [
    [
      {
        text: "🔁",
        callback_data: JSON.stringify({
          command: "animeme",
          gameMessageId: msgId,
          args: ["refresh"]
        })
      }
    ]
  ]
});

export async function onStart({ bot, msg, chatId, response }) {
  try {
    const meme = await fetchAnimeme();
    if (!meme) return response.reply("An error occurred while fetching the anime meme.");

    // send photo with placeholder keyboard, then update keyboard with actual message id
    const sent = await response.photo(meme.url, {
      caption: meme.title,
      reply_markup: keyboard(null)
    });

    try {
      await response.editMarkup(sent, keyboard(sent.message_id));
    } catch (err) {
      console.error("Failed to update inline keyboard:", err?.message || err);
    }
  } catch (err) {
    console.error("Error fetching anime meme:", err);
    return response.reply("An error occurred while fetching the anime meme.");
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== "animeme") return;
    const msg = callbackQuery.message;
    if (!payload.gameMessageId || msg.message_id !== payload.gameMessageId) return;

    const meme = await fetchAnimeme();
    if (!meme) return void (await bot.answerCallbackQuery(callbackQuery.id, { text: "Error fetching meme." }));

    await response.editMedia(
      { chatId: msg.chat.id, messageId: payload.gameMessageId },
      { type: "photo", media: meme.url, caption: meme.title },
      { reply_markup: keyboard(payload.gameMessageId) }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("Error in animeme callback:", err?.message || err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." }); } catch (_) {}
  }
}
