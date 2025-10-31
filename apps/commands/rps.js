export const meta = {
  name: 'rps',
  version: '1.0.1',
  aliases: [],
  description: 'Play Rock Paper Scissors (buttons). Uses response object for all replies/edits.',
  author: 'JohnDev19',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 2,
  guide: ['play rock paper scissors']
};

const choices = ['rock', 'paper', 'scissors'];
const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

/**
 * Send game keyboard (uses response)
 */
export async function onStart({ bot, msg, args, response }) {
  const kb = [
    [
      { text: `Rock ${emojis.rock}`, callback_data: JSON.stringify({ command: 'rps', args: ['rock'] }) },
      { text: `Paper ${emojis.paper}`, callback_data: JSON.stringify({ command: 'rps', args: ['paper'] }) },
      { text: `Scissors ${emojis.scissors}`, callback_data: JSON.stringify({ command: 'rps', args: ['scissors'] }) }
    ]
  ];

  await response.reply('Choose Rock, Paper, or Scissors:', {
    reply_markup: { inline_keyboard: kb }
  });
}

/**
 * Callback handler invoked by your central callback dispatcher.
 * IMPORTANT: uses `response` to edit the original message (no direct bot.editMessageText).
 */
export async function onCallback({ bot, callbackQuery, chatId, messageId, args = [], payload = {}, response }) {
  try {
    const player = (args && args[0]) || (payload.args && payload.args[0]) || String(callbackQuery.data || '').toLowerCase();
    if (!choices.includes(player)) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid choice.' }).catch(() => {});
      return;
    }

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result = 'You lose!';
    if (player === botChoice) result = "It's a tie!";
    else if (
      (player === 'rock' && botChoice === 'scissors') ||
      (player === 'paper' && botChoice === 'rock') ||
      (player === 'scissors' && botChoice === 'paper')
    ) result = 'You win!';

    const text = `You chose ${emojis[player]}\nI chose ${emojis[botChoice]}\n\n${result}`;

    // Edit original message via response (clears inline keyboard)
    await response.editText(
      { chatId, messageId },
      text,
      { reply_markup: { inline_keyboard: [] } }
    );

    // Answer callback to remove loading state (still via bot)
    await bot.answerCallbackQuery(callbackQuery.id).catch(() => {});
  } catch (err) {
    console.error('rps onCallback error:', err);
    try { await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error running game.' }); } catch (e) {}
  }
}
