// Base
import { Request, Response } from 'express'

// Database
import { Model } from 'mongoose'

// Packages
import { unflatten } from 'flat'

// Interfaces
import { IUser, IUserModel } from '@api/general/users/models/IUser'
import { IMember, IMemberModel } from '@api/content/members/models/IMember'

// Helpers
import { ClientError, handleClientError } from '@helpers/errors/exception'
import { merge } from '@helpers/utils/object'
import { formatDeviceAccess, sameDeviceAccess } from '../actions/user'
import sendResetPassword from '@helpers/emails/sendResetPassword'

const login = async (req: Request, res: Response, model: IUserModel | IMemberModel) => {
  const email = req.body.email as string
  const password = req.body.password as string

  try {
    if (!email) {
      throw new ClientError('missing_email', 'Missing email')
    }

    if (!password) {
      throw new ClientError('missing_password', 'Missing password')
    }

    const user = await model.findByCredentials(email, password)

    if (user.status != 'active') {
      throw new ClientError('disabled_account', 'Account is disabled')
    }

    const token = user.generateAuthToken(formatDeviceAccess({ info: req.userAgent, ip: req.ip }))
    await user.save()

    res.send({ token, user: user.sanitize(req) })
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
}

const getMe = async (req: Request, res: Response) => {
  res.send(req.auth.user.sanitize(req))
}

const updateMe = async (req: Request, res: Response) => {
  const body = req.body as IUser | IMember

  try {
    req.auth.user = merge(req.auth.user, unflatten(body), false)

    await req.auth.user.save()

    res.send(req.auth.user.sanitize(req))
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
}

const logout = async (req: Request, res: Response) => {
  try {
    if (req.auth.user.access) {
      req.auth.user.access = req.auth.user.access.filter(
        (userAccess) =>
          !sameDeviceAccess({
            request: formatDeviceAccess({ info: req.userAgent, ip: req.ip }),
            available: userAccess,
            options: { noTimeCheck: true }
          })
      )

      try {
        await req.auth.user.save()
      } catch {
        /* empty */
      }
    }

    res.send()
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
}

const forgotPassword = async <T>(req: Request, res: Response, model: Model<T>) => {
  const { email } = req.body
  try {
    if (!email) {
      throw new ClientError('missing_email', 'Missing Email')
    }

    const user = (await model.findOne({ email })) as IUser | IMember
    if (!user) {
      throw new ClientError('invalid_email', 'Invalid Email')
    }
    const resetPasswordToken = user.generateResetToken()
    await user.save()

    await sendResetPassword({
      email,
      firstName: user.details?.firstName,
      resetPasswordLink: `${process.env.CLIENT_URL}/auth/reset-password?resetPasswordToken=${resetPasswordToken}`
    })

    res.send()
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
}

const resetPassword = async (req: Request, res: Response) => {
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  try {
    if (!password || !confirmPassword) {
      throw new ClientError('missing_passwords', 'Missing Passwords')
    }
    if (password != confirmPassword) {
      throw new ClientError('passwords_do_not_match', 'Passwords Do Not Match')
    }
    req.auth.user.password = password
    await req.auth.user.save()
    res.send()
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
}

export { login, getMe, updateMe, logout, forgotPassword, resetPassword }
