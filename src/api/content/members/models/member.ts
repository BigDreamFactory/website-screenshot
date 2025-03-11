import mongoose from 'mongoose'

import { IMember, IMemberDetails, IMemberModel } from './IMember'

import { isEmail } from '@helpers/utils/validator'

import userFunctions from '@helpers/endpoints/methods/user'
import { findByCredentials, findOrCreateByProvider } from '@helpers/endpoints/statics/user'

const memberSchema = new mongoose.Schema<IMember>(
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
    details: {
      type: {
        firstName: {
          type: String,
          required: true
        },
        lastName: {
          type: String,
          required: false
        }
      },
      required: false,
      _id: false
    },
    status: {
      type: String,
      required: true,
      enum: ['inactive', 'active', 'disabled', 'blocked'],
      default: 'active'
    },
    plan: {
      type: String,
      required: true,
      enum: ['free', 'standard']
    },
    billing: {
      type: {
        customerId: {
          type: String,
          required: true
        },
        paymentMethod: {
          type: String,
          required: true,
          enum: ['stripe']
        }
      },
      required: false,
      _id: false
    },
    password: {
      type: String,
      minLength: 7,
      required: false,
      select: false
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      select: false,
      required: false
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
    timestamps: true
  }
)

userFunctions(memberSchema, 'Member')

memberSchema.statics.findByCredentials = async (email: string, password: string) =>
  findByCredentials(email, password, Member)

memberSchema.statics.findOrCreateByProvider = async (email: string, details: IMemberDetails) =>
  findOrCreateByProvider(email, details, Member)

const Member = mongoose.model<IMember, IMemberModel>('Member', memberSchema)

export default Member
