export const meta = {
  name: "welcome",
  description: "Handles new members joining the group and sends welcome messages.",
  type: "welcome",
  author: "ShawnDesu"
};

export async function onStart({ bot, msg, chatId, response }) {
  const newMembers = msg.new_chat_members;

  try {
    if (!newMembers) return;

    const botInfo = await bot.getMe();
    const chatInfo = await bot.getChat(chatId);
    const title = chatInfo.title || "the group";

    const isBotAdded = newMembers.some(member => member.id === botInfo.id);

    if (isBotAdded) {
      const chatMember = await bot.getChatMember(chatId, botInfo.id);

      if (chatMember.status !== 'administrator') {
        await response.send(
          `🎉 ${botInfo.first_name} has been successfully connected!\n\n` +
          `Thank you for inviting me to ${title}. Before you use this bot, ` +
          `please consider granting me admin privileges.`
        );
      }
      return;
    }

    for (const newMember of newMembers) {
      const memberName = `${newMember.first_name}${newMember.last_name ? ' ' + newMember.last_name : ''}`;
      const memberCount = await bot.getChatMemberCount(chatId);

      await response.send(
        `Hi ${memberName}, welcome to ${title}!\n` +
        `Please enjoy your time here! 🥳♥\n\n` +
        `You are ${memberCount}th member of this group.`
      );
    }

  } catch (error) {
    console.log('Error in welcome handler:', error);
    await response.forOwner(`Error in welcome handler:\n${error.message}`);
  }
}