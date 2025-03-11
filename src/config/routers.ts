import { Express } from 'express'

import index from '@api/index'
import userRouter from '@api/general/users/routers/user'
import roleRouter from '@api/general/roles/routers/role'
// import assetRouter from '@api/general/assets/routers/asset'
import emailRouter from '@api/internal/emails/routers/email'
import memberRouter from '@api/content/members/routers/member'

// import stripeRouter from '@api/internal/stripe/routers/stripe'

import contactRouter from '@api/content/contacts/routers/contact'

import logRouter from '@api/internal/logs/routers/log'

import listRouters from '@helpers/endpoints/routes/listRouters'

// Middleware
import auth from '@middleware/auth'
import logger from '@middleware/logger'
// import blocker from '@middleware/blocker'

const loadRouters = (app: Express) => {
  app.use(index)

  // if (process.env.NODE_ENV != 'production') {
  //   app.all('*', blocker)
  // }

  app.all('*', logger)

  app.all('*', auth)

  app.use(userRouter)
  app.use(roleRouter)
  // app.use(assetRouter)
  app.use(emailRouter)
  app.use(memberRouter)

  // app.use(stripeRouter)

  app.use(contactRouter)

  app.use(logRouter)

  listRouters(app)
}

export default loadRouters
