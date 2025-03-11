import { UAParser } from 'ua-parser-js'

const parseUA = (value: string) => {
  const parser = new UAParser(value)
  return parser.getResult()
}

export { parseUA as default }
