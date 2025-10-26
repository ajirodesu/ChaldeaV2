/**
 * Lightweight response wrapper around node-telegram-bot-api for concise replies.
 * Automatically replies to the triggering message in groups unless disabled via { noReply: true }.
 */
export class R {
  constructor(bot, msg) {
    this.bot = bot;
    this.msg = msg;
    this.chatId = msg.chat.id;
  }

  _getOptions(options = {}) {
    const finalOptions = { ...options };
    if (this.msg.chat.type !== 'private' && !options.noReply && !('reply_to_message_id' in options)) {
      finalOptions.reply_to_message_id = this.msg.message_id;
    }
    if ('noReply' in finalOptions) {
      delete finalOptions.noReply;
    }
    return finalOptions;
  }

  /** Resolve a message target (message object | message_id | {chatId,messageId}|{chat_id,message_id}) */
  _resolveTarget(target) {
    if (!target) return { chat_id: this.chatId, message_id: undefined };
    if (typeof target === 'number') return { chat_id: this.chatId, message_id: target };
    if (typeof target === 'object') {
      if (typeof target.message_id === 'number') {
        const targetChatId = target.chat?.id ?? this.chatId;
        return { chat_id: targetChatId, message_id: target.message_id };
      }
      if (typeof target.messageId === 'number') {
        const targetChatId = target.chatId ?? this.chatId;
        return { chat_id: targetChatId, message_id: target.messageId };
      }
      if (typeof target.chat_id !== 'undefined' && typeof target.message_id !== 'undefined') {
        return { chat_id: target.chat_id, message_id: target.message_id };
      }
      if (typeof target.chatId !== 'undefined' && typeof target.messageId !== 'undefined') {
        return { chat_id: target.chatId, message_id: target.messageId };
      }
    }
    return { chat_id: this.chatId, message_id: undefined };
  }

  /** Send a text message without automatic reply */
  send(text, options = {}) {
    return this.bot.sendMessage(this.chatId, text, options);
  }

  /** Send a text message */
  reply(text, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendMessage(this.chatId, text, finalOptions);
  }

  /** Send a photo */
  photo(photo, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendPhoto(this.chatId, photo, finalOptions);
  }

  audio(audio, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendAudio(this.chatId, audio, finalOptions);
  }

  document(document, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendDocument(this.chatId, document, finalOptions);
  }

  sticker(sticker, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendSticker(this.chatId, sticker, finalOptions);
  }

  video(video, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVideo(this.chatId, video, finalOptions);
  }

  animation(animation, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendAnimation(this.chatId, animation, finalOptions);
  }

  voice(voice, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVoice(this.chatId, voice, finalOptions);
  }

  videoNote(videoNote, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVideoNote(this.chatId, videoNote, finalOptions);
  }

  mediaGroup(media, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendMediaGroup(this.chatId, media, finalOptions);
  }

  location(latitude, longitude, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendLocation(this.chatId, latitude, longitude, finalOptions);
  }

  venue(latitude, longitude, title, address, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVenue(this.chatId, latitude, longitude, title, address, finalOptions);
  }

  contact(phoneNumber, firstName, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendContact(this.chatId, phoneNumber, firstName, finalOptions);
  }

  poll(question, pollOptions, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendPoll(this.chatId, question, pollOptions, finalOptions);
  }

  dice(options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendDice(this.chatId, finalOptions);
  }

  /** Edit an existing message's text */
  editText(target, text, options = {}) {
    const ids = this._resolveTarget(target);
    const finalOptions = { ...options, chat_id: ids.chat_id, message_id: ids.message_id };
    return this.bot.editMessageText(text, finalOptions);
  }

  /** Edit an existing message's caption */
  editCaption(target, caption, options = {}) {
    const ids = this._resolveTarget(target);
    const finalOptions = { ...options, chat_id: ids.chat_id, message_id: ids.message_id };
    return this.bot.editMessageCaption(caption, finalOptions);
  }

  /** Edit an existing message's media */
  editMedia(target, media, options = {}) {
    const ids = this._resolveTarget(target);
    const finalOptions = { ...options, chat_id: ids.chat_id, message_id: ids.message_id };
    return this.bot.editMessageMedia(media, finalOptions);
  }

  /** Edit an existing message's inline keyboard (reply markup) */
  editMarkup(target, replyMarkup) {
    const ids = this._resolveTarget(target);
    return this.bot.editMessageReplyMarkup(replyMarkup, {
      chat_id: ids.chat_id,
      message_id: ids.message_id,
    });
  }

  /** Delete a message */
  delete(target) {
    const ids = this._resolveTarget(target);
    return this.bot.deleteMessage(ids.chat_id, ids.message_id);
  }

  /** Send a chat action (typing, upload_photo, etc.) */
  action(action = 'typing') {
    return this.bot.sendChatAction(this.chatId, action);
  }

  /** Notify all configured bot owners */
  forOwner(text, options = {}) {
    const ownerIds = global.settings.owner || [];
    const promises = ownerIds.map(ownerId => this.bot.sendMessage(ownerId, text, options));
    return Promise.all(promises);
  }

  /** Backward-compat alias; prefer forOwner */
  forAdmin(text, options = {}) {
    return this.forOwner(text, options);
  }
}

// Backward-compat export for legacy imports
export const Message = R;