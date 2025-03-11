import { AuthRequest } from '@middleware/auth'

declare global {
  namespace Express {
    interface Request {
      auth: AuthRequest
      userAgent: string
    }
  }
}
