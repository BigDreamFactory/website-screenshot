//Base
import { Request } from 'express'
import bcrypt from 'bcryptjs'

// Database
import { Schema } from 'mongoose'

// Interfaces
import { IMember } from '@api/content/members/models/IMember'
import { Access, IUser } from '@api/general/users/models/IUser'

// Helpers
import { generateJwtToken, hasDeviceAccess } from '../actions/user'
import formatQuery, { FormattedQuery } from '../formatQuery'

function userFunctions<T extends IUser | IMember>(userSchema: Schema<T>, owner: 'User' | 'Member') {
  userSchema.methods.sanitize = function (req: Request) {
    const user = this.toObject()

    delete user.password
    delete user.__v

    const query = formatQuery(req.query)

    if (!hasPopulate('role', query)) {
      delete user.role
    }

    if (!hasSelect('access', query)) {
      delete user.access
    }

    return user
  }

  userSchema.methods.generateAuthToken = function (access: Access) {
    if (
      !hasDeviceAccess({
        request: access,
        available: this.access,
        options: { noTimeCheck: true }
      })
    ) {
      if (this.access) {
        this.access.push(access)
      } else {
        this.access = [access]
      }
    }

    this.status = 'active'

    const token = generateJwtToken({ payload: { _id: this._id, owner, access, type: 'auth' } })

    return token
  }

  userSchema.methods.generateResetToken = function () {
    const token = generateJwtToken({
      payload: { _id: this._id, owner, type: 'reset' },
      expiresIn: '15min'
    })
    return token
  }

  userSchema.methods.generateInviteToken = function () {
    const token = generateJwtToken({
      payload: { _id: this._id, owner, type: 'invite' },
      expiresIn: '7d'
    })
    return token
  }

  userSchema.pre('save', async function () {
    if (this.isModified('password')) {
      await encryptPassword(this as IUser | IMember)
    }
  })

  userSchema.pre('findOneAndUpdate', async function () {
    const user = this.getUpdate() as IUser | IMember
    const encryptedUser = await encryptPassword(user)

    this.setUpdate(encryptedUser)
  })

  const encryptPassword = async (user: IUser | IMember) => {
    if (user.password != null) {
      user.password = await bcrypt.hash(user.password, 8)
    } else {
      delete user.password
    }

    return user
  }
}

const hasPopulate = (value: string, query: FormattedQuery) => {
  return query.populate.includes(value)
}

const hasSelect = (value: string, query: FormattedQuery) => {
  return query.select.includes(value) || query.select.includes(`+${value}`)
}

export { userFunctions as default }
