export function callback({ bot, msg, chatId, response }) {
  if (bot._callbackHandler) {
    bot.removeListener('callback_query', bot._callbackHandler);
  }

  const parsePayload = (data) => {
    try {
      return JSON.parse(data);
    } catch (err) {
      const parts = data.split(':');
      return parts.length ? { command: parts[0], args: parts.slice(1) } : null;
    }
  };

  bot._callbackHandler = async (callbackQuery) => {
    if (!callbackQuery) {
      console.error('Invalid callback query received:', callbackQuery);
      return;
    }

    const data = callbackQuery.data;
    const gameShortName = callbackQuery.game_short_name;

    if (!data && !gameShortName) {
      console.error('No data or game_short_name in callback query:', callbackQuery);
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Invalid callback format."
      }).catch(console.error);
    }

    // Handle game queries separately if needed
    if (gameShortName) {
      // Assuming the bot does not handle games; customize if necessary
      console.error('Game callback received but not handled:', gameShortName);
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Games are not supported.",
        show_alert: true
      }).catch(console.error);
    }

    const payload = parsePayload(data);
    if (!payload || !payload.command) {
      console.error('No command found in payload:', payload);
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Invalid callback format."
      }).catch(console.error);
    }

    const { commands, callbacks } = global.chaldea;
    if (!commands) {
      console.error('Global client commands not initialized');
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Commands not initialized.",
        show_alert: true
      }).catch(console.error);
    }

    const command = commands.get(payload.command);
    if (!command || typeof command.onCallback !== 'function') {
      console.error(`No valid onCallback handler found for command: ${payload.command}`);
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Command not found.",
        show_alert: true
      }).catch(console.error);
    }

    try {
      const messageId = callbackQuery.message?.message_id || null;
      const chatIdFromQuery = callbackQuery.message?.chat?.id || null;
      const inlineMessageId = callbackQuery.inline_message_id || null;

      if (!chatIdFromQuery && !inlineMessageId) {
        throw new Error('Neither chat ID nor inline message ID found in callback query');
      }

      await command.onCallback({
        bot,
        callbackQuery,
        chatId: chatIdFromQuery,
        messageId,
        inlineMessageId,
        args: payload.args || [],
        payload,
        response,
      });

      if (!callbackQuery.answered) {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    } catch (error) {
      console.error(`Error executing onCallback for command "${payload.command}":`, error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "An error occurred. Please try again.",
        show_alert: true
      }).catch(console.error);
    }
  };

  bot.on('callback_query', bot._callbackHandler);
}