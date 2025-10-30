const words = [
  "apple","beach","chair","dance","eagle","flame","grape","house","ivory","jelly",
  "knife","lemon","mango","novel","ocean","pizza","queen","river","sugar","tiger",
  "uncle","voice","water","xray","yacht","zebra","brick","cloud","drain","earth",
  "forest","glass","horse","index","joker","koala","light","mouse","noise","orbit",
  "paper","quick","smile","table","unity","vivid","whale","yield","arrow","brave",
  "coral","diary","elite","frost","gamer","heart","layer","magic","noble","omega",
  "pearl","quest","steam","train","urban","valve","width","alpha","blaze","delta",
  "focus","glide","hunch","icing","karma","lunar","maple","nerve","pulse","ridge"
];

const activeGames = new Map();

export const meta = {
  name: "wordle",
  aliases: ["word"],
  version: "1.0.0",
  description: "Play a fun Wordle game!",
  author: "AjiroDesu",
  prefix: "both",
  category: "fun",
  type: "anyone",
  cooldown: 5,
  guide: ["start"]
};

export async function onStart({ bot, chatId, msg, args, response }) {

  if (activeGames.has(chatId)) 
    return response.reply("❌ A game is already in progress. Type *end* to stop.", { parse_mode: "Markdown" });

  if (!args[0] || args[0].toLowerCase() !== "start")
    return response.reply("🎮 *How to play Wordle:*\n1. `/wordle start`\n2. Guess a 5-letter word\n3. 🟩 Correct position\n4. 🟨 Wrong position\n5. ⬜ Not in word\n6. Type *end* to stop.", { parse_mode: "Markdown" });

  const word = words[Math.floor(Math.random() * words.length)];
  const gameState = { word, attempts: 0, max: 6, over: false };
  activeGames.set(chatId, gameState);
  await response.reply("🎯 Wordle started! Guess the 5-letter word. You have 6 tries.");

  const handler = async (m) => {
    if (m.chat.id !== chatId) return;
    const game = activeGames.get(chatId);
    if (!game || game.over) return;

    const guess = (m.text || "").toLowerCase().trim();
    if (guess === "end") return endGame(chatId, bot, "🛑 Game ended.");
    if (guess.length !== 5) return     response.send("❌ Guess must be 5 letters.");
    if (!/^[a-z]+$/.test(guess)) return bot.sendMessage(chatId, "❌ Only A–Z letters allowed.");

    game.attempts++;
    const res = evalGuess(guess, game.word);
    await response.send(`Try ${game.attempts}/${game.max}: ${guess.toUpperCase()}\n${res.emoji}`);

    if (res.correct) return endGame(chatId, bot, `🎉 Correct! The word was *${game.word.toUpperCase()}*!`, true);
    if (game.attempts >= game.max) return endGame(chatId, bot, `😔 Out of tries! The word was *${game.word.toUpperCase()}*.`);
  };

  bot.on("text", handler);

  async function endGame(id, b, msg, win = false) {
    const g = activeGames.get(id);
    if (g) g.over = true;
    activeGames.delete(id);
    b.removeListener("text", handler);
    await b.sendMessage(id, msg, { parse_mode: "Markdown" });
  }
}

function evalGuess(guess, word) {
  const result = Array(5).fill("⬜");
  const letters = word.split("");

  for (let i = 0; i < 5; i++)
    if (guess[i] === word[i]) (result[i] = "🟩", letters[i] = null);

  for (let i = 0; i < 5; i++)
    if (result[i] === "⬜") {
      const idx = letters.indexOf(guess[i]);
      if (idx !== -1) (result[i] = "🟨", letters[idx] = null);
    }

  return { emoji: result.join(""), correct: result.join("") === "🟩🟩🟩🟩🟩" };
}
