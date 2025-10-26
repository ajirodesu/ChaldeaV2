import axios from 'axios';

export const meta = {
  name: 'recipe',
  version: '1.0.0',
  aliases: ['meal', 'food'],
  description: 'Get a random recipe from TheMealDB',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: [''],
};

const API = 'https://www.themealdb.com/api/json/v1/1/random.php';
const TIMEOUT = 8000;

const makeKeyboard = (messageId) => [[
  {
    text: '🔁 Refresh',
    callback_data: JSON.stringify({ command: 'recipe', messageId, args: ['refresh'] })
  }
]];

async function fetchRecipe() {
  try {
    const { data } = await axios.get(API, { headers: { Accept: 'application/json' }, timeout: TIMEOUT });
    return data?.meals?.[0] ?? null;
  } catch (err) {
    console.error('fetchRecipe error:', err?.message || err);
    return null;
  }
}

function generateRecipeMessage(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || '').trim();
    const mea = (meal[`strMeasure${i}`] || '').trim();
    if (!ing) continue;
    ingredients.push(`- ${ing}${mea ? ` (${mea})` : ''}`);
  }

  let caption = `🍽️ *Random Recipe: ${meal.strMeal}*\n\n` +
    `📂 *Category:* ${meal.strCategory || 'N/A'}\n\n` +
    `📝 *Instructions:*\n${meal.strInstructions || 'N/A'}\n\n` +
    `🥕 *Ingredients:*\n${ingredients.join('\n') || 'N/A'}`;

  if (caption.length > 1024) caption = caption.slice(0, 1000) + '...';
  return caption;
}

export async function onStart({ response }) {
  const loading = await response.reply('🍳 *Fetching a random recipe...*', { parse_mode: 'Markdown' });

  try {
    const meal = await fetchRecipe();
    if (!meal) {
      await response.editText(loading, '⚠️ Could not retrieve a recipe from the API.', { parse_mode: 'Markdown' });
      return;
    }

    const caption = generateRecipeMessage(meal);

    const sentMsg = await response.photo(meal.strMealThumb, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: makeKeyboard(null) }
    });

    // update keyboard with real message id
    try {
      await response.editMarkup(sentMsg, { inline_keyboard: makeKeyboard(sentMsg.message_id) });
    } catch (err) {
      console.error('editMarkup error:', err?.message || err);
    }

    // remove loading message
    try { await response.delete(loading); } catch (e) { /* ignore */ }
  } catch (err) {
    console.error('onStart error:', err);
    await response.editText(loading, `⚠️ Failed to fetch recipe: ${err?.message || err}`, { parse_mode: 'Markdown' });
  }
}

export async function onCallback({ bot, callbackQuery }) {
  try {
    if (!callbackQuery?.data) {
      await bot.answerCallbackQuery(callbackQuery?.id, { text: 'Invalid button data.' });
      return;
    }

    let payload;
    try { payload = JSON.parse(callbackQuery.data); } catch {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid button data format.' });
      return;
    }

    if (payload.command !== 'recipe') return; // ignore others
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid or outdated button.' });
      return;
    }
    if (payload.args?.[0] !== 'refresh') {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Unknown action.' });
      return;
    }

    const meal = await fetchRecipe();
    if (!meal) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Failed to fetch a new recipe.' });
      return;
    }

    const caption = generateRecipeMessage(meal);

    await bot.editMessageMedia(
      {
        type: 'photo',
        media: meal.strMealThumb,
        caption,
        parse_mode: 'Markdown'
      },
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: payload.messageId,
        reply_markup: { inline_keyboard: makeKeyboard(payload.messageId) }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Recipe refreshed!' });
  } catch (err) {
    console.error('onCallback error:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery?.id, { text: 'Failed to refresh recipe. Please try again.' });
    } catch (inner) {
      console.error('answerCallbackQuery error:', inner?.message || inner);
    }
  }
}
