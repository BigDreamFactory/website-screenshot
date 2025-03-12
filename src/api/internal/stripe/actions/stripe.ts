// Packages
import Stripe from 'stripe'

// Vendors
import stripe from '@vendors/stripe'

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

export { createStripeSubscription }
