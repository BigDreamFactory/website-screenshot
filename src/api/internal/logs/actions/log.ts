// Base
import { Request, Response } from 'express'

// Models
import Log from '../models/Log'
import { LogType } from '../models/ILog'

interface Data extends Document {
  [key: string]: unknown
}

const createClientLog = (req: Request, res: Response, responseData: object) => {
  if (process.env.NODE_ENV == 'production' && ![200, 201, 304, 302].includes(res.statusCode)) {
    const clientLog = new Log({
      type: 'info',
      details: {
        request: {
          path: req.path,
          query: sanitize(req.query),
          body: sanitize(req.body),
          userAgent: req.userAgent,
          ip: req.ip,
          user: req.auth?.user._id
        },
        response: {
          statusCode: res.statusCode,
          data: responseData,
          version: process.env.npm_package_version
        }
      },
      project: 'website-screenshot-server@client',
      version: process.env.npm_package_version
    })
    clientLog.save()
  }
}

const createServerLog = ({ type, details }: { type: LogType; details: unknown }) => {
  const serverLog = new Log({
    type,
    details,
    project: 'website-screenshot-server@server',
    version: process.env.npm_package_version
  })
  serverLog.save()
}

const sanitize = (data: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, confirmPassword, ...sanitizedData } = data as Data

  return sanitizedData
}

export { createClientLog, createServerLog }
