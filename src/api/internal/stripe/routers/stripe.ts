// Base
import express from 'express'

// Vendors
import stripe from '@vendors/stripe'

// Helpers
import { handleClientError } from '@helpers/errors/exception'
import { instanceOfString } from '@helpers/utils/interfaces'

// Actions
import { subscriptionDeleteAction, subscriptionActiveAction } from '../actions/stripe'

const router = express.Router()

router.post('/raw/stripe/webhook', async (req, res) => {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET secret')
    }

    const signature = req.headers['stripe-signature']

    if (!instanceOfString(signature)) {
      throw new Error('Missing signature in header')
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    switch (event.type) {
      case 'customer.subscription.updated': {
        if (event.data.object.status == 'active') {
          await subscriptionActiveAction({ event })
        }
        break
      }
      case 'customer.subscription.deleted':
        await subscriptionDeleteAction({ event })
        break
    }

    res.send()
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

export default router
