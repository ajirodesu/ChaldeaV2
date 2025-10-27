import axios from "axios";

export const meta = {
  name: "help",
  aliases: ["h"],
  version: "0.0.1",
  author: "ShawnDesu",
  description: "Displays help information for commands.",
  guide: "<command|page|all>",
  cooldown: 5,
  prefix: "both",
  type: "anyone",
  category: "system",
  waifu: false,
};

const COMMANDS_PER_PAGE = 10;

/**
 * Fetches a random waifu image URL (uses waifu.pics). Returns a string URL.
 * Falls back to a placeholder image if the API fails.
 */
async function getRandomWaifuUrl() {
  try {
    const res = await axios.get("https://api.waifu.pics/sfw/waifu", { timeout: 8000 });
    if (res?.data?.url) return res.data.url;
  } catch (e) {
    // ignore and fallback
  }
  return "https://i.imgur.com/3ZQ3Z5b.png";
}

export async function onStart({ bot, chatId, msg, response }) {
  try {
    const userId = msg.from.id;
    const { commands } = global.chaldea;
    const { owner = [], prefix: globalPrefix, symbols } = global.settings;
    const vipUsers = global.vip.uid.includes(userId);
    const senderID = String(userId);
    const chatType = msg.chat.type;
    const args = msg.text.split(" ").slice(1);
    const cleanArg = args[0] ? args[0].trim().toLowerCase() : "";

    // If an argument matches a command, show its detailed info.
    if (cleanArg) {
      const command =
        commands.get(cleanArg) ||
        [...commands.values()].find(
          (cmd) =>
            Array.isArray(cmd.meta.aliases) &&
            cmd.meta.aliases.map((alias) => alias.toLowerCase()).includes(cleanArg)
        );
      if (command) {
        const helpMessage = generateCommandInfo(command.meta, globalPrefix);
        return await response.reply(helpMessage, { parse_mode: "Markdown" });
      }
    }

    // Determine pagination or all-commands.
    const isAll = cleanArg === "all" || cleanArg === "-all" || cleanArg === "-a";
    const parsedPage = parseInt(cleanArg);
    const pageNumber = !isAll && !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    // Get effective prefix and permission flags.
    const effectivePrefix = chatType === "private" ? globalPrefix : globalPrefix;
    const ownersList = Array.isArray(owner) ? owner : [];
    const isBotOwner = ownersList.map(String).includes(senderID);
    const isGroupAdmin = await checkGroupAdmin(bot, chatId, senderID, chatType);

    // Create a unique session ID early.
    const instanceId = "help_" + Date.now().toString();

    // Generate help message and inline navigation.
    const { helpMessage, replyMarkup } = generateHelpMessage(
      commands,
      senderID,
      isBotOwner,
      isGroupAdmin,
      pageNumber,
      cleanArg,
      effectivePrefix,
      symbols,
      vipUsers,
      chatType,
      instanceId // Pass instanceId to generateHelpMessage
    );

    // If waifu images are enabled, send photo+caption; otherwise send plain text reply.
    if (meta.waifu) {
      const loading = await response.reply("⌛ Loading help...", { parse_mode: "Markdown" });
      const waifuUrl = await getRandomWaifuUrl();
      const sentPhoto = await response.photo(waifuUrl, {
        caption: helpMessage,
        parse_mode: "Markdown",
        reply_markup: replyMarkup?.inline_keyboard?.length ? replyMarkup : undefined,
      });

      // Store session details.
      global.chaldea.callbacks.set(instanceId, {
        senderID,
        helpMessageId: sentPhoto.message_id,
        chatId,
      });

      // Clean up loading message.
      try { await response.delete(loading); } catch (e) {}
    } else {
      const sentMsg = await response.reply(helpMessage, {
        parse_mode: "Markdown",
        reply_markup: replyMarkup?.inline_keyboard?.length ? replyMarkup : undefined,
      });

      // Store session details.
      global.chaldea.callbacks.set(instanceId, {
        senderID,
        helpMessageId: sentMsg.message_id,
        chatId,
      });
    }
  } catch (error) {
    console.error("Error in help command onStart:", error);
    await response.reply("⚠️ An error occurred while processing the help command.", { parse_mode: "Markdown" });
  }
}

