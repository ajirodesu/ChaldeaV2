import axios from "axios";

export const meta = {
  name: "quiz",
  version: "1.1.0",
  aliases: ["trivia", "question"],
  description: "Get a random quiz question from Open Trivia Database",
  author: "AjiroDesu",
  prefix: "both",
  category: "random",
  type: "anyone",
  cooldown: 5,
  guide: [""],
};

// In-memory cache for quiz data keyed by short quizId
const quizCache = new Map();

// Minimal HTML entity decoder for common entities returned by OpenTDB
const decodeHtml = (s = "") =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&eacute;/g, "é")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”");

// Helper: shuffle array (Fisher–Yates)
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Fetch a single multiple-choice question from OpenTDB
const fetchQuiz = async () => {
  const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple", {
    headers: { Accept: "application/json" },
  });
  return res.data?.results?.[0] ?? null;
};

export async function onStart({ response }) {
  const loading = await response.reply("🧠 *Fetching a random quiz question...*", { parse_mode: "Markdown" });

  try {
    const quiz = await fetchQuiz();
    if (!quiz) throw new Error("No quiz returned");

    const question = decodeHtml(quiz.question);
    const correct = decodeHtml(quiz.correct_answer);
    const options = shuffle([...quiz.incorrect_answers.map(decodeHtml), correct]);

    // store correct answer and options by index
    const quizId = Math.random().toString(36).slice(2, 10);
    quizCache.set(quizId, { correct, options });

    // build keyboard using option indices (safe, short callback_data)
    const inline_keyboard = options.map((opt, i) => [
      { text: opt, callback_data: `quiz:${quizId}:${i}` },
    ]);

    const text = `🎯 *Quiz Time!*\n\n❓ *Question:* ${question}\n\nSelect the correct answer below:`;

    await response.editText(loading, text, { parse_mode: "Markdown", reply_markup: { inline_keyboard } });
  } catch (err) {
    await response.editText(loading, `⚠️ Failed to fetch quiz: ${err.message}`, { parse_mode: "Markdown" });
  }
}

export async function onCallback({ bot, callbackQuery, response }) {
  try {
    const data = (callbackQuery.data || "").split(":");
    if (data.length !== 3 || data[0] !== "quiz") {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid quiz data." });
      return;
    }

    const [, quizId, idxStr] = data;
    const idx = parseInt(idxStr, 10);
    const quizData = quizCache.get(quizId);

    if (!quizData) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "This quiz expired. Try again!" });
      return;
    }

    const chosen = quizData.options[idx];
    const isCorrect = chosen === quizData.correct;

    const emoji = isCorrect ? "✅" : "❌";
    const feedback = isCorrect
      ? `🎉 *Correct!* The answer is *${quizData.correct}*`
      : `😢 *Wrong!* You chose *${chosen}*\n\n✅ The correct answer was *${quizData.correct}*`;

    // derive chatId/messageId from callbackQuery for robustness
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    // replace message with feedback and remove buttons
    await response.editText({ chatId, messageId }, `${emoji} ${feedback}`, { parse_mode: "Markdown" });

    await bot.answerCallbackQuery(callbackQuery.id, { text: isCorrect ? "Correct!" : "Wrong!" });

    // cleanup
    quizCache.delete(quizId);
  } catch (err) {
    console.error("Error in quiz callback:", err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "An error occurred while processing your answer.",
        show_alert: true,
      });
    } catch (e) {
      console.error("Failed to answer callback query:", e?.message || e);
    }
  }
}
