// Base
import express, { Request, Response } from 'express'

// Package
// import passport from 'passport'

// Models
import Member from '../models/member'

// Middlewares
import { resetAuth } from '@middleware/auth'

// Helpers
import { handleClientError } from '@helpers/errors/exception'
import { loadDefaultRouters, parseError } from '@helpers/endpoints/routes/default'
import {
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword
} from '@helpers/endpoints/routes/auth'

// Actions
import { completeMemberRegistration } from '../actions/member'

const router = express.Router()

loadDefaultRouters({ router, path: 'members', model: Member })

router.post('/members/auth/login', async (req, res) => login(req, res, Member))
router.post('/members/auth/logout', async (req, res) => logout(req, res))
router.get('/members/auth/me', async (req, res) => getMe(req, res))
router.put('/members/auth/me', async (req: Request, res: Response) => updateMe(req, res))

router.post('/members/auth/register', async (req, res) => {
  try {
    const user = new Member(req.body)
    await completeMemberRegistration(req, res, user)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
})

router.post('/members/auth/forgot-password', async (req, res) => forgotPassword(req, res, Member))

router.post('/members/auth/reset-password', resetAuth, async (req, res) => resetPassword(req, res))

// router.get('/members/auth/google', (req, res, next) =>
//   passport.authenticate('google', {
//     scope: ['email', 'profile'],
//     state: req.query.callbackURL as string
//   })(req, res, next)
// )

// router.get(
//   '/members/auth/google/callback',
//   passport.authenticate('google', {
//     session: false
//   }),
//   function (req, res) {
//     const callbackURL = parseCallbackURL(req)
//     res.redirect(callbackURL)
//   }
// )

// router.get('/members/auth/facebook', (req, res, next) =>
//   passport.authenticate('facebook', {
//     scope: ['email'],
//     state: req.query.callbackURL as string
//   })(req, res, next)
// )

// router.get(
//   '/members/auth/facebook/callback',
//   passport.authenticate('facebook', {
//     session: false
//   }),
//   function (req, res) {
//     const callbackURL = parseCallbackURL(req)
//     res.redirect(callbackURL)
//   }
// )

// const parseCallbackURL = (req: Request) => {
//   if (!process.env.CLIENT_URL) {
//     throw new Error('Missing secrets')
//   }

//   if (!req.query.state) {
//     return process.env.CLIENT_URL
//   }

//   const callbackURL = new URL(`${process.env.CLIENT_URL}${req.query.state}` as string)

//   if (req.auth) {
//     callbackURL.searchParams.append('accessToken', req.auth.token)
//   } else {
//     callbackURL.searchParams.append('error', 'invalidProfile')
//   }

//   return callbackURL.href
// }

export default router
