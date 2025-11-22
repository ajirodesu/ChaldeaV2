export async function event({
  bot,
  msg,
  chatId,
  response
}) {
  const { events } = global.chaldea;

  try {
    for (const { meta, onStart } of events.values()) {
      if (msg && meta?.name) {
        const args = (msg.text ?? msg.data ?? '').split("");
        await onStart({
          bot,
         msg,
         chatId,
         response
        });
      }
    }
  } catch (error) {
    console.error(error.stack);
    response.reply(
      `❌ | ${error.message}\n${error.stack}\n${error.name}\n${error.code}\n${error.path}`,
    );
  }
}
