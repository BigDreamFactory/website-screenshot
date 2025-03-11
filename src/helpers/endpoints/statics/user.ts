import { Model } from 'mongoose'
import bcrypt from 'bcryptjs'

// Models
import Role from '@api/general/roles/models/role'

// Interfaces
import { IMember, IMemberDetails } from '@api/content/members/models/IMember'
import { IUser } from '@api/general/users/models/IUser'

// Helpers
import { ClientError } from '@helpers/errors/exception'

const findByCredentials = async <T extends IUser | IMember>(
  email: string,
  password: string,
  model: Model<T>
) => {
  const user = await model.findOne({ email }).select('+password +access')

  if (!user || !user.password) {
    throw new ClientError('incorrect_credentials', 'Incorrect Credentials', 401)
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new ClientError('incorrect_credentials', 'Incorrect Credentials', 401)
  }

  return user
}

const findOrCreateByProvider = async <T1 extends IMember, T2 extends IMemberDetails>(
  email: string,
  details: T2,
  model: Model<T1>
) => {
  const user = await model.findOne({ email }).select('+access')

  if (user) {
    if (!user.details) {
      user.details = details
      await user.save()
    }
    return { user, status: 'found' }
  } else {
    const newUser = new model({ email, details, emailConfirmed: true })

    const memberRole = await Role.findOne({ name: 'Member' })

    if (memberRole) {
      newUser.role = memberRole._id
    }

    await newUser.save()
    return { user: newUser, status: 'created' }
  }
}

export { findByCredentials, findOrCreateByProvider }
