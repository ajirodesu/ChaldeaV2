export const meta = {
  name: 'start',
  version: '1.0.0',
  aliases: [],
  description: 'Initiate interaction with the bot and display welcome information',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'hidden',
  type: 'anyone',
  cooldown: 0,
  guide: []
};

export async function onStart({ bot, msg, args, response, usages }) {
  const { prefix } = global.settings;
  const userName = msg.from.first_name || 'User';
  const welcomeMessage = `👋 *Hello, ${userName}!*

Welcome to Chaldea Bot.

This bot offers a range of professional functionalities designed to assist you efficiently. Here's how to begin:

- Explore and utilize the available commands for seamless interaction.
- For a comprehensive list of commands, type \`${prefix}help\`.

We value your experience—enjoy your time with the bot! Should you encounter any issues, please report them for prompt resolution.`;

  try {
    await response.reply(welcomeMessage, { parse_mode: 'Markdown' });
  } catch (err) {
    await response.reply(`⚠️ Error: ${err.message}`, { parse_mode: 'Markdown' });
  }
}