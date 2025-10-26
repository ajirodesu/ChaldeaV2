import axios from "axios";

export const meta = {
  name: "waifu",
  aliases: ["waifupic", "waifuphoto"],
  prefix: "both",
  version: "1.0.0",
  author: "ShawnDesu",
  description:
    "Sends a random waifu photo. Optionally specify a tag. Use '/waifu categories' to see available tags.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "anime",
};

const availableCategories = [
  "waifu","neko","shinobu","megumin","bully","cuddle","cry","hug","awoo","kiss",
  "lick","pat","smug","bonk","yeet","blush","smile","wave","highfive","handhold",
  "nom","bite","glomp","slap","kill","kick","happy","wink","poke","dance","cringe"
];

// fetch image URL from API
async function fetchWaifu(category = "waifu") {
  const res = await axios.get(`https://api.waifu.pics/sfw/${category}`);
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.url;
}

const mkKeyboard = (category) => [
  [
    {
      text: "🔁",
      callback_data: JSON.stringify({
        command: "waifu",
        category,
        args: ["refresh"],
      }),
    },
  ],
];

const title = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Command entry
 * - /waifu
 * - /waifu categories | help
 * - /waifu <category>
 */
export async function onStart({ bot, msg, chatId, response }) {
  try {
    const text = (msg?.text || "").trim();
    const args = text ? text.split(/\s+/).slice(1) : [];
    const first = (args[0] || "").toLowerCase();

    if (first === "categories" || first === "help") {
      return response.reply(`Available categories: ${availableCategories.join(", ")}`);
    }

    const category = first || "waifu";
    if (!availableCategories.includes(category)) {
      return response.reply(
        `Invalid category "${category}". Use /waifu categories to see available options.`
      );
    }

    const url = await fetchWaifu(category);
    await response.photo(url, {
      caption: title(category),
      reply_markup: { inline_keyboard: mkKeyboard(category) },
    });
  } catch (err) {
    return response.reply(`An error occurred: ${err?.message || err}`);
  }
}

/**
 * Callback handler for inline button (refresh)
 */
export async function onCallback({ bot, callbackQuery, chatId, messageId, payload }) {
  try {
    if (payload?.command !== "waifu") return;
    const category = payload.category || "waifu";
    if (!availableCategories.includes(category)) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Unknown category." });
      return;
    }

    const url = await fetchWaifu(category);
    await bot.editMessageMedia(
      { type: "photo", media: url, caption: title(category) },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: mkKeyboard(category) },
      }
    );
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    // try to notify the callback user; if that fails, fail silently
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: `Error: ${err?.message || err}` });
    } catch {}
  }
}
