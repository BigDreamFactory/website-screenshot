// Base
import { Request, Response, NextFunction } from 'express'

// Actions
import { createClientLog } from '@api/internal/logs/actions/log'

const logger = (req: Request, res: Response, next: NextFunction) => {
  const send = res.send

  let responseData: object

  res.send = (data) => {
    responseData = data
    res.send = send
    return res.send(data)
  }

  res.on('finish', async () => {
    createClientLog(req, res, responseData)
  })

  next()
}

export default logger
