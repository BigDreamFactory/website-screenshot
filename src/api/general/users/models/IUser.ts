import { Document, Model } from 'mongoose'

import { Request } from 'express'

// Interfaces
import { SchemaType } from '@helpers/utils/interfaces'

// Models
import { IAsset } from '@api/general/assets/models/IAsset'
import { IRole } from '@api/general/roles/models/IRole'

interface IUserDetails {
  firstName: string
  lastName: string
  avatar: SchemaType<IAsset>
}

export type Device = 'browser' | 'app'

export interface Access {
  device: Device
  info: string
  ip: string
  createdAt: Date
}

interface IUser extends Document {
  email: string
  details: IUserDetails
  status: 'active' | 'disabled'
  password?: string
  role: SchemaType<IRole>
  access?: Access[]
  generateAuthToken(access: Access): string
  generateResetToken(): string
  sanitize(req: Request): IUser
}

interface IUserModel extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>
}

export { IUser, IUserModel }
