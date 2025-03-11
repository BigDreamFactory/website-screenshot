import { Request } from 'express'

import { Document, Model } from 'mongoose'

// Interfaces
import { SchemaType } from '@helpers/utils/interfaces'

// Models
import { Access } from '@api/general/users/models/IUser'
import { IRole } from '@api/general/roles/models/IRole'

export type MemberPlan = 'free' | 'standard'

interface IMemberDetails {
  firstName: string
  lastName?: string
}

interface IMember extends Document {
  email: string
  password?: string
  status: 'inactive' | 'active' | 'disabled' | 'blocked'
  plan: MemberPlan
  billing?: {
    customerId: string
    paymentMethod: 'stripe'
  }
  details?: IMemberDetails
  role?: SchemaType<IRole>
  access?: Access[]
  generateAuthToken(access: Access): string
  generateResetToken(): string
  sanitize(req: Request): IMember
}

interface IMemberModel extends Model<IMember> {
  findByCredentials(email: string, password: string): Promise<IMember>
  findOrCreateByProvider(
    email: string,
    details: IMemberDetails
  ): Promise<{ user: IMember; status: 'found' | 'created' }>
}

export { IMember, IMemberModel, IMemberDetails }
