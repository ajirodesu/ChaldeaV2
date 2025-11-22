export async function word({ bot, response, msg, chatId }) {
  if (!msg || !msg.text) return;

  const text = msg.text.trim();
  const { commands } = global.chaldea;

  if (text.startsWith(global.settings.prefix)) return;

  const tokens = text.split(/\s+/);
  if (tokens.length > 0) {
    const firstToken = tokens[0].toLowerCase();
    for (const cmd of commands.values()) {
      if (cmd.meta.prefix === false || cmd.meta.prefix === "both") {
        if (cmd.meta.name.toLowerCase() === firstToken) return;
        if (
          cmd.meta.aliases &&
          Array.isArray(cmd.meta.aliases) &&
          cmd.meta.aliases.map(alias => alias.toLowerCase()).includes(firstToken)
        ) {
          return;
        }
      }
    }
  }

  for (const cmd of commands.values()) {
    if (cmd.meta && cmd.meta.keyword) {
      const keywords = Array.isArray(cmd.meta.keyword)
        ? cmd.meta.keyword
        : [cmd.meta.keyword];
      const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "i");

      if (keywordRegex.test(msg.text)) {
        const args = text.split(/\s+/);
        try {
          await cmd.onWord({ bot, response, msg, chatId, args });
        } catch (error) {
          console.error(`Error in event handler for command "${cmd.meta.name}": ${error.message}`);
        }
      }
    }
  }
}
