// Mongo
import { ObjectId } from 'mongodb'

// Interfaces
import { Schema, Model } from 'mongoose'
import { IUser } from '@api/general/users/models/IUser'
import { IMember } from '@api/content/members/models/IMember'
import { ClientError } from '@helpers/errors/exception'

type SchemaType<T> =
  | (T & {
      _id?: Schema.Types.ObjectId
    })
  | Schema.Types.ObjectId

const instanceOfObjectId = (value?: unknown): value is Schema.Types.ObjectId => {
  return !!value && ObjectId.isValid(value as string)
}

const instanceOfString = (value?: unknown): value is string => {
  return typeof value === 'string' || value instanceof String
}

const instanceOfBoolean = (value?: unknown): value is boolean => {
  return typeof value == 'boolean' || value instanceof Boolean
}

const isObject = (val: unknown): val is object => {
  if (val === null || val instanceof Date || Array.isArray(val) || instanceOfObjectId(val)) {
    return false
  }
  return typeof val === 'function' || typeof val === 'object'
}

const instanceOfUser = (auth: {
  user: object
  owner: string
}): auth is { user: IUser; owner: 'User' } => {
  return !!auth.owner && auth.owner == 'User'
}

const instanceOfMember = (auth: {
  user: object
  owner: string
}): auth is { user: IMember; owner: 'Member' } => {
  return !!auth.owner && auth.owner == 'Member'
}

const getPopulatedField = async <T>(field: Schema.Types.ObjectId | T, model: Model<T>) => {
  if (instanceOfObjectId(field)) {
    const data = await model.findById(field)

    if (data) {
      return data
    } else {
      throw new ClientError('missing_populated_field', 'Missing populated field')
    }
  } else {
    return field
  }
}

const getRelationId = <T>(field: SchemaType<T>) => {
  if (instanceOfObjectId(field)) {
    return field
  } else if (field._id) {
    return field._id
  } else {
    throw new Error('Relation is missing ID')
  }
}

export {
  SchemaType,
  instanceOfObjectId,
  isObject,
  instanceOfUser,
  instanceOfMember,
  instanceOfString,
  instanceOfBoolean,
  getPopulatedField,
  getRelationId
}
