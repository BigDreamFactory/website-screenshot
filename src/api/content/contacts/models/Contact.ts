import mongoose from 'mongoose'

import { IContact } from './IContact'

const contactSchema = new mongoose.Schema<IContact>(
  {
    email: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
)

const Contact = mongoose.model<IContact>('Contact', contactSchema)

export default Contact
