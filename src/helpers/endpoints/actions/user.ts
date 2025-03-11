// Packages
import jwt from 'jsonwebtoken'

// Errors
import { ClientError } from '@helpers/errors/exception'

// Interfaces
import { Access, Device } from '@api/general/users/models/IUser'

// Helpers
import parseUA from '@helpers/utils/userAgent'

export type JWTTokenType = 'auth' | 'reset' | 'invite' | string

export interface JWTPayload {
  _id: string
  owner: 'User' | 'Member'
  access?: Access
  type: JWTTokenType
}

const generateJwtToken = ({ payload, expiresIn }: { payload: JWTPayload; expiresIn?: string }) => {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new ClientError('missing_jwt_secret', 'JWT secret was not provided')
  }

  const options = expiresIn ? { expiresIn } : {}

  const token = jwt.sign(payload, jwtSecret, options)

  return token
}

const formatDeviceAccess = ({
  info,
  ip,
  createdAt,
  device = 'browser'
}: {
  info: string
  ip: string
  createdAt?: Date
  device?: Device
}): Access => {
  if (!createdAt) {
    createdAt = new Date()
    createdAt.setMilliseconds(0)
  }

  return { device, info, ip, createdAt }
}

const hasDeviceAccess = ({
  request,
  available,
  options
}: {
  request: Access
  available?: Access[]
  options?: { noTimeCheck?: boolean }
}) => {
  if (!available) {
    return false
  }

  return available.some((access) => {
    return sameDeviceAccess({ request, available: access, options })
  })
}

const sameDeviceAccess = ({
  request,
  available,
  options
}: {
  request: Access
  available: Access
  options?: { noTimeCheck?: boolean }
}) => {
  if (request.device != available.device) {
    return false
  }

  if (!options?.noTimeCheck && request.createdAt < available.createdAt) {
    return false
  }

  const requestUA = parseUA(request.info)
  const accessUA = parseUA(available.info)

  if (
    requestUA.browser.name != accessUA.browser.name ||
    requestUA.os.name != accessUA.os.name ||
    requestUA.cpu.architecture != requestUA.cpu.architecture
  ) {
    return false
  }

  return available
}

export { generateJwtToken, hasDeviceAccess, formatDeviceAccess, sameDeviceAccess }
