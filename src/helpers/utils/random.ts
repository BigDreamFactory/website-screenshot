import crypto from 'crypto'

const randomString = (chars = 32) => {
  return crypto.randomBytes(chars / 2).toString('hex')
}

export { randomString }
