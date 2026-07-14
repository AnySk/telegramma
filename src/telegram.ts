import * as tg from './core/types/typegram'
import * as tt from './telegram-types'
import ApiClient from './core/network/client'
import { isAbsolute } from 'path'
import { URL } from 'url'
import { FmtString } from './format'
import { fmtCaption } from './core/helpers/util'

export class Telegram extends ApiClient {
  /**
   * Get basic information about the bot
   */
  getMe() {
    return this.callApi('getMe', {})
  }

  /**
   * Get basic info about a file and prepare it for downloading.
   * @param fileId Id of file to get link to
   */
  getFile(fileId: string) {
    return this.callApi('getFile', { file_id: fileId })
  }

  /**
   * Get download link to a file.
   */
  async getFileLink(fileId: string | tg.File) {
    if (typeof fileId === 'string') {
      fileId = await this.getFile(fileId)
    } else if (fileId.file_path === undefined) {
      fileId = await this.getFile(fileId.file_id)
    }

    // Local bot API instances return the absolute path to the file
    if (fileId.file_path !== undefined && isAbsolute(fileId.file_path)) {
      const url = new URL(this.options.apiRoot)
      url.port = ''
      url.pathname = fileId.file_path
      url.protocol = 'file:'
      return url
    }

    return new URL(
      `./file/${this.options.apiMode}${this.token}${
        this.options.testEnv ? '/test' : ''
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      }/${fileId.file_path!}`,
      this.options.apiRoot
    )
  }

  /**
   * Directly request incoming updates.
   * You should probably use `Telegraf::launch` instead.
   */
  getUpdates(
    timeout: number,
    limit: number,
    offset: number,
    allowedUpdates: readonly tt.UpdateType[] | undefined
  ) {
    return this.callApi('getUpdates', {
      allowed_updates: allowedUpdates,
      limit,
      offset,
      timeout,
    })
  }

  getWebhookInfo() {
    return this.callApi('getWebhookInfo', {})
  }

  getGameHighScores(
    userId: number,
    inlineMessageId: string | undefined,
    chatId: number | undefined,
    messageId: number | undefined
  ) {
    return this.callApi('getGameHighScores', {
      user_id: userId,
      inline_message_id: inlineMessageId,
      chat_id: chatId,
      message_id: messageId,
    })
  }

  setGameScore(
    userId: number,
    score: number,
    inlineMessageId: string | undefined,
    chatId: number | undefined,
    messageId: number | undefined,
    editMessage = true,
    force = false
  ) {
    return this.callApi('setGameScore', {
      force,
      score,
      user_id: userId,
      inline_message_id: inlineMessageId,
      chat_id: chatId,
      message_id: messageId,
      disable_edit_message: !editMessage,
    })
  }

  /**
   * Specify a url to receive incoming updates via an outgoing webhook.
   * @param url HTTPS url to send updates to. Use an empty string to remove webhook integration
   */
  setWebhook(url: string, extra?: tt.ExtraSetWebhook) {
    return this.callApi('setWebhook', {
      url,
      ...extra,
    })
  }

  /**
   * Remove webhook integration.
   */
  deleteWebhook(extra?: { drop_pending_updates?: boolean }) {
    return this.callApi('deleteWebhook', {
      ...extra,
    })
  }

  /**
   * Send a text message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param text Text of the message to be sent
   */
  sendMessage(
    chatId: number | string,
    text: string | FmtString,
    extra?: tt.ExtraReplyMessage
  ) {
    const t = FmtString.normalise(text)
    return this.callApi('sendMessage', { chat_id: chatId, ...extra, ...t })
  }