async function onCallback({ bot, callbackQuery }) {
  try {
    // Validate callback data.
    if (!callbackQuery?.data) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid button data." });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(callbackQuery.data);
    } catch (e) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid button data format." });
      return;
    }

    // Verify the callback is for the help command.
    if (payload.command !== "help" || !payload.instanceId) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid button action." });
      return;
    }

    const session = global.chaldea.callbacks.get(payload.instanceId);
    if (!session) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Session expired. Please use the help command again." });
      return;
    }

    if (String(callbackQuery.from.id) !== session.senderID) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "This button is not for you." });
      return;
    }

    const newPageNumber = payload.page;
    const { commands } = global.chaldea;
    const { owner = [], prefix: globalPrefix, symbols } = global.settings;
    const senderID = String(callbackQuery.from.id);
    const vipUsers = global.vip.uid.includes(senderID);
    const chatId = callbackQuery.message.chat.id;
    const chatType = callbackQuery.message.chat.type;

    const effectivePrefix = chatType === "private" ? globalPrefix : globalPrefix;
    const ownersList = Array.isArray(owner) ? owner : [];
    const isBotOwner = ownersList.map(String).includes(senderID);
    const isGroupAdmin = await checkGroupAdmin(bot, chatId, senderID, chatType);

    // Generate new help message and reply markup.
    const { helpMessage, replyMarkup } = generateHelpMessage(
      commands,
      senderID,
      isBotOwner,
      isGroupAdmin,
      newPageNumber,
      null,
      effectivePrefix,
      symbols,
      vipUsers,
      chatType,
      payload.instanceId // Pass instanceId to keep buttons consistent
    );

    // Define response methods using bot.
    const response = {
      editMedia: async (message, media, options) => {
        await bot.editMessageMedia(media, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          ...options,
        });
      },
      editCaption: async (message, caption, options) => {
        await bot.editMessageCaption({
          chat_id: message.chat.id,
          message_id: message.message_id,
          caption,
          ...options,
        });
      },
      editText: async (message, text, options) => {
        await bot.editMessageText(text, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          ...options,
        });
      },
    };

    if (meta.waifu) {
      const waifuUrl = await getRandomWaifuUrl();
      try {
        const media = {
          type: "photo",
          media: waifuUrl,
          caption: helpMessage,
          parse_mode: "Markdown",
        };
        await response.editMedia(callbackQuery.message, media, { reply_markup: replyMarkup });
      } catch (err) {
        // Fallback to editing caption only.
        try {
          await response.editCaption(callbackQuery.message, helpMessage, {
            parse_mode: "Markdown",
            reply_markup: replyMarkup,
          });
        } catch (err2) {
          console.error("Failed to edit media or caption for help command:", err2);
          await bot.answerCallbackQuery(callbackQuery.id, { text: "Failed to update help page." });
        }
      }
    } else {
      try {
        await response.editText(callbackQuery.message, helpMessage, {
          parse_mode: "Markdown",
          reply_markup: replyMarkup,
        });
      } catch (err) {
        console.error("Failed to edit help text for help command:", err);
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Failed to update help page." });
      }
    }

    // Update session details.
    session.helpMessageId = callbackQuery.message.message_id;
    await bot.answerCallbackQuery(callbackQuery.id, { text: `Page ${newPageNumber}` });
  } catch (error) {
    console.error("Error in help command onCallback:", error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred while processing the button." });
  }
}

/**
 * Generates the help message text and inline keyboard.
 * If "all" is requested, returns a grouped list with no buttons.
 */
