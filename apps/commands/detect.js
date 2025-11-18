export const meta = {
  name: "detect",
  keyword: ["lance", "wataru", "pastebin.com"],
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Detects owner name mentions and privately notifies them with details.",
  guide: ["Detects keywords in messages and alerts owners."],
  prefix: "both",
  cooldown: 0,
  type: "anyone",
  category: "hidden"
};

export async function onStart({ bot, msg, response }) {
  await response.reply("Hello! You've activated the detect command.");
}

export async function onWord({ bot, msg, response }) {
  if (!msg?.text) return;

  const detectedKeywords = meta.keyword.filter(keyword =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(msg.text)
  );
  if (!detectedKeywords.length) return;

  const developers = Array.isArray(global.settings?.devID) ? global.settings.devID : [];
  if (!developers.length) return;

  const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ').trim() || 'Unknown';
  const senderUsername = msg.from?.username ? ` (@${msg.from.username})` : '';
  const senderId = msg.from?.id ?? 'Unknown';

  const chatTitle = msg.chat?.title || 'Private Chat';
  const chatId = msg.chat?.id ?? 'Unknown';

  const details = `
<b>Owner Alert</b>
Mention of <b>${detectedKeywords.join(', ')}</b> detected.

<b>Chat Details:</b>
• Chat ID: <code>${chatId}</code>
• Chat Title: <b>${chatTitle}</b>

<b>User Details:</b>
• Name: <b>${senderName}</b>${senderUsername}
• User ID: <code>${senderId}</code>

<b>Message Details:</b>
• Message ID: <code>${msg.message_id ?? 'Unknown'}</code>
• Message Text: <i>${msg.text}</i>
  `;

  try {
    await response.forDev(details, { parse_mode: "HTML" });
  } catch (error) {
    console.error(`Failed to notify owners: ${error.message}`);
  }
}