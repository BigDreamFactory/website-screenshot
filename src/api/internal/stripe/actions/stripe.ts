// Packages
import Stripe from 'stripe'

// Vendors
import stripe from '@vendors/stripe'

// Helpers
import { getPopulatedField } from '@helpers/utils/interfaces'

// Models
import Sender from '@api/content/senders/models/Sender'
import Member from '@api/content/members/models/member'

// Actions
import { completeActivateSubscription } from '@api/content/senders/actions/sender'

const subscriptionActiveAction = async ({
  event
}: {
  event: Stripe.CustomerSubscriptionUpdatedEvent
}) => {
  const sender = await Sender.findById(event.data.object.metadata.senderId).populate('member')

  if (!sender) {
    throw Error(`Missing sender: ${event.id}`)
  }

  const customer = await stripe.customers.retrieve(event.data.object.customer as string)

  if (customer.deleted || !customer.email) {
    throw Error(`Incorrect customer: ${event.id}`)
  }

  await completeActivateSubscription({
    customer: { email: customer.email, id: customer.id },
    sender
  })
}

const subscriptionDeleteAction = async ({
  event
}: {
  event: Stripe.CustomerSubscriptionDeletedEvent
}) => {
  const sender = await Sender.findById(event.data.object.metadata.senderId)

  if (!sender) {
    throw Error(`Missing sender: ${event.id}`)
  }

  const member = sender.member && (await getPopulatedField(sender.member, Member))

  if (!member) {
    throw Error(`Missing member: ${event.id}`)
  }

  member.plan = 'free'
  member.billing = undefined

  await member.save()
}

const createStripeSubscription = async ({
  email,
  senderId
}: {
  email: string
  senderId: string
}) => {
  const customer = await stripe.customers.create({
    email
  })

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      {
        price: process.env.STRIPE_PRICE_23_99_USD
      }
    ],
    metadata: {
      senderId
    },
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent']
  })

  const invoice = subscription.latest_invoice as Stripe.Invoice
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

  return { clientSecret: paymentIntent.client_secret }
}

export { subscriptionDeleteAction, subscriptionActiveAction, createStripeSubscription }
