import mongoose from 'mongoose'

import { IUser, IUserModel } from './IUser'

import { isEmail } from '@helpers/utils/validator'

import userFunctions from '@helpers/endpoints/methods/user'
import { findByCredentials } from '@helpers/endpoints/statics/user'

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      validate(value: string) {
        if (!isEmail(value)) {
          throw new Error('Email is invalid')
        }
      }
    },
    password: {
      type: String,
      minLength: 7,
      select: false,
      required: false
    },
    details: {
      type: {
        firstName: {
          type: String,
          required: true
        },
        lastName: {
          type: String,
          required: true
        },
        avatar: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Asset',
          required: false
        }
      },
      required: true,
      _id: false
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'disabled'],
      default: 'active'
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Role'
    },
    access: {
      type: [
        {
          device: {
            type: String,
            required: true,
            enum: ['browser', 'app']
          },
          info: {
            type: String,
            required: true
          },
          ip: {
            type: String,
            required: true
          },
          createdAt: {
            type: Date,
            required: true
          }
        }
      ],
      select: false,
      required: false,
      _id: false
    }
  },
  {
    timestamps: true
  }
)

// userSchema.post('save', async function () {
//   if (!this.password) {
//     // send email
//   }
// })

userFunctions(userSchema, 'User')

userSchema.statics.findByCredentials = async (email: string, password: string) =>
  findByCredentials(email, password, User)

const User = mongoose.model<IUser, IUserModel>('User', userSchema)

export { User as default }
