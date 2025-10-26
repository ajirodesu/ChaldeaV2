export const meta = {
  name: 'uid',
  version: '1.0.0',
  aliases: ['id', 'userid'],
  description: 'Shows your Telegram user ID or the ID of the user you replied to.',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 3,
  guide: ['uid — Get your own user ID or the ID of a replied user.']
};

export async function onStart({ bot, msg, args, usages, response }) {
  try {
    const target = msg.reply_to_message?.from || msg.from;
    const name = target.first_name || 'Unknown User';
    const id = target.id;

    await response.reply(
      `🆔 <b>${name}</b>'s Telegram ID: <code>${id}</code>`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error(err);
    await response.reply('❌ An error occurred while fetching the user ID.');
  }
}
