import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('Missing secrets')
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' })

export { stripe as default }
