import axios from 'axios';

export const meta = {
  name: "cosplay",
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Get a random cosplay video.",
  guide: [""],
  prefix: "both",
  cooldown: 0,
  type: "vip",
  category: "anime"
};

const owner = 'ajirodesu';
const repo = 'cosplay';
const branch = 'main';
const repoUrl = `https://github.com/${owner}/${repo}/tree/${branch}/`;

async function fetchCosplayVideo() {
  const { data: html } = await axios.get(repoUrl);
  const re = /href="\/ajirodesu\/cosplay\/blob\/main\/([^"]+\.mp4)"/g;
  const files = [];
  let m;
  while ((m = re.exec(html)) !== null) files.push(m[1]);
  if (!files.length) return null;
  const file = files[Math.floor(Math.random() * files.length)];
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
}

const keyboard = (msgId) => ({ inline_keyboard: [[{ text: "🔁", callback_data: JSON.stringify({ command: "cosplay", gameMessageId: msgId, args: ["refresh"] }) }]] });

export async function onStart({ msg, bot, chatId, log, response }) {
  try {
    const videoUrl = await fetchCosplayVideo();
    if (!videoUrl) return response.reply("No cosplay videos found in the repository.");

    const sent = await response.video(videoUrl, {
      caption: "Here's a random cosplay video!",
      reply_markup: keyboard(null)
    });

    try { await response.editMarkup(sent, keyboard(sent.message_id)); } catch (e) { console.error("editMarkup error:", e?.message || e); }
  } catch (err) {
    console.error("Error fetching/sending cosplay video:", err?.message || err);
    return response.reply(`An error occurred while fetching a cosplay video: ${err?.message || err}`);
  }
}

export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload?.command !== "cosplay") return;
    const msg = callbackQuery.message;
    if (!payload.gameMessageId || msg.message_id !== payload.gameMessageId) return;

    const videoUrl = await fetchCosplayVideo();
    if (!videoUrl) return void (await bot.answerCallbackQuery(callbackQuery.id, { text: "No cosplay videos found." }));

    await response.editMedia(
      { chatId: msg.chat.id, messageId: payload.gameMessageId },
      { type: "video", media: videoUrl, caption: "Here's a random cosplay video!" },
      { reply_markup: keyboard(payload.gameMessageId) }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("Error in cosplay callback:", err?.message || err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." }); } catch (_) {}
  }
}