  /**
   * Forward existing message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
   * @param messageId Message identifier in the chat specified in from_chat_id
   */
  forwardMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
    extra?: tt.ExtraForwardMessage
  ) {
    return this.callApi('forwardMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Use this method to forward multiple messages of any kind. If some of the specified messages can't be found or forwarded, they are skipped. Service messages and messages with protected content can't be forwarded. Album grouping is kept for forwarded messages.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername)
   * @param messageIds Identifiers of 1-100 messages in the chat from_chat_id to forward. The identifiers must be specified in a strictly increasing order.
   */
  forwardMessages(
    chatId: number | string,
    fromChatId: number | string,
    messageIds: number[],
    extra?: tt.ExtraForwardMessages
  ) {
    return this.callApi('forwardMessages', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_ids: messageIds,
      ...extra,
    })
  }

  /**
   * Use this method when you need to tell the user that something is happening on the bot's side.
   * The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendChatAction(
    chat_id: number | string,
    action: tt.ChatAction,
    extra?: tt.ExtraSendChatAction
  ) {
    return this.callApi('sendChatAction', { chat_id, action, ...extra })
  }

  /**
   * Use this method to change the chosen reactions on a message. Service messages can't be reacted to.
   * Automatically forwarded messages from a channel to its discussion group have the same available
   * reactions as messages in the channel. In albums, bots must react to the first message.
   * @param chat_id Unique identifier for the target chat or username of the target channel (in the format `@channelusername`)
   * @param message_id Identifier of the target message
   * @param reaction New list of reaction types to set on the message. Currently, as non-premium users, bots can set up
   * to one reaction per message. A custom emoji reaction can be used if it is either already present on the message
   * or explicitly allowed by chat administrators.
   * @param is_big Pass True to set the reaction with a big animation
   * @returns
   */
  setMessageReaction(
    chat_id: number | string,
    message_id: number,
    reaction?: tg.ReactionType[],
    is_big?: boolean
  ) {
    return this.callApi('setMessageReaction', {
      chat_id,
      message_id,
      reaction,
      is_big,
    })
  }

  getUserProfilePhotos(userId: number, offset?: number, limit?: number) {
    return this.callApi('getUserProfilePhotos', {
      user_id: userId,
      offset,
      limit,
    })
  }

  /**
   * Send point on the map.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendLocation(
    chatId: number | string,
    latitude: number,
    longitude: number,
    extra?: tt.ExtraLocation
  ) {
    return this.callApi('sendLocation', {
      chat_id: chatId,
      latitude,
      longitude,
      ...extra,
    })
  }

  sendVenue(
    chatId: number | string,
    latitude: number,
    longitude: number,
    title: string,
    address: string,
    extra?: tt.ExtraVenue
  ) {
    return this.callApi('sendVenue', {
      latitude,
      longitude,
      title,
      address,
      chat_id: chatId,
      ...extra,
    })
  }

  /**
   * @param chatId Unique identifier for the target private chat
   */
  sendInvoice(
    chatId: number | string,
    invoice: tt.NewInvoiceParameters,
    extra?: tt.ExtraInvoice
  ) {
    return this.callApi('sendInvoice', {
      chat_id: chatId,
      ...invoice,
      ...extra,
    })
  }

  sendContact(
    chatId: number | string,
    phoneNumber: string,
    firstName: string,
    extra?: tt.ExtraContact
  ) {
    return this.callApi('sendContact', {
      chat_id: chatId,
      phone_number: phoneNumber,
      first_name: firstName,
      ...extra,
    })
  }

  /**
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendPhoto(
    chatId: number | string,
    photo: tg.Opts<'sendPhoto'>['photo'],
    extra?: tt.ExtraPhoto
  ) {
    return this.callApi('sendPhoto', {
      chat_id: chatId,
      photo,
      ...fmtCaption(extra),
    })
  }

  /**
   * Send a dice, which will have a random value from 1 to 6.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendDice(chatId: number | string, extra?: tt.ExtraDice) {
    return this.callApi('sendDice', { chat_id: chatId, ...extra })
  }

  /**
   * Send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendDocument(
    chatId: number | string,
    document: tg.Opts<'sendDocument'>['document'],
    extra?: tt.ExtraDocument
  ) {
    return this.callApi('sendDocument', {
      chat_id: chatId,
      document,
      ...fmtCaption(extra),
    })
  }

  /**
   * Send audio files, if you want Telegram clients to display them in the music player.
   * Your audio must be in the .mp3 format.
   * Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendAudio(
    chatId: number | string,
    audio: tg.Opts<'sendAudio'>['audio'],
    extra?: tt.ExtraAudio
  ) {
    return this.callApi('sendAudio', {
      chat_id: chatId,
      audio,
      ...fmtCaption(extra),
    })
  }

  /**
   * Send .webp, animated .tgs, or video .webm stickers
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendSticker(
    chatId: number | string,
    sticker: tg.Opts<'sendSticker'>['sticker'],
    extra?: tt.ExtraSticker
  ) {
    return this.callApi('sendSticker', { chat_id: chatId, sticker, ...extra })
  }

  /**
   * Send video files, Telegram clients support mp4 videos (other formats may be sent as Document).
   * Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendVideo(
    chatId: number | string,
    video: tg.Opts<'sendVideo'>['video'],
    extra?: tt.ExtraVideo
  ) {
    return this.callApi('sendVideo', {
      chat_id: chatId,
      video,
      ...fmtCaption(extra),
    })
  }

  /**
   * Send .gif animations.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendAnimation(
    chatId: number | string,
    animation: tg.Opts<'sendAnimation'>['animation'],
    extra?: tt.ExtraAnimation
  ) {
    return this.callApi('sendAnimation', {
      chat_id: chatId,
      animation,
      ...fmtCaption(extra),
    })
  }

  /**
   * Send video messages.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendVideoNote(
    chatId: number | string,
    videoNote: string | tg.InputFileVideoNote,
    extra?: tt.ExtraVideoNote
  ) {
    return this.callApi('sendVideoNote', {
      chat_id: chatId,
      video_note: videoNote,
      ...extra,
    })
  }

  /**
   * Send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .ogg file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendVoice(
    chatId: number | string,
    voice: tg.Opts<'sendVoice'>['voice'],
    extra?: tt.ExtraVoice
  ) {
    return this.callApi('sendVoice', {
      chat_id: chatId,
      voice,
      ...fmtCaption(extra),
    })
  }

  /**
   * @param chatId Unique identifier for the target chat
   * @param gameShortName Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
   */
  sendGame(chatId: number, gameName: string, extra?: tt.ExtraGame) {
    return this.callApi('sendGame', {
      chat_id: chatId,
      game_short_name: gameName,
      ...extra,
    })
  }

  /**
   * Send a group of photos or videos as an album.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param media A JSON-serialized array describing photos and videos to be sent, must include 2–10 items
   */
  sendMediaGroup(
    chatId: number | string,
    media: tt.MediaGroup,
    extra?: tt.ExtraMediaGroup
  ) {
    return this.callApi('sendMediaGroup', { chat_id: chatId, media, ...extra })
  }

  /**
   * Send a native poll.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param question Poll question, 1-255 characters
   * @param options A JSON-serialized list of answer options, 2-10 strings 1-100 characters each
   */
  sendPoll(
    chatId: number | string,
    question: string,
    options: readonly (string | tg.InputPollOption<tg.InputFile>)[],
    extra?: tt.ExtraPoll
  ) {
    return this.callApi('sendPoll', {
      chat_id: chatId,
      type: 'regular',
      question,
      options: options.map((o) => (typeof o === 'string' ? { text: o } : o)),
      ...extra,
    })
  }

  /**
   * Send a native quiz.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param question Poll question, 1-255 characters
   * @param options A JSON-serialized list of answer options, 2-10 strings 1-100 characters each
   */
  sendQuiz(
    chatId: number | string,
    question: string,
    options: readonly (string | tg.InputPollOption<tg.InputFile>)[],
    extra?: tt.ExtraPoll
  ) {
    return this.callApi('sendPoll', {
      chat_id: chatId,
      type: 'quiz',
      question,
      options: options.map((o) => (typeof o === 'string' ? { text: o } : o)),
      ...extra,
    })
  }

  /**
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Identifier of the original message with the poll
   */
  stopPoll(
    chatId: number | string,
    messageId: number,
    extra?: tt.ExtraStopPoll
  ) {
    return this.callApi('stopPoll', {
      chat_id: chatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.).
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  getChat(chatId: number | string) {
    return this.callApi('getChat', { chat_id: chatId })
  }

  /**
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  getChatAdministrators(chatId: number | string) {
    return this.callApi('getChatAdministrators', { chat_id: chatId })
  }

  /**
   * Get information about a member of a chat.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @param userId Unique identifier of the target user
   */
  getChatMember(chatId: string | number, userId: number) {
    return this.callApi('getChatMember', { chat_id: chatId, user_id: userId })
  }

  /**
   * Get the number of members in a chat.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  getChatMemberCount(chatId: string | number) {
    return this.callApi('getChatMemberCount', { chat_id: chatId })
  }

  /**
   * @deprecated since API 5.3. Use {@link Telegram.getChatMemberCount}
   */
  get getChatMembersCount() {
    return this.getChatMemberCount
  }

  /**
   * Send answers to an inline query.
   * No more than 50 results per query are allowed.
   */
  answerInlineQuery(
    inlineQueryId: string,
    results: readonly tg.InlineQueryResult[],
    extra?: tt.ExtraAnswerInlineQuery
  ) {
    return this.callApi('answerInlineQuery', {
      inline_query_id: inlineQueryId,
      results,
      ...extra,
    })
  }

  setChatPermissions(
    chatId: number | string,
    permissions: tg.ChatPermissions,
    extra?: tt.ExtraSetChatPermissions
  ) {
    return this.callApi('setChatPermissions', {
      chat_id: chatId,
      permissions,
      ...extra,
    })
  }

  /**
   * Kick a user from a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the group on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param untilDate Date when the user will be unbanned, unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever
   */
  banChatMember(
    chatId: number | string,
    userId: number,
    untilDate?: number,
    extra?: tt.ExtraBanChatMember
  ) {
    return this.callApi('banChatMember', {
      chat_id: chatId,
      user_id: userId,
      until_date: untilDate,
      ...extra,
    })
  }

  /**
   * Kick a user from a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the group on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param untilDate Date when the user will be unbanned, unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever
   * @deprecated since API 5.3. Use {@link Telegram.banChatMember}
   */
  get kickChatMember() {
    return this.banChatMember
  }

  /**
   * Promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Pass False for all boolean parameters to demote a user.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format `@channelusername`)
   */
  promoteChatMember(
    chatId: number | string,
    userId: number,
    extra: tt.ExtraPromoteChatMember
  ) {
    return this.callApi('promoteChatMember', {
      chat_id: chatId,
      user_id: userId,
      ...extra,
    })
  }

  /**
   * Restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate admin rights. Pass True for all boolean parameters to lift restrictions from a user.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   */
  restrictChatMember(
    chatId: string | number,
    userId: number,
    extra: tt.ExtraRestrictChatMember
  ) {
    return this.callApi('restrictChatMember', {
      chat_id: chatId,
      user_id: userId,
      ...extra,
    })
  }

  setChatAdministratorCustomTitle(
    chatId: number | string,
    userId: number,
    title: string
  ) {
    return this.callApi('setChatAdministratorCustomTitle', {
      chat_id: chatId,
      user_id: userId,
      custom_title: title,
    })
  }

  /**
   * Export an invite link to a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  exportChatInviteLink(chatId: number | string) {
    return this.callApi('exportChatInviteLink', { chat_id: chatId })
  }

  createChatInviteLink(
    chatId: number | string,
    extra?: tt.ExtraCreateChatInviteLink
  ) {
    return this.callApi('createChatInviteLink', {
      chat_id: chatId,
      ...extra,
    })
  }

  createInvoiceLink(invoice: tt.NewInvoiceLinkParameters) {
    return this.callApi('createInvoiceLink', {
      ...invoice,
    })
  }

  editChatInviteLink(
    chatId: number | string,
    inviteLink: string,
    extra?: tt.ExtraEditChatInviteLink
  ) {
    return this.callApi('editChatInviteLink', {
      chat_id: chatId,
      invite_link: inviteLink,
      ...extra,
    })
  }

  revokeChatInviteLink(chatId: number | string, inviteLink: string) {
    return this.callApi('revokeChatInviteLink', {
      chat_id: chatId,
      invite_link: inviteLink,
    })
  }

  setChatPhoto(
    chatId: number | string,
    photo: tg.Opts<'setChatPhoto'>['photo']
  ) {
    return this.callApi('setChatPhoto', { chat_id: chatId, photo })
  }

  deleteChatPhoto(chatId: number | string) {
    return this.callApi('deleteChatPhoto', { chat_id: chatId })
  }

  /**
   * Change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param title New chat title, 1-255 characters
   */
  setChatTitle(chatId: number | string, title: string) {
    return this.callApi('setChatTitle', { chat_id: chatId, title })
  }

  setChatDescription(chatId: number | string, description?: string) {
    return this.callApi('setChatDescription', { chat_id: chatId, description })
  }

  /**
   * Pin a message in a group, a supergroup, or a channel. The bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in the supergroup or 'can_edit_messages' admin right in the channel.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   */
  pinChatMessage(
    chatId: number | string,
    messageId: number,
    extra?: { disable_notification?: boolean }
  ) {
    return this.callApi('pinChatMessage', {
      chat_id: chatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Unpin a message in a group, a supergroup, or a channel. The bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in the supergroup or 'can_edit_messages' admin right in the channel.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  unpinChatMessage(chatId: number | string, messageId?: number) {
    return this.callApi('unpinChatMessage', {
      chat_id: chatId,
      message_id: messageId,
    })
  }

  /**
   * Clear the list of pinned messages in a chat.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  unpinAllChatMessages(chatId: number | string) {
    return this.callApi('unpinAllChatMessages', { chat_id: chatId })
  }

  /**
   * Use this method for your bot to leave a group, supergroup or channel.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  leaveChat(chatId: number | string) {
    return this.callApi('leaveChat', { chat_id: chatId })
  }

  /**
   * Unban a user from a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format @username)
   * @param userId Unique identifier of the target user
   */
  unbanChatMember(
    chatId: number | string,
    userId: number,
    extra?: { only_if_banned?: boolean }
  ) {
    return this.callApi('unbanChatMember', {
      chat_id: chatId,
      user_id: userId,
      ...extra,
    })
  }

  answerCbQuery(
    callbackQueryId: string,
    text?: string,
    extra?: tt.ExtraAnswerCbQuery
  ) {
    return this.callApi('answerCallbackQuery', {
      text,
      callback_query_id: callbackQueryId,
      ...extra,
    })
  }

  answerGameQuery(callbackQueryId: string, url: string) {
    return this.callApi('answerCallbackQuery', {
      url,
      callback_query_id: callbackQueryId,
    })
  }

  /**
   * Use this method to get the list of boosts added to a chat by a user. Requires administrator rights in the chat. Returns a UserChatBoosts object.
   * @param chat_id Unique identifier for the chat or username of the channel (in the format `@channelusername`)
   * @param user_id Unique identifier of the target user
   */
  getUserChatBoosts(chat_id: number | string, user_id: number) {
    return this.callApi('getUserChatBoosts', {
      chat_id,
      user_id,
    })
  }

  /**
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified,
   * the Bot API will send an Update with a shipping_query field to the bot.
   * Reply to shipping queries.
   * @param ok  Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   */
  answerShippingQuery(
    shippingQueryId: string,
    ok: boolean,
    shippingOptions: readonly tg.ShippingOption[] | undefined,
    errorMessage: string | undefined
  ) {
    return this.callApi('answerShippingQuery', {
      ok,
      shipping_query_id: shippingQueryId,
      shipping_options: shippingOptions,
      error_message: errorMessage,
    })
  }

  /**
   * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query.
   * Respond to such pre-checkout queries. On success, True is returned.
   * Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
   * @param ok  Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user.
   */
  answerPreCheckoutQuery(
    preCheckoutQueryId: string,
    ok: boolean,
    errorMessage?: string
  ) {
    return this.callApi('answerPreCheckoutQuery', {
      ok,
      pre_checkout_query_id: preCheckoutQueryId,
      error_message: errorMessage,
    })
  }

  answerWebAppQuery(webAppQueryId: string, result: tg.InlineQueryResult) {
    return this.callApi('answerWebAppQuery', {
      web_app_query_id: webAppQueryId,
      result,
    })
  }

  /**
   * Edit text and game messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param text New text of the message
   */
  editMessageText(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    text: string | FmtString,
    extra?: tt.ExtraEditMessageText
  ) {
    const t = FmtString.normalise(text)
    return this.callApi('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      ...extra,
      ...t,
      // editMessageText is overloaded on chat_id/inline_message_id presence; this
      // generic wrapper supplies whichever the caller passed.
    } as unknown as tg.Opts<'editMessageText'>)
  }

  /**
   * Edit captions of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param caption New caption of the message
   * @param markup A JSON-serialized object for an inline keyboard.
   */
  editMessageCaption(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    caption: string | FmtString | undefined,
    extra?: tt.ExtraEditMessageCaption
  ) {
    return this.callApi('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      ...extra,
      ...fmtCaption({ caption }),
    })
  }

  /**
   * Edit animation, audio, document, photo, or video messages.
   * If a message is a part of a message album, then it can be edited only to a photo or a video.
   * Otherwise, message type can be changed arbitrarily.
   * When inline message is edited, new file can't be uploaded.
   * Use previously uploaded file via its file_id or specify a URL.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param media New media of message
   * @param extra Additional parameters, such as reply_markup
   */
  editMessageMedia(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    media: tt.WrapCaption<tg.InputMedia>,
    extra?: tt.ExtraEditMessageMedia
  ) {
    return this.callApi('editMessageMedia', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      media: fmtCaption(media),
      ...extra,
    })
  }

  /**
   * Edit only the reply markup of messages sent by the bot or via the bot (for inline bots).
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param markup A JSON-serialized object for an inline keyboard.
   * @returns If edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   */
  editMessageReplyMarkup(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    markup: tg.InlineKeyboardMarkup | undefined
  ) {
    return this.callApi('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      reply_markup: markup,
    })
  }

  /**
   * Edit an ephemeral text message.
   * Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @username)
   * @param receiverUserId Identifier of the user who received the message
   * @param ephemeralMessageId Identifier of the ephemeral message to edit
   * @param text New text of the message
   */
  editEphemeralMessageText(
    chatId: number | string,
    receiverUserId: number,
    ephemeralMessageId: number,
    text: string | FmtString,
    extra?: tt.ExtraEditEphemeralMessageText
  ) {
    const t = FmtString.normalise(text)
    return this.callApi('editEphemeralMessageText', {
      chat_id: chatId,
      receiver_user_id: receiverUserId,
      ephemeral_message_id: ephemeralMessageId,
      ...extra,
      ...t,
    })
  }

  /**
   * Edit the caption of an ephemeral message.
   * Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @username)
   * @param receiverUserId Identifier of the user who received the message
   * @param ephemeralMessageId Identifier of the ephemeral message to edit
   * @param caption New caption of the message
   */
  editEphemeralMessageCaption(
    chatId: number | string,
    receiverUserId: number,
    ephemeralMessageId: number,
    caption: string | FmtString | undefined,
    extra?: tt.ExtraEditEphemeralMessageCaption
  ) {
    return this.callApi('editEphemeralMessageCaption', {
      chat_id: chatId,
      receiver_user_id: receiverUserId,
      ephemeral_message_id: ephemeralMessageId,
      ...extra,
      ...fmtCaption({ caption }),
    })
  }

  /**
   * Edit the media of an ephemeral message. A new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL.
   * Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @username)
   * @param receiverUserId Identifier of the user who received the message
   * @param ephemeralMessageId Identifier of the ephemeral message to edit
   * @param media New media content of the message
   */
  editEphemeralMessageMedia(
    chatId: number | string,
    receiverUserId: number,
    ephemeralMessageId: number,
    media: tt.WrapCaption<tg.InputMedia>,
    extra?: tt.ExtraEditEphemeralMessageMedia
  ) {
    return this.callApi('editEphemeralMessageMedia', {
      chat_id: chatId,
      receiver_user_id: receiverUserId,
      ephemeral_message_id: ephemeralMessageId,
      media: fmtCaption(media),
      ...extra,
    })
  }

  /**
   * Edit only the reply markup of an ephemeral message.
   * Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @username)
   * @param receiverUserId Identifier of the user who received the message
   * @param ephemeralMessageId Identifier of the ephemeral message to edit
   * @param markup Object for an inline keyboard
   */
  editEphemeralMessageReplyMarkup(
    chatId: number | string,
    receiverUserId: number,
    ephemeralMessageId: number,
    markup: tg.InlineKeyboardMarkup | undefined
  ) {
    return this.callApi('editEphemeralMessageReplyMarkup', {
      chat_id: chatId,
      receiver_user_id: receiverUserId,
      ephemeral_message_id: ephemeralMessageId,
      reply_markup: markup,
    })
  }

  editMessageLiveLocation(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    latitude: number,
    longitude: number,
    extra?: tt.ExtraEditMessageLiveLocation
  ) {
    return this.callApi('editMessageLiveLocation', {
      latitude,
      longitude,
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      ...extra,
    })
  }

  stopMessageLiveLocation(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    markup?: tg.InlineKeyboardMarkup
  ) {
    return this.callApi('stopMessageLiveLocation', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      reply_markup: markup,
    })
  }

  /**
   * Delete a message, including service messages, with the following limitations:
   * - A message can only be deleted if it was sent less than 48 hours ago.
   * - Bots can delete outgoing messages in groups and supergroups.
   * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
   * - If the bot is an administrator of a group, it can delete any message there.
   * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Identifier of the message to delete
   */
  deleteMessage(chatId: number | string, messageId: number) {
    return this.callApi('deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    })
  }

  /**
   * Use this method to delete multiple messages simultaneously. If some of the specified messages can't be found, they are skipped.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageIds Identifiers of 1-100 messages to delete. See deleteMessage for limitations on which messages can be deleted
   */
  deleteMessages(chatId: number | string, messageIds: number[]) {
    return this.callApi('deleteMessages', {
      chat_id: chatId,
      message_ids: messageIds,
    })
  }

  /**
   * Delete an ephemeral message.
   * Note that it is not guaranteed that the user will receive the message deletion event, especially if they are offline.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @username)
   * @param receiverUserId Identifier of the user who received the message
   * @param ephemeralMessageId Identifier of the ephemeral message to delete
   */
  deleteEphemeralMessage(
    chatId: number | string,
    receiverUserId: number,
    ephemeralMessageId: number
  ) {
    return this.callApi('deleteEphemeralMessage', {
      chat_id: chatId,
      receiver_user_id: receiverUserId,
      ephemeral_message_id: ephemeralMessageId,
    })
  }

  setChatStickerSet(chatId: number | string, setName: string) {
    return this.callApi('setChatStickerSet', {
      chat_id: chatId,
      sticker_set_name: setName,
    })
  }

  deleteChatStickerSet(chatId: number | string) {
    return this.callApi('deleteChatStickerSet', { chat_id: chatId })
  }

  /**
   * Use this method to get custom emoji stickers, which can be used as a forum topic icon by any user.
   * Requires no parameters. Returns an Array of Sticker objects.
   *
   * @see https://core.telegram.org/bots/api#getforumtopiciconstickers
   */
  getForumTopicIconStickers() {
    return this.callApi('getForumTopicIconStickers', {})
  }

  /**
   * Use this method to create a topic in a forum supergroup chat. The bot must be an administrator in the chat for this
   * to work and must have the can_manage_topics administrator rights. Returns information about the created topic as a
   * ForumTopic object.
   *
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param name Topic name, 1-128 characters
   *
   * @see https://core.telegram.org/bots/api#createforumtopic
   */
  createForumTopic(
    chat_id: number | string,
    name: string,
    extra?: tt.ExtraCreateForumTopic
  ) {
    return this.callApi('createForumTopic', {
      chat_id,
      name,
      ...extra,
    })
  }

  /**
   * Use this method to edit name and icon of a topic in a forum supergroup chat. The bot must be an administrator in
   * the chat for this to work and must have can_manage_topics administrator rights, unless it is the creator of the
   * topic. Returns True on success.
   *
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message_thread_id Unique identifier for the target message thread of the forum topic
   *
   * @see https://core.telegram.org/bots/api#editforumtopic
   */
  editForumTopic(
    chat_id: number | string,
    message_thread_id: number,
    extra: tt.ExtraEditForumTopic
  ) {
    return this.callApi('editForumTopic', {
      chat_id,
      message_thread_id,
      ...extra,
    })
  }

  /**
   * Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat
   * for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic.
   * Returns True on success.
   *
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message_thread_id Unique identifier for the target message thread of the forum topic
   *
   * @see https://core.telegram.org/bots/api#closeforumtopic
   */
  closeForumTopic(chat_id: number | string, message_thread_id: number) {
    return this.callApi('closeForumTopic', {
      chat_id,
      message_thread_id,
    })
  }

  /**
   * Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat
   * for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic.
   * Returns True on success.
   *
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message_thread_id Unique identifier for the target message thread of the forum topic
   *
   * @see https://core.telegram.org/bots/api#reopenforumtopic
   */
  reopenForumTopic(chat_id: number | string, message_thread_id: number) {
    return this.callApi('reopenForumTopic', {
      chat_id,
      message_thread_id,
    })
  }

  /**
   * Use this method to delete a forum topic along with all its messages in a forum supergroup chat. The bot must be an
   * administrator in the chat for this to work and must have the can_delete_messages administrator rights.
   * Returns True on success.
   *
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message_thread_id Unique identifier for the target message thread of the forum topic
   *
   * @see https://core.telegram.org/bots/api#deleteforumtopic
   */
  deleteForumTopic(chat_id: number | string, message_thread_id: number) {
    return this.callApi('deleteForumTopic', {
      chat_id,
      message_thread_id,
    })
  }

  /**
   * Use this method to clear the list of pinned messages in a forum topic. The bot must be an administrator in the chat
   * for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
   *
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message_thread_id Unique identifier for the target message thread of the forum topic
   *
   * @see https://core.telegram.org/bots/api#unpinallforumtopicmessages
   */
  unpinAllForumTopicMessages(
    chat_id: number | string,
    message_thread_id: number
  ) {
    return this.callApi('unpinAllForumTopicMessages', {
      chat_id,
      message_thread_id,
    })
  }

  /**
   * Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator
   * in the chat for this to work and must have can_manage_topics administrator rights. Returns True on success.
   *
   * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @param name New topic name, 1-128 characters
   *
   * @see https://core.telegram.org/bots/api#editgeneralforumtopic
   */
  editGeneralForumTopic(chat_id: number | string, name: string) {
    return this.callApi('editGeneralForumTopic', { chat_id, name })
  }

  /**
   * Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the
   * chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
   *
   * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   *
   * @see https://core.telegram.org/bots/api#closegeneralforumtopic
   */
  closeGeneralForumTopic(chat_id: number | string) {
    return this.callApi('closeGeneralForumTopic', { chat_id })
  }

  /**
   * Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in
   * the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically
   * unhidden if it was hidden. Returns True on success.
   *
   * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   *
   * @see https://core.telegram.org/bots/api#reopengeneralforumtopic
   */
  reopenGeneralForumTopic(chat_id: number | string) {
    return this.callApi('reopenGeneralForumTopic', { chat_id })
  }

  /**
   * Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat
   * for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed
   * if it was open. Returns True on success.
   *
   * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   *
   * @see https://core.telegram.org/bots/api#hidegeneralforumtopic
   */
  hideGeneralForumTopic(chat_id: number | string) {
    return this.callApi('hideGeneralForumTopic', { chat_id })
  }

  /**
   * Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the
   * chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
   *
   * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   *
   * @see https://core.telegram.org/bots/api#unhidegeneralforumtopic
   */
  unhideGeneralForumTopic(chat_id: number | string) {
    return this.callApi('unhideGeneralForumTopic', { chat_id })
  }

  /**
   * Use this method to clear the list of pinned messages in a General forum topic.
   * The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator
   * right in the supergroup.
   *
   * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   */
  unpinAllGeneralForumTopicMessages(chat_id: number | string) {
    return this.callApi('unpinAllGeneralForumTopicMessages', { chat_id })
  }

  getStickerSet(name: string) {
    return this.callApi('getStickerSet', { name })
  }

  /**
   * Upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods (can be used multiple times).
   * https://core.telegram.org/bots/api#sending-files
   * @param ownerId User identifier of sticker file owner
   * @param stickerFile Png image with the sticker, must be up to 512 kilobytes in size, dimensions must not exceed 512px, and either width or height must be exactly 512px.
   */
  uploadStickerFile(
    ownerId: number,
    sticker: tg.Opts<'uploadStickerFile'>['sticker'],
    sticker_format: tg.Opts<'uploadStickerFile'>['sticker_format']
  ) {
    return this.callApi('uploadStickerFile', {
      user_id: ownerId,
      sticker_format,
      sticker,
    })
  }

  /**
   * Create new sticker set owned by a user. The bot will be able to edit the created sticker set.
   * @param ownerId User identifier of created sticker set owner
   * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only english letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in “_by_<bot username>”. <bot_username> is case insensitive. 1-64 characters.
   * @param title Sticker set title, 1-64 characters
   */
  createNewStickerSet(
    ownerId: number,
    name: string,
    title: string,
    stickerData: tt.ExtraCreateNewStickerSet
  ) {
    return this.callApi('createNewStickerSet', {
      name,
      title,
      user_id: ownerId,
      ...stickerData,
    })
  }

  /**
   * Add a new sticker to a set created by the bot.
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   */
  addStickerToSet(
    ownerId: number,
    name: string,
    stickerData: tt.ExtraAddStickerToSet
  ) {
    return this.callApi('addStickerToSet', {
      name,
      user_id: ownerId,
      ...stickerData,
    })
  }

  /**
   * Move a sticker in a set created by the bot to a specific position.
   * @param sticker File identifier of the sticker
   * @param position New sticker position in the set, zero-based
   */
  setStickerPositionInSet(sticker: string, position: number) {
    return this.callApi('setStickerPositionInSet', {
      sticker,
      position,
    })
  }

  /**
   * @deprecated since API 6.8. Use {@link Telegram.setStickerSetThumbnail}
   */
  get setStickerSetThumb() {
    return this.setStickerSetThumbnail
  }

  /**
   * Use this method to set the thumbnail of a regular or mask sticker set.
   * The format of the thumbnail file must match the format of the stickers in the set.
   * @param name Sticker set name
   * @param userId User identifier of the sticker set owner
   * @param thumbnail A .WEBP or .PNG image with the thumbnail, must be up to 128 kilobytes in size
   * and have a width and height of exactly 100px, or a .TGS animation with a thumbnail up to
   * 32 kilobytes in size (see
   * [animated sticker technical requirements](https://core.telegram.org/stickers#animated-sticker-requirements)),
   * or a WEBM video with the thumbnail up to 32 kilobytes in size; see
   * [video sticker technical requirements](https://core.telegram.org/stickers#video-sticker-requirements).
   * Pass a file_id as a String to send a file that already exists on the Telegram servers, pass a
   * HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using
   * Input helpers. Animated and video sticker set thumbnails can't be uploaded via HTTP URL.
   * If omitted, then the thumbnail is dropped and the first sticker is used as the thumbnail.
   */
  setStickerSetThumbnail(
    name: string,
    userId: number,
    format: tg.Opts<'setStickerSetThumbnail'>['format'],
    thumbnail?: tg.Opts<'setStickerSetThumbnail'>['thumbnail']
  ) {
    return this.callApi('setStickerSetThumbnail', {
      name,
      user_id: userId,
      format,
      thumbnail,
    })
  }

  setStickerMaskPosition(sticker: string, mask_position?: tg.MaskPosition) {
    return this.callApi('setStickerMaskPosition', { sticker, mask_position })
  }

  setStickerKeywords(sticker: string, keywords?: string[]) {
    return this.callApi('setStickerKeywords', { sticker, keywords })
  }

  setStickerEmojiList(sticker: string, emoji_list: string[]) {
    return this.callApi('setStickerEmojiList', { sticker, emoji_list })
  }

  deleteStickerSet(name: string) {
    return this.callApi('deleteStickerSet', { name })
  }

  setStickerSetTitle(name: string, title: string) {
    return this.callApi('setStickerSetTitle', { name, title })
  }

  setCustomEmojiStickerSetThumbnail(name: string, custom_emoji_id: string) {
    return this.callApi('setCustomEmojiStickerSetThumbnail', {
      name,
      custom_emoji_id,
    })
  }

  /**
   * Delete a sticker from a set created by the bot.
   * @param sticker File identifier of the sticker
   */
  deleteStickerFromSet(sticker: string) {
    return this.callApi('deleteStickerFromSet', { sticker })
  }

  getCustomEmojiStickers(custom_emoji_ids: string[]) {
    return this.callApi('getCustomEmojiStickers', { custom_emoji_ids })
  }

  /**
   * Change the list of the bot's commands.
   * @param commands A list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified.
   */
  setMyCommands(
    commands: readonly tg.BotCommand[],
    extra?: tt.ExtraSetMyCommands
  ) {
    return this.callApi('setMyCommands', { commands, ...extra })
  }

  deleteMyCommands(extra: tg.Opts<'deleteMyCommands'> = {}) {
    return this.callApi('deleteMyCommands', extra)
  }

  /**
   * Get the current list of the bot's commands.
   */
  getMyCommands(extra: tg.Opts<'getMyCommands'> = {}) {
    return this.callApi('getMyCommands', extra)
  }

  /**
   * Use this method to change the bot's description, which is shown in the chat with the bot if the chat is empty.
   * @param description New bot description; 0-512 characters. Pass an empty string to remove the dedicated description for the given language.
   * @param language_code A two-letter ISO 639-1 language code. If empty, the description will be applied to all users for whose language there is no dedicated description.
   */
  setMyDescription(description: string, language_code?: string) {
    return this.callApi('setMyDescription', { description, language_code })
  }

  /**
   * Use this method to change the bot's name.
   * @param name New bot name; 0-64 characters. Pass an empty string to remove the dedicated name for the given language.
   * @param language_code A two-letter ISO 639-1 language code. If empty, the name will be shown to all users for whose language there is no dedicated name.
   */
  setMyName(name: string, language_code?: string) {
    return this.callApi('setMyName', { name, language_code })
  }

  /**
   * Use this method to get the current bot name for the given user language.
   * @param language_code A two-letter ISO 639-1 language code or an empty string
   */
  getMyName(language_code?: string) {
    return this.callApi('getMyName', { language_code })
  }

  /**
   * Use this method to get the current bot description for the given user language.
   * @param language_code A two-letter ISO 639-1 language code.
   */
  getMyDescription(language_code?: string) {
    return this.callApi('getMyDescription', { language_code })
  }

  /**
   * Use this method to change the bot's short description, which is shown on the bot's profile page and is sent together with the link when users share the bot.
   * @param description New short description for the bot; 0-120 characters. Pass an empty string to remove the dedicated short description for the given language.
   * @param language_code A two-letter ISO 639-1 language code. If empty, the short description will be applied to all users for whose language there is no dedicated short description.
   */
  setMyShortDescription(short_description: string, language_code?: string) {
    return this.callApi('setMyShortDescription', {
      short_description,
      language_code,
    })
  }

  /**
   * Use this method to get the current bot short description for the given user language.
   * @param language_code A two-letter ISO 639-1 language code or an empty string
   */
  getMyShortDescription(language_code?: string) {
    return this.callApi('getMyShortDescription', { language_code })
  }

  setPassportDataErrors(
    userId: number,
    errors: readonly tg.PassportElementError[]
  ) {
    return this.callApi('setPassportDataErrors', {
      user_id: userId,
      errors: errors,
    })
  }

  /**
   * Send copy of existing message.
   * @deprecated use `copyMessage` instead
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message Received message object
   */
  sendCopy(
    chatId: number | string,
    message: tg.Message,
    extra?: tt.ExtraCopyMessage
  ): Promise<tg.MessageId> {
    return this.copyMessage(chatId, message.chat.id, message.message_id, extra)
  }

  /**
   * Send copy of existing message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
   * @param messageId Message identifier in the chat specified in from_chat_id
   */
  copyMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
    extra?: tt.ExtraCopyMessage
  ) {
    return this.callApi('copyMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      ...fmtCaption(extra),
    })
  }

  /**
   * Use this method to copy messages of any kind. If some of the specified messages can't be found or copied, they are skipped. Service messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessages, but the copied messages don't have a link to the original message. Album grouping is kept for copied messages.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername)
   * @param messageIds Identifiers of 1-100 messages in the chat from_chat_id to copy. The identifiers must be specified in a strictly increasing order.
   */
  copyMessages(
    chatId: number | string,
    fromChatId: number | string,
    messageIds: number[],
    extra?: tt.ExtraCopyMessages
  ) {
    return this.callApi('copyMessages', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_ids: messageIds,
      ...extra,
    })
  }

  /**
   * Approve a chat join request.
   * The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param userId Unique identifier of the target user
   */
  approveChatJoinRequest(chatId: number | string, userId: number) {
    return this.callApi('approveChatJoinRequest', {
      chat_id: chatId,
      user_id: userId,
    })
  }

  /**
   * Decline a chat join request.
   * The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param userId Unique identifier of the target user
   */
  declineChatJoinRequest(chatId: number | string, userId: number) {
    return this.callApi('declineChatJoinRequest', {
      chat_id: chatId,
      user_id: userId,
    })
  }

  /**
   * Ban a channel chat in a supergroup or a channel. The owner of the chat will not be able to send messages and join live streams on behalf of the chat, unless it is unbanned first.
   * The bot must be an administrator in the supergroup or channel for this to work and must have the appropriate administrator rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param senderChatId Unique identifier of the target sender chat
   */
  banChatSenderChat(
    chatId: number | string,
    senderChatId: number,
    extra?: tt.ExtraBanChatSenderChat
  ) {
    return this.callApi('banChatSenderChat', {
      chat_id: chatId,
      sender_chat_id: senderChatId,
      ...extra,
    })
  }

  /**
   * Unban a previously banned channel chat in a supergroup or channel.
   * The bot must be an administrator for this to work and must have the appropriate administrator rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param senderChatId Unique identifier of the target sender chat
   */
  unbanChatSenderChat(chatId: number | string, senderChatId: number) {
    return this.callApi('unbanChatSenderChat', {
      chat_id: chatId,
      sender_chat_id: senderChatId,
    })
  }

  /**
   * Use this method to change the bot's menu button in a private chat, or the default menu button. Returns true on success.
   * @param chatId Unique identifier for the target private chat. If not specified, default bot's menu button will be changed.
   * @param menuButton An object for the bot's new menu button.
   */
  setChatMenuButton({
    chatId,
    menuButton,
  }: {
    chatId?: number | undefined
    menuButton?: tg.MenuButton | undefined
  } = {}) {
    return this.callApi('setChatMenuButton', {
      chat_id: chatId,
      menu_button: menuButton,
    })
  }

  /**
   * Use this method to get the current value of the bot's menu button in a private chat, or the default menu button. Returns MenuButton on success.
   * @param chatId Unique identifier for the target private chat. If not specified, default bot's menu button will be returned.
   */
  getChatMenuButton({ chatId }: { chatId?: number } = {}) {
    return this.callApi('getChatMenuButton', {
      chat_id: chatId,
    })
  }

  /**
   * Use this method to change the default administrator rights requested by the bot when it's added as an administrator to groups or channels.
   * These rights will be suggested to users, but they are are free to modify the list before adding the bot.
   */
  setMyDefaultAdministratorRights({
    rights,
    forChannels,
  }: {
    rights?: tg.ChatAdministratorRights
    forChannels?: boolean
  } = {}) {
    return this.callApi('setMyDefaultAdministratorRights', {
      rights,
      for_channels: forChannels,
    })
  }

  /**
   * Use this method to get the current default administrator rights of the bot. Returns ChatAdministratorRights on success.
   * @param forChannels Pass true to get default administrator rights of the bot in channels. Otherwise, default administrator rights of the bot for groups and supergroups will be returned.
   */
  getMyDefaultAdministratorRights({
    forChannels,
  }: { forChannels?: boolean } = {}) {
    return this.callApi('getMyDefaultAdministratorRights', {
      for_channels: forChannels,
    })
  }

  /**
   * Remove a reaction from a message in a group or supergroup chat. The bot must have the can_delete_messages administrator right. Returns True on success.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @username)
   * @param messageId Identifier of the target message
   */
  deleteMessageReaction(
    chatId: number | string,
    messageId: number,
    extra?: tt.ExtraDeleteMessageReaction
  ) {
    return this.callApi('deleteMessageReaction', {
      chat_id: chatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Remove up to 10000 recent reactions in a group or supergroup chat added by a given user or chat. The bot must have the can_delete_messages administrator right. Returns True on success.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @username)
   */
  deleteAllMessageReactions(
    chatId: number | string,
    extra?: tt.ExtraDeleteAllMessageReactions
  ) {
    return this.callApi('deleteAllMessageReactions', {
      chat_id: chatId,
      ...extra,
    })
  }

  /**
   * Reply to a received guest message. On success, a SentGuestMessage object is returned.
   * @param guestQueryId Unique identifier for the query to be answered
   * @param result An object describing the message to be sent
   */
  answerGuestQuery(guestQueryId: string, result: tg.InlineQueryResult) {
    return this.callApi('answerGuestQuery', {
      guest_query_id: guestQueryId,
      result,
    })
  }

  /**
   * Get the access settings of a managed bot. Returns a BotAccessSettings object on success.
   * @param userId User identifier of the managed bot whose access settings will be returned
   */
  getManagedBotAccessSettings(userId: number) {
    return this.callApi('getManagedBotAccessSettings', {
      user_id: userId,
    })
  }

  /**
   * Change the access settings of a managed bot. Returns True on success.
   * @param userId User identifier of the managed bot whose access settings will be changed
   * @param isAccessRestricted Pass True if only selected users can access the bot
   */
  setManagedBotAccessSettings(
    userId: number,
    isAccessRestricted: boolean,
    extra?: tt.ExtraSetManagedBotAccessSettings
  ) {
    return this.callApi('setManagedBotAccessSettings', {
      user_id: userId,
      is_access_restricted: isAccessRestricted,
      ...extra,
    })
  }

  /**
   * Get the last messages from the personal chat of a given user. On success, an array of Message objects is returned.
   * @param userId Unique identifier for the target user
   * @param limit The maximum number of messages to return; 1-20
   */
  getUserPersonalChatMessages(userId: number, limit: number) {
    return this.callApi('getUserPersonalChatMessages', {
      user_id: userId,
      limit,
    })
  }

  /**
   * Send a live photo. On success, the sent Message is returned.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param livePhoto Live photo video to send
   * @param photo The static photo to send
   */
  sendLivePhoto(
    chatId: number | string,
    livePhoto: tg.Opts<'sendLivePhoto'>['live_photo'],
    photo: tg.Opts<'sendLivePhoto'>['photo'],
    extra?: tt.ExtraLivePhoto
  ) {
    return this.callApi('sendLivePhoto', {
      chat_id: chatId,
      live_photo: livePhoto,
      photo,
      ...fmtCaption(extra),
    })
  }

  /**
   * Send a rich message. On success, the sent Message is returned.
   * @param chatId Unique identifier for the target chat or username of the target bot, supergroup or channel (in the format @username)
   * @param richMessage The message to be sent
   */
  sendRichMessage(
    chatId: number | string,
    richMessage: tg.InputRichMessage,
    extra?: tt.ExtraRichMessage
  ) {
    return this.callApi('sendRichMessage', {
      chat_id: chatId,
      rich_message: richMessage,
      ...extra,
    })
  }

  /**
   * Stream a partial rich message to a user while it is being generated. Returns True on success.
   * @param chatId Unique identifier for the target private chat
   * @param draftId Unique identifier of the message draft; must be non-zero
   * @param richMessage The partial message to be streamed
   */
  sendRichMessageDraft(
    chatId: number,
    draftId: number,
    richMessage: tg.InputRichMessage,
    extra?: tt.ExtraRichMessageDraft
  ) {
    return this.callApi('sendRichMessageDraft', {
      chat_id: chatId,
      draft_id: draftId,
      rich_message: richMessage,
      ...extra,
    })
  }

  /**
   * Process a received chat join request query. Returns True on success.
   * @param chatJoinRequestQueryId Unique identifier of the join request query
   * @param result Result of the query: "approve", "decline", or "queue"
   */
  answerChatJoinRequestQuery(
    chatJoinRequestQueryId: string,
    result: tg.Opts<'answerChatJoinRequestQuery'>['result']
  ) {
    return this.callApi('answerChatJoinRequestQuery', {
      chat_join_request_query_id: chatJoinRequestQueryId,
      result,
    })
  }

  /**
   * Process a received chat join request query by showing a Mini App to the user before deciding the outcome. Returns True on success.
   * @param chatJoinRequestQueryId Unique identifier of the join request query
   * @param webAppUrl The URL of the Mini App to be opened
   */
  sendChatJoinRequestWebApp(chatJoinRequestQueryId: string, webAppUrl: string) {
    return this.callApi('sendChatJoinRequestWebApp', {
      chat_join_request_query_id: chatJoinRequestQueryId,
      web_app_url: webAppUrl,
    })
  }

  // Telegram Stars & payments

  /**
   * Get the current Telegram Stars balance of the bot. Returns a StarAmount object on success.
   */
  getMyStarBalance() {
    return this.callApi('getMyStarBalance', {})
  }

  /**
   * Get the bot's Telegram Star transactions in chronological order. Returns a StarTransactions object on success.
   * @param offset Number of transactions to skip in the response
   * @param limit The maximum number of transactions to be retrieved; 1-100. Defaults to 100
   */
  getStarTransactions(offset?: number, limit?: number) {
    return this.callApi('getStarTransactions', { offset, limit })
  }

  /**
   * Refund a successful payment in Telegram Stars. Returns True on success.
   * @param userId Identifier of the user whose payment will be refunded
   * @param telegramPaymentChargeId Telegram payment identifier
   */
  refundStarPayment(userId: number, telegramPaymentChargeId: string) {
    return this.callApi('refundStarPayment', {
      user_id: userId,
      telegram_payment_charge_id: telegramPaymentChargeId,
    })
  }

  /**
   * Cancel or re-enable extension of a subscription paid in Telegram Stars. Returns True on success.
   * @param userId Identifier of the user whose subscription will be edited
   * @param telegramPaymentChargeId Telegram payment identifier for the subscription
   * @param isCanceled Pass True to cancel extension of the subscription; pass False to re-enable a previously canceled subscription
   */
  editUserStarSubscription(
    userId: number,
    telegramPaymentChargeId: string,
    isCanceled: boolean
  ) {
    return this.callApi('editUserStarSubscription', {
      user_id: userId,
      telegram_payment_charge_id: telegramPaymentChargeId,
      is_canceled: isCanceled,
    })
  }

  // Subscription invite links

  /**
   * Create a subscription invite link for a channel chat. The bot must have the can_invite_users administrator right. Returns the new invite link as a ChatInviteLink object.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param subscriptionPeriod The number of seconds the subscription is active before the next payment; currently must always be 2592000 (30 days)
   * @param subscriptionPrice The amount of Telegram Stars a user must pay for each subscription period; 1-10000
   * @param name Invite link name; 0-32 characters
   */
  createChatSubscriptionInviteLink(
    chatId: number | string,
    subscriptionPeriod: tg.Opts<'createChatSubscriptionInviteLink'>['subscription_period'],
    subscriptionPrice: number,
    name?: string
  ) {
    return this.callApi('createChatSubscriptionInviteLink', {
      chat_id: chatId,
      subscription_period: subscriptionPeriod,
      subscription_price: subscriptionPrice,
      name,
    })
  }

  /**
   * Edit a subscription invite link created by the bot. The bot must have the can_invite_users administrator right. Returns the edited invite link as a ChatInviteLink object.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param inviteLink The invite link to edit
   * @param name Invite link name; 0-32 characters
   */
  editChatSubscriptionInviteLink(
    chatId: number | string,
    inviteLink: string,
    name?: string
  ) {
    return this.callApi('editChatSubscriptionInviteLink', {
      chat_id: chatId,
      invite_link: inviteLink,
      name,
    })
  }

  // Gifts

  /**
   * Get the list of gifts that can be sent by the bot to users and channel chats. Returns a Gifts object.
   */
  getAvailableGifts() {
    return this.callApi('getAvailableGifts', {})
  }

  /**
   * Send a gift to the given user or channel chat. The recipient (`user_id` or `chat_id`) is passed via `extra`. Returns True on success.
   * @param giftId Identifier of the gift
   * @param extra Recipient and additional gift options
   */
  sendGift(giftId: string, extra: tt.ExtraSendGift) {
    return this.callApi('sendGift', {
      gift_id: giftId,
      ...extra,
    })
  }

  /**
   * Gift a Telegram Premium subscription to the given user. Returns True on success.
   * @param userId Unique identifier of the target user who will receive the subscription
   * @param monthCount Number of months the subscription will be active for; must be one of 3, 6, or 12
   * @param starCount Number of Telegram Stars to pay; must be 1000 for 3 months, 1500 for 6 months, and 2500 for 12 months
   */
  giftPremiumSubscription(
    userId: number,
    monthCount: tg.Opts<'giftPremiumSubscription'>['month_count'],
    starCount: tg.Opts<'giftPremiumSubscription'>['star_count'],
    extra?: tt.ExtraGiftPremiumSubscription
  ) {
    return this.callApi('giftPremiumSubscription', {
      user_id: userId,
      month_count: monthCount,
      star_count: starCount,
      ...extra,
    })
  }

  /**
   * Get the gifts owned and hosted by a user. Returns an OwnedGifts object.
   * @param userId Unique identifier of the user
   */
  getUserGifts(userId: number, extra?: tt.ExtraGetUserGifts) {
    return this.callApi('getUserGifts', {
      user_id: userId,
      ...extra,
    })
  }

  /**
   * Get the gifts owned by a chat. Returns an OwnedGifts object.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  getChatGifts(chatId: number | string, extra?: tt.ExtraGetChatGifts) {
    return this.callApi('getChatGifts', {
      chat_id: chatId,
      ...extra,
    })
  }

  /**
   * Convert a given regular gift to Telegram Stars. Requires the can_convert_gifts_to_stars business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param ownedGiftId Unique identifier of the regular gift that should be converted to Telegram Stars
   */
  convertGiftToStars(businessConnectionId: string, ownedGiftId: string) {
    return this.callApi('convertGiftToStars', {
      business_connection_id: businessConnectionId,
      owned_gift_id: ownedGiftId,
    })
  }

  /**
   * Upgrade a given regular gift to a unique gift. Requires the can_transfer_and_upgrade_gifts business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param ownedGiftId Unique identifier of the regular gift that should be upgraded to a unique one
   */
  upgradeGift(
    businessConnectionId: string,
    ownedGiftId: string,
    extra?: tt.ExtraUpgradeGift
  ) {
    return this.callApi('upgradeGift', {
      business_connection_id: businessConnectionId,
      owned_gift_id: ownedGiftId,
      ...extra,
    })
  }

  /**
   * Transfer an owned unique gift to another user. Requires the can_transfer_and_upgrade_gifts business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param ownedGiftId Unique identifier of the regular gift that should be transferred
   * @param newOwnerChatId Unique identifier of the chat which will own the gift
   * @param starCount The amount of Telegram Stars that will be paid for the transfer from the business account balance
   */
  transferGift(
    businessConnectionId: string,
    ownedGiftId: string,
    newOwnerChatId: number,
    starCount?: number
  ) {
    return this.callApi('transferGift', {
      business_connection_id: businessConnectionId,
      owned_gift_id: ownedGiftId,
      new_owner_chat_id: newOwnerChatId,
      star_count: starCount,
    })
  }

  // Business accounts

  /**
   * Get information about the connection of the bot with a business account. Returns a BusinessConnection object on success.
   * @param businessConnectionId Unique identifier of the business connection
   */
  getBusinessConnection(businessConnectionId: string) {
    return this.callApi('getBusinessConnection', {
      business_connection_id: businessConnectionId,
    })
  }

  /**
   * Mark an incoming message as read on behalf of a business account. Requires the can_read_messages business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection on behalf of which to read the message
   * @param chatId Unique identifier of the chat in which the message was received
   * @param messageId Unique identifier of the message to mark as read
   */
  readBusinessMessage(
    businessConnectionId: string,
    chatId: number,
    messageId: number
  ) {
    return this.callApi('readBusinessMessage', {
      business_connection_id: businessConnectionId,
      chat_id: chatId,
      message_id: messageId,
    })
  }

  /**
   * Delete messages on behalf of a business account. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection on behalf of which to delete the messages
   * @param messageIds A list of 1-100 identifiers of messages to delete; all messages must be from the same chat
   */
  deleteBusinessMessages(businessConnectionId: string, messageIds: number[]) {
    return this.callApi('deleteBusinessMessages', {
      business_connection_id: businessConnectionId,
      message_ids: messageIds,
    })
  }

  /**
   * Change the first and last name of a managed business account. Requires the can_change_name business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param firstName The new value of the first name for the business account; 1-64 characters
   * @param lastName The new value of the last name for the business account; 0-64 characters
   */
  setBusinessAccountName(
    businessConnectionId: string,
    firstName: string,
    lastName?: string
  ) {
    return this.callApi('setBusinessAccountName', {
      business_connection_id: businessConnectionId,
      first_name: firstName,
      last_name: lastName,
    })
  }

  /**
   * Change the username of a managed business account. Requires the can_change_username business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param username The new value of the username for the business account; 0-32 characters
   */
  setBusinessAccountUsername(businessConnectionId: string, username?: string) {
    return this.callApi('setBusinessAccountUsername', {
      business_connection_id: businessConnectionId,
      username,
    })
  }

  /**
   * Change the bio of a managed business account. Requires the can_change_bio business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param bio The new value of the bio for the business account; 0-140 characters
   */
  setBusinessAccountBio(businessConnectionId: string, bio?: string) {
    return this.callApi('setBusinessAccountBio', {
      business_connection_id: businessConnectionId,
      bio,
    })
  }

  /**
   * Change the profile photo of a managed business account. Requires the can_edit_profile_photo business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param photo The new profile photo to set
   * @param isPublic Pass True to set the public photo, visible even if the main photo is hidden by privacy settings
   */
  setBusinessAccountProfilePhoto(
    businessConnectionId: string,
    photo: tg.Opts<'setBusinessAccountProfilePhoto'>['photo'],
    isPublic?: boolean
  ) {
    return this.callApi('setBusinessAccountProfilePhoto', {
      business_connection_id: businessConnectionId,
      photo,
      is_public: isPublic,
    })
  }

  /**
   * Remove the current profile photo of a managed business account. Requires the can_edit_profile_photo business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param isPublic Pass True to remove the public photo
   */
  removeBusinessAccountProfilePhoto(
    businessConnectionId: string,
    isPublic?: boolean
  ) {
    return this.callApi('removeBusinessAccountProfilePhoto', {
      business_connection_id: businessConnectionId,
      is_public: isPublic,
    })
  }

  /**
   * Change the privacy settings pertaining to incoming gifts in a managed business account. Requires the can_change_gift_settings business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param showGiftButton Pass True if a button for sending a gift must always be shown in the input field
   * @param acceptedGiftTypes Types of gifts accepted by the business account
   */
  setBusinessAccountGiftSettings(
    businessConnectionId: string,
    showGiftButton: boolean,
    acceptedGiftTypes: tg.Opts<'setBusinessAccountGiftSettings'>['accepted_gift_types']
  ) {
    return this.callApi('setBusinessAccountGiftSettings', {
      business_connection_id: businessConnectionId,
      show_gift_button: showGiftButton,
      accepted_gift_types: acceptedGiftTypes,
    })
  }

  /**
   * Get the amount of Telegram Stars owned by a managed business account. Requires the can_view_gifts_and_stars business bot right. Returns a StarAmount object on success.
   * @param businessConnectionId Unique identifier of the business connection
   */
  getBusinessAccountStarBalance(businessConnectionId: string) {
    return this.callApi('getBusinessAccountStarBalance', {
      business_connection_id: businessConnectionId,
    })
  }

  /**
   * Transfer Telegram Stars from the business account balance to the bot's balance. Requires the can_transfer_stars business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param starCount Number of Telegram Stars to transfer; 1-10000
   */
  transferBusinessAccountStars(
    businessConnectionId: string,
    starCount: number
  ) {
    return this.callApi('transferBusinessAccountStars', {
      business_connection_id: businessConnectionId,
      star_count: starCount,
    })
  }

  /**
   * Get the gifts received and owned by a managed business account. Requires the can_view_gifts_and_stars business bot right. Returns an OwnedGifts object on success.
   * @param businessConnectionId Unique identifier of the business connection
   */
  getBusinessAccountGifts(
    businessConnectionId: string,
    extra?: tt.ExtraGetBusinessAccountGifts
  ) {
    return this.callApi('getBusinessAccountGifts', {
      business_connection_id: businessConnectionId,
      ...extra,
    })
  }

  // Stories

  /**
   * Post a story on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns a Story object on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param content Content of the story
   * @param activePeriod Period after which the story is moved to the archive, in seconds; one of 21600, 43200, 86400, or 172800
   */
  postStory(
    businessConnectionId: string,
    content: tg.Opts<'postStory'>['content'],
    activePeriod: tg.Opts<'postStory'>['active_period'],
    extra?: tt.ExtraPostStory
  ) {
    return this.callApi('postStory', {
      business_connection_id: businessConnectionId,
      content,
      active_period: activePeriod,
      ...fmtCaption(extra),
    })
  }

  /**
   * Repost a story on behalf of a business account from another business account managed by the same bot. Requires the can_manage_stories business bot right for both accounts. Returns a Story object on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param fromChatId Unique identifier of the chat which posted the story that should be reposted
   * @param fromStoryId Unique identifier of the story that should be reposted
   * @param activePeriod Period after which the story is moved to the archive, in seconds; one of 21600, 43200, 86400, or 172800
   */
  repostStory(
    businessConnectionId: string,
    fromChatId: number,
    fromStoryId: number,
    activePeriod: tg.Opts<'repostStory'>['active_period'],
    extra?: tt.ExtraRepostStory
  ) {
    return this.callApi('repostStory', {
      business_connection_id: businessConnectionId,
      from_chat_id: fromChatId,
      from_story_id: fromStoryId,
      active_period: activePeriod,
      ...extra,
    })
  }

  /**
   * Edit a story previously posted by the bot on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns a Story object on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param storyId Unique identifier of the story to edit
   * @param content Content of the story
   */
  editStory(
    businessConnectionId: string,
    storyId: number,
    content: tg.Opts<'editStory'>['content'],
    extra?: tt.ExtraEditStory
  ) {
    return this.callApi('editStory', {
      business_connection_id: businessConnectionId,
      story_id: storyId,
      content,
      ...fmtCaption(extra),
    })
  }

  /**
   * Delete a story previously posted by the bot on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns True on success.
   * @param businessConnectionId Unique identifier of the business connection
   * @param storyId Unique identifier of the story to delete
   */
  deleteStory(businessConnectionId: string, storyId: number) {
    return this.callApi('deleteStory', {
      business_connection_id: businessConnectionId,
      story_id: storyId,
    })
  }

  // Checklists

  /**
   * Send a checklist on behalf of a connected business account. On success, the sent Message is returned.
   * @param businessConnectionId Unique identifier of the business connection on behalf of which the message will be sent
   * @param chatId Unique identifier for the target chat
   * @param checklist An object for the checklist to send
   */
  sendChecklist(
    businessConnectionId: string,
    chatId: number | string,
    checklist: tg.Opts<'sendChecklist'>['checklist'],
    extra?: tt.ExtraChecklist
  ) {
    return this.callApi('sendChecklist', {
      business_connection_id: businessConnectionId,
      chat_id: chatId,
      checklist,
      ...extra,
    })
  }

  /**
   * Edit a checklist on behalf of a connected business account. On success, the edited Message is returned.
   * @param businessConnectionId Unique identifier of the business connection on behalf of which the message was sent
   * @param chatId Unique identifier for the target chat
   * @param messageId Unique identifier for the target message
   * @param checklist An object for the new checklist
   */
  editMessageChecklist(
    businessConnectionId: string,
    chatId: number,
    messageId: number,
    checklist: tg.Opts<'editMessageChecklist'>['checklist'],
    extra?: tt.ExtraEditMessageChecklist
  ) {
    return this.callApi('editMessageChecklist', {
      business_connection_id: businessConnectionId,
      chat_id: chatId,
      message_id: messageId,
      checklist,
      ...extra,
    })
  }

  // Suggested posts

  /**
   * Approve a suggested post in a direct messages chat. The bot must have the can_post_messages administrator right in the corresponding channel chat. Returns True on success.
   * @param chatId Unique identifier for the target direct messages chat
   * @param messageId Identifier of a suggested post message to approve
   * @param sendDate Point in time (Unix timestamp) when the post is expected to be published
   */
  approveSuggestedPost(chatId: number, messageId: number, sendDate?: number) {
    return this.callApi('approveSuggestedPost', {
      chat_id: chatId,
      message_id: messageId,
      send_date: sendDate,
    })
  }

  /**
   * Decline a suggested post in a direct messages chat. The bot must have the can_manage_direct_messages administrator right in the corresponding channel chat. Returns True on success.
   * @param chatId Unique identifier for the target direct messages chat
   * @param messageId Identifier of a suggested post message to decline
   * @param comment Comment for the creator of the suggested post; 0-128 characters
   */
  declineSuggestedPost(chatId: number, messageId: number, comment?: string) {
    return this.callApi('declineSuggestedPost', {
      chat_id: chatId,
      message_id: messageId,
      comment,
    })
  }

  // Verification

  /**
   * Verify a user on behalf of the organization represented by the bot. Returns True on success.
   * @param userId Unique identifier of the target user
   * @param customDescription Custom description for the verification; 0-70 characters
   */
  verifyUser(userId: number, customDescription?: string) {
    return this.callApi('verifyUser', {
      user_id: userId,
      custom_description: customDescription,
    })
  }

  /**
   * Verify a chat on behalf of the organization represented by the bot. Returns True on success.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param customDescription Custom description for the verification; 0-70 characters
   */
  verifyChat(chatId: number | string, customDescription?: string) {
    return this.callApi('verifyChat', {
      chat_id: chatId,
      custom_description: customDescription,
    })
  }

  /**
   * Remove verification from a user currently verified on behalf of the organization represented by the bot. Returns True on success.
   * @param userId Unique identifier of the target user
   */
  removeUserVerification(userId: number) {
    return this.callApi('removeUserVerification', {
      user_id: userId,
    })
  }

  /**
   * Remove verification from a chat currently verified on behalf of the organization represented by the bot. Returns True on success.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  removeChatVerification(chatId: number | string) {
    return this.callApi('removeChatVerification', {
      chat_id: chatId,
    })
  }

  // Paid media

  /**
   * Send paid media. On success, the sent Message is returned.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param starCount The number of Telegram Stars that must be paid to buy access to the media; 1-10000
   * @param media An array describing the media to be sent; up to 10 items
   */
  sendPaidMedia(
    chatId: number | string,
    starCount: number,
    media: tg.Opts<'sendPaidMedia'>['media'],
    extra?: tt.ExtraPaidMedia
  ) {
    return this.callApi('sendPaidMedia', {
      chat_id: chatId,
      star_count: starCount,
      media,
      ...fmtCaption(extra),
    })
  }

  // Message drafts

  /**
   * Stream a partial message to a user while it is being generated; supported only for bots with forum topic mode enabled. Returns True on success.
   * @param chatId Unique identifier for the target private chat
   * @param draftId Unique identifier of the message draft; must be non-zero
   */
  sendMessageDraft(
    chatId: number,
    draftId: number,
    extra?: tt.ExtraMessageDraft
  ) {
    return this.callApi('sendMessageDraft', {
      chat_id: chatId,
      draft_id: draftId,
      ...extra,
    })
  }

  // Managed bots

  /**
   * Get the token of a managed bot. Returns the token as String on success.
   * @param userId User identifier of the managed bot whose token will be returned
   */
  getManagedBotToken(userId: number) {
    return this.callApi('getManagedBotToken', {
      user_id: userId,
    })
  }

  /**
   * Revoke the current token of a managed bot and generate a new one. Returns the new token as String on success.
   * @param userId User identifier of the managed bot whose token will be replaced
   */
  replaceManagedBotToken(userId: number) {
    return this.callApi('replaceManagedBotToken', {
      user_id: userId,
    })
  }

  // Prepared messages & Mini Apps

  /**
   * Store a message that can be sent by a user of a Mini App. Returns a PreparedInlineMessage object.
   * @param userId Unique identifier of the target user that can use the prepared message
   * @param result An object describing the message to be sent
   */
  savePreparedInlineMessage(
    userId: number,
    result: tg.Opts<'savePreparedInlineMessage'>['result'],
    extra?: tt.ExtraSavePreparedInlineMessage
  ) {
    return this.callApi('savePreparedInlineMessage', {
      user_id: userId,
      result,
      ...extra,
    })
  }

  /**
   * Store a keyboard button that can be used by a user within a Mini App. Returns a PreparedKeyboardButton object.
   * @param userId Unique identifier of the target user that can use the button
   * @param button A request_users, request_chat, or request_managed_bot keyboard button to be saved
   */
  savePreparedKeyboardButton(
    userId: number,
    button: tg.Opts<'savePreparedKeyboardButton'>['button']
  ) {
    return this.callApi('savePreparedKeyboardButton', {
      user_id: userId,
      button,
    })
  }

  // Profile & status

  /**
   * Change the profile photo of the bot. Returns True on success.
   * @param photo The new profile photo to set
   */
  setMyProfilePhoto(photo: tg.Opts<'setMyProfilePhoto'>['photo']) {
    return this.callApi('setMyProfilePhoto', {
      photo,
    })
  }

  /**
   * Remove the profile photo of the bot. Returns True on success.
   */
  removeMyProfilePhoto() {
    return this.callApi('removeMyProfilePhoto', {})
  }

  /**
   * Change the emoji status for a given user that previously allowed the bot to manage their emoji status via the Mini App method requestEmojiStatusAccess. Returns True on success.
   * @param userId Unique identifier of the target user
   */
  setUserEmojiStatus(userId: number, extra?: tt.ExtraSetUserEmojiStatus) {
    return this.callApi('setUserEmojiStatus', {
      user_id: userId,
      ...extra,
    })
  }

  // Stickers

  /**
   * Replace an existing sticker in a sticker set with a new one. Equivalent to calling deleteStickerFromSet, then addStickerToSet, then setStickerPositionInSet. Returns True on success.
   * @param userId User identifier of the sticker set owner
   * @param name Sticker set name
   * @param oldSticker File identifier of the replaced sticker
   * @param sticker An object with information about the added sticker
   */
  replaceStickerInSet(
    userId: number,
    name: string,
    oldSticker: string,
    sticker: tg.Opts<'replaceStickerInSet'>['sticker']
  ) {
    return this.callApi('replaceStickerInSet', {
      user_id: userId,
      name,
      old_sticker: oldSticker,
      sticker,
    })
  }

  // Misc

  /**
   * Get a list of profile audios for a user. Returns a UserProfileAudios object.
   * @param userId Unique identifier of the target user
   * @param offset Sequential number of the first audio to be returned. By default, all audios are returned
   * @param limit Limits the number of audios to be retrieved; 1-100. Defaults to 100
   */
  getUserProfileAudios(userId: number, offset?: number, limit?: number) {
    return this.callApi('getUserProfileAudios', {
      user_id: userId,
      offset,
      limit,
    })
  }

  /**
   * Set a tag for a regular member in a group or a supergroup. Returns True on success.
   * @param chatId Unique identifier for the target chat or username of the target supergroup
   * @param userId Unique identifier of the target user
   * @param tag New tag for the member; 0-16 characters, emoji are not allowed
   */
  setChatMemberTag(chatId: number | string, userId: number, tag?: string) {
    return this.callApi('setChatMemberTag', {
      chat_id: chatId,
      user_id: userId,
      tag,
    })
  }

  /**
   * Log out from the cloud Bot API server before launching the bot locally.
   */
  logOut() {
    return this.callApi('logOut', {})
  }

  /**
   * Close the bot instance before moving it from one local server to another.
   */
  close() {
    return this.callApi('close', {})
  }
}

export default Telegram
