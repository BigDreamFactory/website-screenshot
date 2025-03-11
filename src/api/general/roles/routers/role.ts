import express from 'express'

import Role from '../models/role'

import { loadDefaultRouters } from '@helpers/endpoints/routes/default'

const router = express.Router()

loadDefaultRouters({ router, path: 'roles', model: Role })

export default router
