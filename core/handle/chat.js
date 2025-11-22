export async function chat({ bot, response, msg, chatId }) {
  const { commands } = global.chaldea;
  const args = (msg.text && msg.text.trim()) ? msg.text.trim().split(/\s+/) : [];

  for (const [commandName, command] of commands.entries()) {
    if (command.onChat) {
      try {
        const shouldContinue = await command.onChat({
          bot,
          response,
          msg,
          chatId,
          args
        });
        if (shouldContinue === false) {
          break;
        }
      } catch (error) {
        console.error(`Error executing onChat for command "${commandName}":`, error);
      }
    }
  }
}
