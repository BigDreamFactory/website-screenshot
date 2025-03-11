import { Document } from 'mongoose'

interface IRole extends Document {
  name: string
  description?: string
  access: [
    {
      path: string
      methods: string[]
    }
  ]
}

export { IRole }
