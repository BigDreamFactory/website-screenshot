import express from 'express'

import Log from '../models/Log'

// Helpers
import { loadDefaultRouters } from '@helpers/endpoints/routes/default'

const router = express.Router()

loadDefaultRouters({ router, path: 'logs', model: Log })

export default router
