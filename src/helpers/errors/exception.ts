import { logError } from '../utils/logs'

interface ErrorData {
  status: number
  details: {
    code: string
    message: string
    data?: object
  }
}

class ClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public data?: object
  ) {
    super(message)
    this.code = code
    this.name = 'ClientError'
    this.status = status
    this.data = data
  }
}

const handleClientError = (error: unknown): ErrorData => {
  if (error instanceof ClientError) {
    return {
      status: error.status,
      details: {
        code: error.code,
        message: error.message,
        data: error.data
      }
    }
  } else {
    logError(error)

    return {
      status: 500,
      details: {
        code: 'server_error',
        message: 'Something went wrong in the server'
      }
    }
  }
}

export { handleClientError, ClientError, ErrorData }
