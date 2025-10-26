import moment from 'moment-timezone';

export async function event({ bot, msg, chatId, response }) {
  const timeStart = Date.now();
  const formattedTime = moment.tz(global.settings.timeZone).format("HH:mm:ss L");
  const { events } = global.chaldea;
  const { devMode } = global.settings;

  chatId = chatId || String(msg.chat.id);

  if (msg.new_chat_members || msg.left_chat_member) {
    const eventType = msg.new_chat_members ? "welcome" : "leave";

    for (const [eventName, eventHandler] of events.entries()) {
      if (eventHandler.meta.type.includes(eventType)) {
        try {
          const context = { bot, response, msg, chatId };
          await eventHandler.onStart(context);

          if (devMode) {
            const executionTime = Date.now() - timeStart;
            const consoleWidth = process.stdout.columns || 60;
            const separator = "─".repeat(consoleWidth);
            const logMessage = `
${separator}
[ DEV MODE ]
Event           : ${eventHandler.meta.name}
Time            : ${formattedTime}
Execution Time  : ${executionTime}ms
${separator}
            `.trim();
            console.log(logMessage);
          }
        } catch (error) {
          console.error(`[ Event Error ] ${eventHandler.meta.name}:`, error);
        }
      }
    }
    return;
  }
}
