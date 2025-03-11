import { Document } from 'mongoose'

interface IContact extends Document {
  email: string
}

export { IContact }
