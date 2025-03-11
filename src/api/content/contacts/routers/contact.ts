import express from 'express'

import Contact from '../models/Contact'

// Helpers
import { loadDefaultRouters } from '@helpers/endpoints/routes/default'

const router = express.Router()

loadDefaultRouters({ router, path: 'contacts', model: Contact })

export default router
