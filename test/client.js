const test = require('ava')
const { Telegram } = require('../')

const token = '12345:SECRETTOKENVALUE'
// nothing listens on port 1, so the request fails with a network error
const unreachable = { apiRoot: 'http://127.0.0.1:1' }

test('network error does not expose the bot token', async (t) => {
  const error = await t.throwsAsync(new Telegram(token, unreachable).getMe())
  t.false(error.message.includes('SECRETTOKENVALUE'))
  t.false(error.stack.includes('SECRETTOKENVALUE'))
  t.true(error.message.includes('/bot12345:[REDACTED]/getMe'))
})

test.serial(
  'network error does not expose the bot token when the stack was already read',
  async (t) => {
    // simulate instrumentation that materialises the stack on creation
    const original = Error.captureStackTrace
    Error.captureStackTrace = function (target, ...rest) {
      original.call(Error, target, ...rest)
      void target.stack
    }
    try {
      const error = await t.throwsAsync(
        new Telegram(token, unreachable).getMe()
      )
      t.false(error.message.includes('SECRETTOKENVALUE'))
      t.false(error.stack.includes('SECRETTOKENVALUE'))
    } finally {
      Error.captureStackTrace = original
    }
  }
)