function generateHelpMessage(
  commands,
  senderID,
  isBotOwner,
  isGroupAdmin,
  pageNumber,
  cleanArg,
  prefix,
  symbols,
  vipUsers,
  chatType,
  instanceId // Add instanceId parameter
) {
  const filteredCommands = getFilteredCommands(commands, senderID, isBotOwner, isGroupAdmin, vipUsers, chatType);
  const totalCommands = filteredCommands.length;
  const totalPages = Math.ceil(totalCommands / COMMANDS_PER_PAGE) || 1;

  if (cleanArg === "all" || cleanArg === "-all" || cleanArg === "-a") {
    return {
      helpMessage: generateAllCommandsMessage(filteredCommands, prefix, symbols),
      replyMarkup: {},
    };
  }

  const validPage = Math.min(pageNumber, totalPages);
  const start = (validPage - 1) * COMMANDS_PER_PAGE;
  const paginatedCommands = filteredCommands
    .slice(start, start + COMMANDS_PER_PAGE)
    .map((cmd) => `${symbols} ${prefix}${cmd.meta.name}`);

  const helpMessage =
    `📜 *Command List*\n\n${paginatedCommands.join("\n")}\n\n` +
    `*Page:* ${validPage}/${totalPages}\n*Total Commands:* ${totalCommands}`;

  // Build inline navigation buttons with instanceId.
  const inlineButtons = [];
  if (validPage > 1) {
    inlineButtons.push({
      text: "◀️",
      callback_data: JSON.stringify({ command: "help", instanceId, page: validPage - 1 }),
    });
  }
  if (validPage < totalPages) {
    inlineButtons.push({
      text: "▶️",
      callback_data: JSON.stringify({ command: "help", instanceId, page: validPage + 1 }),
    });
  }
  const replyMarkup = inlineButtons.length ? { inline_keyboard: [inlineButtons] } : {};

  return { helpMessage, replyMarkup };
}

/* Other helper functions remain unchanged */
async function checkGroupAdmin(bot, chatId, senderID, chatType) {
  if (["group", "supergroup"].includes(chatType)) {
    try {
      const member = await bot.getChatMember(chatId, senderID);
      return member.status === "administrator" || member.status === "creator";
    } catch (err) {
      return false;
    }
  }
  return false;
}

function getFilteredCommands(commands, senderID, isBotOwner, isGroupAdmin, vipUsers, chatType) {
  return [...commands.values()]
    .filter((cmd) => {
      if (cmd.meta.category?.toLowerCase() === "hidden") return false;
      if (!isBotOwner) {
        if (cmd.meta.type === "owner") return false;
        if (cmd.meta.type === "vip" && !vipUsers) return false;
        if (cmd.meta.type === "administrator" && !isGroupAdmin) return false;
        if (cmd.meta.type === "group" && !["group", "supergroup"].includes(chatType)) return false;
        if (cmd.meta.type === "private" && chatType !== "private") return false;
      }
      return true;
    })
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

function generateAllCommandsMessage(filteredCommands, prefix, symbols) {
  const categories = {};
  filteredCommands.forEach((cmd) => {
    const cat = capitalize(cmd.meta.category || "misc");
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(`${prefix}${cmd.meta.name}`);
  });

  const sortedCategories = Object.keys(categories).sort((a, b) => a.localeCompare(b));
  sortedCategories.forEach((cat) => categories[cat].sort((a, b) => a.localeCompare(b)));

  const blocks = sortedCategories.map((cat) => {
    const commandsList = categories[cat].map((command) => `│➥ ${command}`).join("\n");
    return (
      "╭─────────────────✦\n" +
      `│ ${cat}\n` +
      "├───✦ \n" +
      commandsList + "\n" +
      "╰─────────────────✦"
    );
  });

  return blocks.join("\n\n") + `\n\nTotal Commands: ${filteredCommands.length}`;
}

function generateCommandInfo(cmdInfo, prefix) {
  const aliases =
    cmdInfo.aliases?.length
      ? `*Aliases:*\n${cmdInfo.aliases.map((alias) => `\`${alias}\``).join(", ")}`
      : "*Aliases:*\nNone";

  let usageList = "";
  if (cmdInfo.guide) {
    usageList =
      Array.isArray(cmdInfo.guide) && cmdInfo.guide.length
        ? cmdInfo.guide.map((u) => `\`${prefix}${cmdInfo.name} ${u}\``).join("\n")
        : `\`${prefix}${cmdInfo.name} ${cmdInfo.guide}\``;
  } else {
    usageList = "No usage instructions provided.";
  }

  return (
    `📘 *Command:* \`${cmdInfo.name}\`\n\n` +
    `*Description:*\n${cmdInfo.description}\n\n` +
    `*Usage:*\n${usageList}\n\n` +
    `*Category:*\n${capitalize(cmdInfo.category || "misc")}\n\n` +
    `*Cooldown:*\n${cmdInfo.cooldown || 0} seconds\n\n` +
    aliases
  );
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export { onCallback };