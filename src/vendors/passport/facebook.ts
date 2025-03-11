import passport from 'passport'

import { Strategy as FacebookStrategy } from 'passport-facebook'

// Models
import Member from '@api/content/members/models/member'

// Handlers
// import { handleClientError } from '@helpers/errors/exception'

// Midlewares
import parseProvider from '@helpers/endpoints/middlewares/parseProvider'
import { AuthRequest } from '@middleware/auth'

// Actions
import { formatDeviceAccess } from '@helpers/endpoints/actions/user'
import sendMemberRegister from '@helpers/emails/sendMemberRegister'

const facebookAuthClientId = process.env.FACEBOOK_AUTH_CLIENT_ID || ''
const facebookAuthClientSecret = process.env.FACEBOOK_AUTH_CLIENT_SECRET || ''

passport.use(
  new FacebookStrategy(
    {
      clientID: facebookAuthClientId,
      clientSecret: facebookAuthClientSecret,
      callbackURL: '/members/auth/facebook/callback',
      passReqToCallback: true,
      profileFields: ['id', 'name', 'emails']
    },
    async function (req, _accessToken, _refreshToken, profile, done) {
      try {
        const { token, user, status } = await parseProvider({
          profile,
          model: Member,
          access: formatDeviceAccess({ info: req.userAgent, ip: req.ip })
        })

        req.auth = { user, token } as AuthRequest

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
