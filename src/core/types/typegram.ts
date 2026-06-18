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

// tiny helper types
export type ChatAction = Opts<'sendChatAction'>['action']

/**
 * Sending video notes by a URL is currently unsupported
 */
export type InputFileVideoNote = Exclude<InputFile, InputFileByURL>
