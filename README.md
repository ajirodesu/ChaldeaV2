# Chaldea Telegram Bot

**Chaldea Telegram Bot** is a simple yet powerful and customizable Telegram bot designed to enhance group management and interactivity. It offers a variety of admin tools, event handling features, and media capabilities to create a more engaging experience.

---

## Features

* **Custom Commands**: Easily create and manage modular commands.
* **Admin Tools**: Efficiently manage members and groups.
* **Event Handling**: Send welcome and goodbye messages for group members.
* **Role-Based Access**: Restrict command usage by role (`owner`, `vip`, `administrator`, `anyone`) and chat type (`group` or `private`).
* **Media Support**: Send and manage text, images, videos, and audio.
* **Interactive Elements**: Supports inline buttons, callbacks, and message editing.
* **Keyword Triggers**: Automatically respond to specific keywords or phrases.
* **Flexible Command Prefix**: Supports both prefixed and non-prefixed commands.
* **Cooldown System**: Prevent command spamming with customizable cooldowns.

---

## Setup

### Prerequisites

1. **Bot Token**
   Obtain it from [BotFather](https://t.me/BotFather).
   ![BotFather Preview](https://i.imgur.com/1eBNpbK.jpeg)

2. **Bot Verification (Optional)**
   Use [Manybot](https://t.me/Manybot) to verify and generate your bot’s public link (`t.me/<bot_username>`).
   ![Manybot Preview](https://i.imgur.com/uENHXlz.jpeg)

3. **Admin ID**
   Use [MyIDBot](https://t.me/myidbot) to get your Telegram user ID.
   ![MyIDBot Preview](https://i.imgur.com/pwwMlg1.jpeg)

### Configuration

1. Add your bot token to:
   `setup/states.json`

2. Add your Owner ID to:
   `setup/settings.json`

3. (Optional) Add VIP user IDs to:
   `setup/vip.json`

### Running the Bot

1. Fork or clone the repository:
   [Chaldea Telegram Bot Repo](https://github.com/ajirodesu/ChaldeaHaleah)

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the bot:

   ```bash
   node index.js
   ```

> **Note**: If you're adding the bot to a **channel**, you must grant it **admin privileges** to unlock features such as message access and no-prefix command handling.

---

## Deployment Options

Deploy the bot on any of the following platforms:

* [Render](https://render.com)
* [Railway](https://railway.app)
* [Koyeb](https://koyeb.com)
* [Litegix](https://litegix.com)
* Pterodactyl Panel (self-hosted)

---

## Command Structure

Commands follow a consistent modular format:

```javascript
export const meta = {
  name: "commandname",
  version: "1.0.0",
  aliases: [],
  description: "Description of the command",
  author: "Author Name",
  prefix: "both", // true = only with prefix, false = no prefix, "both" = both allowed
  category: "utility",
  type: "anyone", // anyone, owner, administrator, vip, group, private
  cooldown: 5,
  guide: "Usage guide"
};

export async function onStart({ bot, args, response, msg, usages }) {
  // Command logic
}

```

---

## Message Handling Examples

### Text Messages

```javascript
// Reply
response.reply("Hello!");

// Send
bot.sendMessage(msg.chat.id, "Hello!");
```

### Image Messages

```javascript
// Reply with image
response.photo("https://example.com/image.jpg", { caption: "Here’s an image!" });

// Send image from URL
bot.sendPhoto(msg.chat.id, "https://example.com/image.jpg", {
  caption: "Here’s an image!"
});

// Send from local file
bot.sendPhoto(msg.chat.id, "./path/to/image.jpg", {
  caption: "Local image"
});
```

### Video Messages

```javascript
// Reply with video
response.video("https://example.com/video.mp4", { caption: "Check this out!" });

// Send video
bot.sendVideo(msg.chat.id, "https://example.com/video.mp4", {
  caption: "Watch this!"
});
```

### Audio Messages

```javascript
// Reply or send audio
response.audio("https://example.com/audio.mp3", { caption: "Now playing" });
bot.sendAudio(msg.chat.id, "./path/to/audio.mp3", { caption: "Now playing" });
```

### Delete Messages

```javascript
// Delete a message
bot.deleteMessage(msg.chat.id, msg.message_id);

// Delete after delay
const reply = await response.reply("Temporary message");
setTimeout(() => {
  bot.deleteMessage(msg.chat.id, reply.message_id);
}, 5000);
```

### Edit Messages

```javascript
bot.editMessageMedia(
  {
    type: "photo",
    media: "https://example.com/new-image.jpg",
    caption: "Updated caption"
  },
  {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔁",
            callback_data: JSON.stringify({
              command: "neko",
              gameMessageId: msg.message_id
            }),
          }
        ]
      ]
    }
  }
);
```

---

## Core Handlers

The bot is modular, with the following handlers in the `core/handle` directory:

* **`callback.js`**: Handles button interactions and executes the `onCallback` method.
* **`chat.js`**: Detects and runs commands with `onChat` from general conversations.
* **`command.js`**: Processes and validates user commands, permissions, and cooldowns.
* **`event.js`**: Handles Telegram events like joins or leaves, triggering event responses.
* **`reply.js`**: Detects replies to bot messages and triggers `onReply` handlers.
* **`word.js`**: Auto-detects keywords and runs `onWord` command logic.

---

## Support

If you encounter issues or have suggestions:

* Open an issue on the [GitHub repository](https://github.com/shawndesu/chaldea)
* Contact me directly via [Facebook](https://www.facebook.com/lance.cochangco)

---

## Credits

Developed and maintained by the **Ajiro Team**.
Special thanks to all contributors and testers.