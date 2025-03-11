// Load .env variables
import dotenv from 'dotenv'
dotenv.config()

import 'express-async-errors'

// Express
import express from 'express'
import fileUpload from 'express-fileupload'

// Load configurations
import loadCORS from '@config/cors'
import loadRouters from '@config/routers'
import { loadErrorTracking } from '@config/tracking'

import '@config/passports'

// Load database
import '@db/mongoose'

// Load cron
import '@config/cron'

import { logInfo } from '@helpers/utils/logs'

// import '@vendors/openai/assistants'

const app = express()
const port = process.env.PORT || '8000'

app.enable('trust proxy')

app.use(
  fileUpload({
    defCharset: 'utf8',
    defParamCharset: 'utf8'
  })
)

app.use((req, res, next) => {
  const type = req.originalUrl.startsWith('/raw/') ? 'raw' : 'json'
  express[type]({ type: 'application/json', limit: '10mb' })(req, res, next)
})

loadCORS(app)
loadRouters(app)

app.use('/public', express.static('src/public'))

loadErrorTracking(app)

app.listen(port, () => {
  logInfo(`Server is running on version: ${process.env.npm_package_version}`)
})
