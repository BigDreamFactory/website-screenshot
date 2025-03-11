import { Request, Response, NextFunction } from 'express'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'

import { ClientError, handleClientError } from '@helpers/errors/exception'
import formatQuery, { FormattedQuery } from '@helpers/endpoints/formatQuery'
import {
  JWTPayload,
  JWTTokenType,
  formatDeviceAccess,
  hasDeviceAccess,
  sameDeviceAccess
} from '@helpers/endpoints/actions/user'

import User from '@api/general/users/models/user'
import Member from '@api/content/members/models/member'
import Role from '@api/general/roles/models/role'

import { Access, IUser } from '@api/general/users/models/IUser'
import { IRole } from '@api/general/roles/models/IRole'
import { IMember } from '@api/content/members/models/IMember'

import manualAuthData from '@public/endpoints/manual-auth.json'
import { logError } from '@helpers/utils/logs'

interface AuthRequest extends Request {
  token: string
  user: IUser | IMember
  owner: 'User' | 'Member'
}

interface Decoded extends JWTPayload {
  iat: number
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userAgent = req.get('User-Agent') || req.get('user-agent')

    if (!userAgent) {
      throw new ClientError('missing_authorization', 'Missing Authorization', 401)
    }

    req.userAgent = userAgent
    const access = manualAuthData.find(({ path }) => {
      const parsedPath = parsePath(path)

      return new RegExp(parsedPath).test(req.path)
    })

    if (access && access.methods.includes(req.method)) {
      next()
    } else {
      initAuthentication({ req, res, next, type: 'auth' })
    }
  } catch (error) {
    logError(error)
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

const detailedAuth = async (req: Request, res: Response, next: NextFunction) => {
  initAuthentication({ req, res, next, detailed: true, type: 'auth' })
}

const resetAuth = async (req: Request, res: Response, next: NextFunction) => {
  initAuthentication({ req, res, next, type: 'reset' })
}

const initAuthentication = async ({
  req,
  res,
  next,
  detailed = false,
  type
}: {
  req: Request
  res: Response
  next: NextFunction
  detailed?: boolean
  type: JWTTokenType
}) => {
  const authorization = req.header('Authorization')
  const query = formatQuery(req.query)

  try {
    if (!authorization) {
      const role = await Role.findOne({ name: 'Public' })

      if (role && hasRoleAccess(role, req.path, req.method)) {
        next()
        return
      }

      throw new ClientError('missing_authorization', 'Missing Authorization', 401)
    }

    const { decodedJWT, token } = decodeJWT({ authorization, type })

    const createdAt = new Date(decodedJWT.iat * 1000)
    const reqAccess = formatDeviceAccess({ info: req.userAgent, ip: req.ip, createdAt })

    if (
      type == 'auth' &&
      (!decodedJWT.access ||
        !sameDeviceAccess({ request: reqAccess, available: decodedJWT.access }))
    ) {
      throw new ClientError('invalid_authentication', 'Invalid Authentication', 401)
    }

    const { user, role } = await authenticate({
      decodedJWT,
      query,
      detailed,
      access: reqAccess,
      type
    })

    permit({ role, status: user.status, path: req.path, method: req.method })

    req.auth = { token, user, owner: decodedJWT.owner } as AuthRequest
    next()
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

const decodeJWT = ({ authorization, type }: { authorization: string; type: JWTTokenType }) => {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new ClientError('missing_jwt_secret', 'JWT secret was not provided')
  }

  const token = authorization.replace('Bearer ', '')
  const decodedJWT = jwt.verify(token, jwtSecret) as Decoded

  if (decodedJWT.type != type) {
    throw new ClientError('invalid_authentication', 'Invalid Authentication', 401)
  }

  return { decodedJWT, token }
}

const authenticate = async ({
  decodedJWT,
  query,
  detailed,
  access,
  type
}: {
  decodedJWT: Decoded
  query: FormattedQuery
  detailed: boolean
  access: Access
  type: JWTTokenType
}) => {
  const user = await findUser({
    _id: decodedJWT._id,
    owner: decodedJWT.owner,
    query,
    detailed
  })

  if (!user || (type == 'auth' && !hasDeviceAccess({ request: access, available: user.access }))) {
    throw new ClientError('invalid_authentication', 'Invalid Authentication', 401)
  }

  if (!['active', 'inactive'].includes(user.status)) {
    throw new ClientError('disabled_account', 'Account is disabled')
  }

  const role = user.role as unknown as IRole

  return { user, role }
}

const permit = ({
  role,
  status,
  path,
  method
}: {
  role: IRole | undefined
  status: string
  path: string
  method: string
}) => {
  if (!role) {
    throw new ClientError('access_forbidden', 'Access Forbidden', 403)
  }

  if (role.name == 'Admin') {
    return
  }

  if (!hasRoleAccess(role, path, method) || !['active', 'inactive'].includes(status)) {
    throw new ClientError('access_forbidden', 'Access Forbidden', 403)
  }
}

const findUser = async ({
  _id,
  owner,
  query,
  detailed
}: {
  _id: string
  owner: 'User' | 'Member'
  query: FormattedQuery
  detailed: boolean
}) => {
  const populate = detailed ? ['role', ...query.populate] : 'role'
  const select =
    detailed && query.select.length > 0
      ? ['access', 'status', ...query.select]
      : ['+access', '+status']

  if (owner == 'User') {
    return await User.findById(_id).populate(populate).select(select)
  } else if (owner == 'Member') {
    return await Member.findById(_id).populate(populate).select(select)
  } else {
    throw new ClientError('invalid_authentication', 'Invalid Authentication', 401)
  }
}

const hasRoleAccess = (role: IRole, path: string, method: string) => {
  const access = role.access.find((access) => {
    const parsedPath = parsePath(access.path)

    return new RegExp(parsedPath).test(path)
  })

  return access && access.methods.includes(method)
}

const parsePath = (path: string) => {
  return `^${path
    .split('/')
    .map((part) => {
      if (part.startsWith(':')) {
        return '[^\\/]+'
      } else if (part == '*') {
        return '.{1,}'
      } else {
        return part
      }
    })
    .join('\\/')}$`
}

const parseError = (error: unknown) => {
  if (error instanceof JsonWebTokenError) {
    return new ClientError('invalid_authentication', 'Invalid Authentication', 401)
  } else {
    return error
  }
}

export { auth as default, resetAuth, detailedAuth, AuthRequest, parsePath, decodeJWT }
