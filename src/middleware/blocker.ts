// Base
import { Request, Response, NextFunction } from 'express'

const blocker = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.get('handshake') != 'website-screenshot' &&
    req.query.handshake != 'website-screenshot' &&
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
