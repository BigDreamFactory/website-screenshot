import passport from 'passport'

import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

// Models
import Member from '@api/content/members/models/member'

// Handlers
// import { handleClientError } from '@helpers/errors/exception'

// Middlewares
import { AuthRequest } from '@middleware/auth'
import parseProvider from '@helpers/endpoints/middlewares/parseProvider'

// Actions
import { formatDeviceAccess } from '@helpers/endpoints/actions/user'
import sendMemberRegister from '@helpers/emails/sendMemberRegister'

const googleAuthClientId = process.env.GOOGLE_AUTH_CLIENT_ID || ''
const googleAuthClientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET || ''

passport.use(
  new GoogleStrategy(
    {
      clientID: googleAuthClientId,
      clientSecret: googleAuthClientSecret,
      callbackURL: '/members/auth/google/callback',
      passReqToCallback: true
    },
    async function (req, _accessToken, _refreshToken, profile, done) {
      try {
        const { token, user, status } = await parseProvider({
          profile,
          model: Member,
          access: formatDeviceAccess({ info: req.userAgent, ip: req.ip })
        })
        req.auth = { token, user } as AuthRequest

        if (status == 'created') {
          await sendMemberRegister({
            email: user.email,
            firstName: user.details?.firstName
          })
        }

        return done(null, user)
      } catch (error) {
        // const { details } = handleClientError(error)
        return done(null, true)
      }
    }
  )
)
