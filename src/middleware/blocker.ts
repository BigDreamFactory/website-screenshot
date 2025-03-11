// Base
import { Request, Response, NextFunction } from 'express'

const blocker = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.get('handshake') != 'handshake' &&
    req.query.handshake != 'handshake' &&
    req.path != '/members/auth/google/callback' &&
    req.path != '/members/auth/facebook/callback' &&
    !req.path.includes('/assets/') &&
    !req.path.includes('/public/')
  ) {
    res.sendStatus(405)
  } else {
    next()
  }
}

export default blocker
