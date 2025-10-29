export const meta = {
  name: "goodbye",
  description: "Handles members leaving the group and sends goodbye messages.",
  version: "1.0.0",
  author: "ShawnDesu"
};

export async function onStart({ bot, msg, chatId, response }) {
  const leftMember = msg.left_chat_member;

  try {
    if (!leftMember) return;

    const { first_name, last_name, id: userId } = leftMember;
    const fullName = `${first_name}${last_name ? ' ' + last_name : ''}`;

    const botInfo = await bot.getMe();

    if (userId === botInfo.id) {
      const chatInfo = await bot.getChat(chatId);
      const title = chatInfo.title || 'the group';
      const actionBy = `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`;

      console.log(`Bot was removed from ${title} by ${actionBy}.`);
      return;
    }

    const memberCount = (await bot.getChatMemberCount(chatId)) - 1;

    const goodbyeMessage = msg.from.id === userId
      ? `${fullName} has left the group. We'll miss you!`
      : `Goodbye, ${fullName}. You were removed by an admin.`;

    await response.send(goodbyeMessage);

  } catch (error) {
    console.log('Error in goodbye handler:', error);
    await response.forOwner(`Error in goodbye handler:\n${error.message}`);
  }
}