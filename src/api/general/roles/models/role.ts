import mongoose from 'mongoose'

import { IRole } from './IRole'

const roleSchema = new mongoose.Schema<IRole>(
  {
    name: {
      type: String,
      unique: true,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    access: {
      type: [
        {
          path: {
            type: String,
            required: true
          },
          methods: [
            {
              type: String,
              required: true
            }
          ]
        }
      ],
      required: true,
      _id: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
    timestamps: true
  }
)

const Role = mongoose.model<IRole>('Role', roleSchema)

export default Role
