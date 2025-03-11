import { Document } from 'mongoose'

export type LogType = 'info' | 'error'

interface ILog extends Document {
  type: LogType
  details: object
  project: string
  version: string
  resolved: boolean
}

export { ILog }
