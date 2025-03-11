// Actions
import { createServerLog } from '@api/internal/logs/actions/log'

const logInfo = (message: string) => {
  if (process.env.NODE_ENV != 'production') {
    logger('⚡️', 'Info', message)
  } else {
    createServerLog({ type: 'info', details: { message } })
  }
}

const logError = (error: unknown) => {
  if (process.env.NODE_ENV != 'production') {
    logger('❌', 'Error', error)
  } else {
    createServerLog({ type: 'error', details: error })
  }
}

const logger = (icon: string, type: string, message: unknown) => {
  console.log(`${icon} [${type}] ↓`)
  console.log(message)
}

export { logInfo, logError }
