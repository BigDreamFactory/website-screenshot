// Base
import { Express, Request, Response, NextFunction } from 'express'

// Helpers
import { logError } from '@helpers/utils/logs'

const loadErrorTracking = (app: Express) => {
  app.use((e: Error, _req: Request, _res: Response, next: NextFunction) => {
    logError(e)
    next()
  })
}

export { loadErrorTracking }
