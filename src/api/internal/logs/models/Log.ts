import mongoose from 'mongoose'

import { ILog } from './ILog'

const logSchema = new mongoose.Schema<ILog>(
  {
    type: {
      type: String,
      required: true,
      enum: ['info', 'error']
    },
    details: {
      type: Object,
      required: true
    },
    project: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    resolved: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  {
    timestamps: true
  }
)

logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 * 24 * 7 })

const Log = mongoose.model<ILog>('Log', logSchema)

export default Log
