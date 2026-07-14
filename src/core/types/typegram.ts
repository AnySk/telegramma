import * as Typegram from '@anysk/telegramma-types'

// internal type provisions
export * from '@anysk/telegramma-types/api'
export * from '@anysk/telegramma-types/inline'
export * from '@anysk/telegramma-types/manage'
export * from '@anysk/telegramma-types/markup'
export * from '@anysk/telegramma-types/message'
export * from '@anysk/telegramma-types/methods'
export * from '@anysk/telegramma-types/passport'
export * from '@anysk/telegramma-types/payment'
export * from '@anysk/telegramma-types/settings'
export * from '@anysk/telegramma-types/update'

// telegraf input file definition
interface InputFileByPath {
  source: string
  filename?: string
}
interface InputFileByReadableStream {
  source: NodeJS.ReadableStream
  filename?: string
}
interface InputFileByBuffer {
  source: Buffer
  filename?: string
}
interface InputFileByURL {
  url: string
  filename?: string
}
export type InputFile =
  | InputFileByPath
  | InputFileByReadableStream
  | InputFileByBuffer
  | InputFileByURL

export type Telegram = Typegram.ApiMethods<InputFile>

export type Opts<M extends keyof Telegram> = Typegram.Opts<InputFile>[M]
export type InputMedia = Typegram.InputMedia<InputFile>
export type InputMediaPhoto = Typegram.InputMediaPhoto<InputFile>
export type InputMediaVideo = Typegram.InputMediaVideo<InputFile>
export type InputMediaAnimation = Typegram.InputMediaAnimation<InputFile>
export type InputMediaAudio = Typegram.InputMediaAudio<InputFile>
export type InputMediaDocument = Typegram.InputMediaDocument<InputFile>
export type InputMediaVoiceNote = Typegram.InputMediaVoiceNote<InputFile>
export type InputRichMessage = Typegram.InputRichMessage<InputFile>
export type InputRichMessageMedia = Typegram.InputRichMessageMedia<InputFile>
export type InputRichBlock = Typegram.InputRichBlock<InputFile>
export type InputRichBlockList = Typegram.InputRichBlockList<InputFile>
export type InputRichBlockListItem = Typegram.InputRichBlockListItem<InputFile>
export type InputRichBlockBlockQuotation =
  Typegram.InputRichBlockBlockQuotation<InputFile>
export type InputRichBlockCollage = Typegram.InputRichBlockCollage<InputFile>
export type InputRichBlockSlideshow =
  Typegram.InputRichBlockSlideshow<InputFile>
export type InputRichBlockDetails = Typegram.InputRichBlockDetails<InputFile>
export type InputRichBlockAnimation =
  Typegram.InputRichBlockAnimation<InputFile>
export type InputRichBlockAudio = Typegram.InputRichBlockAudio<InputFile>
export type InputRichBlockPhoto = Typegram.InputRichBlockPhoto<InputFile>
export type InputRichBlockVideo = Typegram.InputRichBlockVideo<InputFile>
export type InputRichBlockVoiceNote =
  Typegram.InputRichBlockVoiceNote<InputFile>

// tiny helper types
export type ChatAction = Opts<'sendChatAction'>['action']

/**
 * Sending video notes by a URL is currently unsupported
 */
export type InputFileVideoNote = Exclude<InputFile, InputFileByURL>
