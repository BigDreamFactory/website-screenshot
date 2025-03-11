import express from 'express'

import User from '../models/user'

import { detailedAuth, resetAuth } from '@middleware/auth'

import { loadDefaultRouters } from '@helpers/endpoints/routes/default'
import {
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword
} from '@helpers/endpoints/routes/auth'

const router = express.Router()

loadDefaultRouters({ router, path: 'users', model: User })

router.post('/users/auth/login', async (req, res) => login(req, res, User))
router.post('/users/auth/logout', async (req, res) => logout(req, res))
router.get('/users/auth/me', detailedAuth, async (req, res) => getMe(req, res))
router.put('/users/auth/me', async (req, res) => updateMe(req, res))

router.post('/users/auth/forgot-password', async (req, res) => forgotPassword(req, res, User))

router.post('/users/auth/reset-password', resetAuth, async (req, res) => resetPassword(req, res))

export default router
